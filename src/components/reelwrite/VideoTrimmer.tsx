"use client";

import { useRef, useState, useEffect } from "react";
import { Film, Scissors, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoTrimmerProps {
  onTrimmed: (dataUrl: string, duration: number, sizeMB: number) => void;
  onCancel: () => void;
}

const TARGET_DURATION = 7; // seconds
const MAX_INPUT_SIZE_MB = 50;

export function VideoTrimmer({ onTrimmed, onCancel }: VideoTrimmerProps) {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [trimming, setTrimming] = useState(false);
  const [trimmedUrl, setTrimmedUrl] = useState<string>("");
  const [error, setError] = useState("");
  const [previewTime, setPreviewTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  // Max start time (so start + 7 = end of video)
  const maxStart = Math.max(0, duration - TARGET_DURATION);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setTrimmedUrl("");

    if (!file.type.startsWith("video/")) {
      setError("Please select a video file");
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_INPUT_SIZE_MB) {
      setError(`Video is ${sizeMB.toFixed(1)}MB — max is ${MAX_INPUT_SIZE_MB}MB. Try a shorter or lower quality video.`);
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setStartTime(0);
  }

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;
    const dur = video.duration;
    setDuration(dur);
    // Default start at 0 (or middle of video if long)
    const defaultStart = dur > TARGET_DURATION * 2 ? (dur - TARGET_DURATION) / 2 : 0;
    setStartTime(defaultStart);
    if (video) {
      video.currentTime = defaultStart;
    }
  }

  function handleStartChange(value: number) {
    setStartTime(value);
    if (videoRef.current) {
      videoRef.current.currentTime = value;
      setPreviewTime(value);
    }
  }

  function playPreview() {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.currentTime = startTime;
      video.play();
      setIsPlaying(true);
    }
  }

  // Auto-pause after 7 seconds of preview
  useEffect(() => {
    if (!isPlaying || !videoRef.current) return;
    const video = videoRef.current;
    const onTimeUpdate = () => {
      setPreviewTime(video.currentTime);
      if (video.currentTime >= startTime + TARGET_DURATION) {
        video.pause();
        video.currentTime = startTime;
        setIsPlaying(false);
      }
    };
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [isPlaying, startTime]);

  // Trim the video to 7 seconds using canvas + MediaRecorder
  async function trimVideo() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setTrimming(true);
    setError("");

    try {
      // Set canvas size to video dimensions (max 720p to keep file small)
      const maxWidth = 720;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Get audio stream from the video element
      let audioStream: MediaStream | null = null;
      try {
        // @ts-ignore - captureStream is supported but not typed
        const videoWithCapture = video as any;
        if (videoWithCapture.captureStream) {
          const fullStream = videoWithCapture.captureStream();
          audioStream = new MediaStream(fullStream.getAudioTracks());
        }
      } catch {
        // No audio — that's fine
      }

      // Create canvas stream for video
      const canvasStream = canvas.captureStream(30); // 30 FPS

      // Combine video + audio streams
      const combinedTracks = [...canvasStream.getVideoTracks()];
      if (audioStream) {
        combinedTracks.push(...audioStream.getAudioTracks());
      }
      const combinedStream = new MediaStream(combinedTracks);

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
          ? "video/webm;codecs=vp8"
          : "video/webm";

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 2_000_000, // 2 Mbps — good quality, small file
      });
      recorderRef.current = recorder;

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const sizeMB = blob.size / (1024 * 1024);
          setTrimmedUrl(dataUrl);
          setTrimming(false);
        };
        reader.readAsDataURL(blob);
      };

      // Seek to start time and start recording
      video.currentTime = startTime;
      video.muted = false;
      video.volume = 1;

      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
      });

      // Start recording
      recorder.start();

      // Draw frames to canvas
      const drawFrame = () => {
        if (video.currentTime >= startTime + TARGET_DURATION || recorder.state === "inactive") {
          recorder.stop();
          video.pause();
          video.muted = true;
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawFrame);
      };

      video.play();
      drawFrame();

      // Safety timeout — stop after 10 seconds no matter what
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          video.pause();
        }
      }, 10000);
    } catch (e) {
      setError("Could not trim this video. Try a different format (MP4 works best).");
      setTrimming(false);
    }
  }

  function confirmTrimmed() {
    if (!trimmedUrl) return;
    const sizeBytes = (trimmedUrl.length * 0.75); // base64 to bytes
    const sizeMB = sizeBytes / (1024 * 1024);
    onTrimmed(trimmedUrl, TARGET_DURATION, sizeMB);
  }

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // If trimmed, show preview + confirm
  if (trimmedUrl) {
    return (
      <div className="space-y-3">
        <div className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          Trimmed to 7 seconds ✨
        </div>
        <div className="relative rounded-lg overflow-hidden border border-white/10">
          <video
            src={trimmedUrl}
            className="w-full h-40 object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute top-1.5 left-1.5 rounded-full bg-emerald-500/80 px-2 py-0.5 text-[10px] font-bold text-white">
            ✂️ 7.0s · trimmed
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10"
            onClick={() => { setTrimmedUrl(""); }}
          >
            <X className="w-3.5 h-3.5 mr-1" /> Redo
          </Button>
          <Button
            type="button"
            className="flex-1 bg-amber-400 text-black hover:bg-amber-300 font-bold"
            onClick={confirmTrimmed}
          >
            <Check className="w-3.5 h-3.5 mr-1" /> Use this clip
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* File input — if no video selected yet */}
      {!videoUrl && (
        <label className={cn(
          "flex items-center justify-center gap-1.5 rounded-lg py-3 text-xs font-semibold transition-colors cursor-pointer",
          "bg-amber-400/15 text-amber-400 hover:bg-amber-400/25"
        )}>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Film className="w-4 h-4" /> Upload any video (up to {MAX_INPUT_SIZE_MB}MB, any length)
        </label>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Video preview + trimmer */}
      {videoUrl && (
        <>
          <div className="relative rounded-lg overflow-hidden border border-white/10">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-40 object-cover"
              onLoadedMetadata={handleLoadedMetadata}
              playsInline
              muted
            />
            {/* Play/pause button */}
            <button
              onClick={playPreview}
              className="absolute inset-0 flex items-center justify-center bg-black/30"
            >
              <span className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center text-white">
                {isPlaying ? "⏸" : "▶"}
              </span>
            </button>
            {/* Duration badge */}
            <div className="absolute top-1.5 right-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
              {formatTime(duration)}
            </div>
          </div>

          {/* Timeline scrubber */}
          {duration > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] text-white/50 text-center">
                Drag to choose which 7 seconds to use
              </div>

              {/* Visual timeline */}
              <div className="relative h-12 rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                {/* Selected region (7 seconds) */}
                <div
                  className="absolute top-0 bottom-0 bg-amber-400/30 border-x-2 border-amber-400"
                  style={{
                    left: `${(startTime / duration) * 100}%`,
                    width: `${(TARGET_DURATION / duration) * 100}%`,
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 text-center text-[9px] text-amber-400 font-bold pt-1">
                    7s clip
                  </div>
                </div>

                {/* Time markers */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 pb-0.5 text-[8px] text-white/40">
                  <span>0:00</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={0}
                max={maxStart}
                step={0.1}
                value={startTime}
                onChange={(e) => handleStartChange(parseFloat(e.target.value))}
                className="w-full accent-amber-400"
              />

              {/* Start time display */}
              <div className="flex items-center justify-between text-[10px] text-white/50">
                <span>Start: {formatTime(startTime)}</span>
                <span>End: {formatTime(startTime + TARGET_DURATION)}</span>
              </div>
            </div>
          )}

          {/* Trim button */}
          {duration > 0 && (
            <Button
              type="button"
              onClick={trimVideo}
              disabled={trimming}
              className="w-full bg-amber-400 text-black hover:bg-amber-300 font-bold py-2.5"
            >
              {trimming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Trimming to 7 seconds…
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4 mr-2" />
                  Trim to 7 seconds
                </>
              )}
            </Button>
          )}

          {/* Cancel */}
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-[11px] text-white/40 hover:text-white/70"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
}
