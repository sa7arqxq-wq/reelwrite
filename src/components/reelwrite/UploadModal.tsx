/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This source code is the proprietary work of ReelWrite. No part of this
 * software may be copied, reproduced, distributed, or used to create
 * derivative works without the express written permission of ReelWrite.
 * Unauthorized use, duplication, or distribution is prohibited.
 *
 * For licensing inquiries: legal@reelwrite.app
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, Sparkles, Loader2, Check, Wand2, ImageIcon, Link2, Video, Film } from "lucide-react";
import { MOODS, MOOD_LIST, type Mood } from "@/lib/moods";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { compressImage, validateImageUrl } from "@/lib/image-compress";
import { validateAndReadVideo } from "@/lib/video-validate";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  onCreated: () => void;
}

export function UploadModal({
  open,
  onOpenChange,
  currentUserId,
  onCreated,
}: UploadModalProps) {
  const [hook, setHook] = useState("");
  const [caption, setCaption] = useState("");
  const [mood, setMood] = useState<Mood>("amber");
  const [background, setBackground] = useState<"mood" | "cover" | "image" | "video">("mood");
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [videoData, setVideoData] = useState<string>("");
  const [videoMeta, setVideoMeta] = useState<{ duration: number; sizeMB: number } | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [bookGenre, setBookGenre] = useState("Fiction");
  const [bookLink, setBookLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Pitch-to-reel generator state
  const [mode, setMode] = useState<"manual" | "extract" | "ai">("manual");
  const [pitch, setPitch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [suggestedHooks, setSuggestedHooks] = useState<string[]>([]);
  const [suggestedMood, setSuggestedMood] = useState<Mood | null>(null);
  const [suggestedCaption, setSuggestedCaption] = useState<string | null>(null);
  const [hookSource, setHookSource] = useState<"extract" | "ai" | null>(null);
  const { toast } = useToast();

  const HOOK_LIMIT = 5000;
  const isOver = hook.length > HOOK_LIMIT;

  async function generateFromPitch(useAI: boolean) {
    if (pitch.trim().length < 10) {
      toast({
        title: "Pitch too short",
        description: "Paste at least a sentence of your book's blurb.",
        variant: "destructive",
      });
      return;
    }
    setGenerating(true);
    setSuggestedHooks([]);
    setSuggestedMood(null);
    setSuggestedCaption(null);
    setHookSource(null);
    try {
      const endpoint = useAI ? "/api/reels/generate-ai" : "/api/reels/generate";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitch: pitch.trim(), genre: bookGenre }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Couldn't generate",
          description: data.error || "Try a different pitch.",
          variant: "destructive",
        });
        return;
      }
      setSuggestedHooks(data.hooks || []);
      setSuggestedMood(data.mood as Mood);
      setSuggestedCaption(data.caption);
      setHookSource((data.source as "extract" | "ai") || (useAI ? "ai" : "extract"));
      if (data.hooks?.length > 0) {
        setHook(data.hooks[0]);
      }
      if (data.mood) {
        setMood(data.mood as Mood);
      }
      if (data.caption) {
        setCaption(data.caption);
      }
      toast({
        title: useAI ? "AI hooks generated ✨" : "Hooks extracted ✨",
        description: `${data.hooks?.length || 0} candidates${data.source === "ai" ? " (AI-rewritten)" : ""}. Pick your favorite.`,
      });
    } catch {
      toast({
        title: "Generation failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleImageUpload(file: File) {
    setImageUploading(true);
    try {
      const dataUrl = await compressImage(file, 1080, 0.8);
      setBackgroundImage(dataUrl);
      setBackground("image");
      toast({ title: "Image uploaded", description: `${Math.round(dataUrl.length * 0.75 / 1024)}KB — ready to use.` });
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Could not process image",
        variant: "destructive",
      });
    } finally {
      setImageUploading(false);
    }
  }

  async function handleImageUrl() {
    const url = prompt("Paste an image URL (https://…):");
    if (!url) return;
    try {
      const valid = await validateImageUrl(url);
      setBackgroundImage(valid);
      setBackground("image");
      toast({ title: "Image URL set", description: "Using image from URL." });
    } catch (e) {
      toast({
        title: "Invalid URL",
        description: e instanceof Error ? e.message : "Could not use that URL",
        variant: "destructive",
      });
    }
  }

  async function handleVideoUpload(file: File) {
    setVideoUploading(true);
    try {
      const { validation, dataUrl } = await validateAndReadVideo(file);
      if (!validation.ok || !dataUrl) {
        toast({
          title: "Video rejected",
          description: validation.error || "Could not process video",
          variant: "destructive",
        });
        return;
      }
      setVideoData(dataUrl);
      setVideoMeta({ duration: validation.duration!, sizeMB: validation.sizeMB! });
      setBackground("video");
      toast({
        title: "Video ready ✨",
        description: `${validation.duration!.toFixed(1)}s · ${validation.sizeMB!.toFixed(1)}MB`,
      });
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Could not process video",
        variant: "destructive",
      });
    } finally {
      setVideoUploading(false);
    }
  }

  async function submit() {
    if (!hook.trim() || isOver) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reels/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: currentUserId,
          hook: hook.trim(),
          caption: caption.trim(),
          mood,
          duration: 7,
          background: bookTitle.trim() || background === "image" || background === "video" ? background : "mood",
          backgroundImage: background === "image" ? backgroundImage : undefined,
          videoUrl: background === "video" ? videoData : undefined,
          bookTitle: bookTitle.trim() || undefined,
          bookGenre,
          bookLink,
        }),
      });
      if (!res.ok) throw new Error("upload failed");
      // Reset
      setHook("");
      setCaption("");
      setBookTitle("");
      setBookLink("");
      setBookGenre("Fiction");
      setMood("amber");
      setBackground("mood");
      setBackgroundImage("");
      setVideoData("");
      setVideoMeta(null);
      setMode("manual");
      setPitch("");
      setSuggestedHooks([]);
      setSuggestedMood(null);
      setSuggestedCaption(null);
      setHookSource(null);
      onOpenChange(false);
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Create a 7-second reel
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Write a hook, quote, or first line. We&apos;ll animate it into a 7-second
            reel that grabs readers and sells your book.
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle: Manual vs Extract vs AI Rewrite */}
        <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10 mb-3">
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1",
              mode === "manual"
                ? "bg-amber-400 text-black"
                : "text-white/60 hover:text-white"
            )}
          >
            <Sparkles className="w-3 h-3" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode("extract")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1",
              mode === "extract"
                ? "bg-amber-400 text-black"
                : "text-white/60 hover:text-white"
            )}
          >
            <Wand2 className="w-3 h-3" />
            Extract
          </button>
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1",
              mode === "ai"
                ? "bg-violet-500 text-white"
                : "text-white/60 hover:text-white"
            )}
          >
            <span className="text-xs">🤖</span>
            AI Rewrite
          </button>
        </div>

        <div className="space-y-5 py-2">
          {/* EXTRACT + AI MODES — paste your book pitch */}
          {(mode === "extract" || mode === "ai") && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="pitch" className="text-sm font-semibold">
                  {mode === "ai" ? "Paste your book's pitch — AI will rewrite it into hooks" : "Paste your book's pitch or blurb"}
                </Label>
                <Textarea
                  id="pitch"
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  placeholder="When the stars go dark, one lighthouse keeper must light the way home. But on the forty-first year, the dark starts keeping her company..."
                  rows={5}
                  className={cn(
                    "bg-white/5 border-white/15 text-white placeholder:text-white/35",
                    "focus-visible:ring-amber-400/50 resize-none text-sm"
                  )}
                />
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/45">
                    We&apos;ll extract the punchiest lines as 7-second hook candidates.
                  </span>
                  <span className="text-white/45 font-mono">{pitch.length}/5000</span>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => generateFromPitch(mode === "ai")}
                disabled={generating || pitch.trim().length < 10}
                className={cn(
                  "w-full font-bold py-2.5",
                  mode === "ai"
                    ? "bg-violet-500 text-white hover:bg-violet-600"
                    : "bg-amber-400 text-black hover:bg-amber-300"
                )}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {mode === "ai" ? "AI is writing hooks…" : "Finding hooks…"}
                  </>
                ) : (
                  <>
                    {mode === "ai" ? (
                      <>
                        <span className="mr-1">🤖</span>
                        Generate AI hooks
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Extract hooks from pitch
                      </>
                    )}
                  </>
                )}
              </Button>

              {/* Suggested hooks */}
              {suggestedHooks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Pick your favorite ({suggestedHooks.length} candidates)
                    {hookSource === "ai" && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 text-[9px] font-bold">
                        🤖 AI-rewritten
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {suggestedHooks.map((h, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setHook(h)}
                        className={cn(
                          "w-full text-left rounded-lg p-2.5 border transition-all text-sm",
                          hook === h
                            ? "border-amber-400 bg-amber-400/10 text-white"
                            : "border-white/10 bg-white/[0.03] text-white/80 hover:border-white/30"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5",
                              hook === h
                                ? "bg-amber-400 text-black"
                                : "bg-white/10 text-white/60"
                            )}
                          >
                            {i + 1}
                          </span>
                          <span className="font-serif">{h}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {suggestedMood && (
                    <div className="text-[11px] text-white/55 pt-1">
                      ✨ Suggested mood: <span className="font-semibold text-amber-400">{MOODS[suggestedMood].label}</span>
                      {suggestedCaption && (
                        <span> · Suggested caption: &ldquo;{suggestedCaption}&rdquo;</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* The hook field — shown in both modes (the chosen/generated hook lands here) */}
          {(mode === "manual" || suggestedHooks.length > 0) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="hook" className="text-sm font-semibold">
                Your 7-second hook
              </Label>
              <Badge
                variant="outline"
                className={cn(
                  "font-mono text-[10px]",
                  isOver
                    ? "border-rose-500 text-rose-400"
                    : "border-white/20 text-white/60"
                )}
              >
                {hook.length}/{HOOK_LIMIT}
              </Badge>
            </div>
            <Textarea
              id="hook"
              value={hook}
              onChange={(e) => {
                setHook(e.target.value);
              }}
              placeholder="She kept the light on for forty years — and on the forty-first, the dark kept it company."
              rows={3}
              className={cn(
                "bg-white/5 border-white/15 text-white placeholder:text-white/35",
                "focus-visible:ring-amber-400/50 resize-none font-serif text-base"
              )}
            />
            <div className="flex items-center gap-1.5 text-[11px] text-white/50">
              <Timer className="w-3 h-3" />
              This will play for exactly 7 seconds. Keep it punchy — one image,
              one line, one promise.
            </div>
          </div>
          )}

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption" className="text-sm font-semibold">
              Caption <span className="text-white/40 font-normal">(optional)</span>
            </Label>
            <Input
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Read the first chapter free. 🌑"
              className="bg-white/5 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-amber-400/50"
            />
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Mood</Label>
            <div className="grid grid-cols-3 gap-2">
              {MOOD_LIST.map((m) => {
                const data = MOODS[m];
                const selected = mood === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={cn(
                      "relative rounded-lg p-2.5 text-left border transition-all",
                      selected
                        ? "border-transparent ring-2"
                        : "border-white/10 hover:border-white/30"
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${data.from}, ${data.to})`,
                      ...(selected
                        ? ({ "--tw-ring-color": data.accent } as React.CSSProperties)
                        : {}),
                    }}
                  >
                    <div className="text-lg">{data.emoji}</div>
                    <div
                      className="text-[11px] font-semibold mt-0.5"
                      style={{ color: data.accent }}
                    >
                      {data.label}
                    </div>
                    {selected && (
                      <Check
                        className="absolute top-1.5 right-1.5 w-3.5 h-3.5"
                        style={{ color: data.accent }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional book attachment */}
          <div className="space-y-3 rounded-xl bg-white/[0.03] border border-white/10 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-base">📖</span>
              Attach a book <span className="text-white/40 font-normal">(optional)</span>
            </div>
            <Input
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="Book title (e.g. The Last Lighthouse)"
              className="bg-white/5 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-amber-400/50"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={bookGenre}
                onChange={(e) => setBookGenre(e.target.value)}
                placeholder="Genre"
                className="bg-white/5 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-amber-400/50"
              />
              <Input
                value={bookLink}
                onChange={(e) => setBookLink(e.target.value)}
                placeholder="Buy link (https://…)"
                className="bg-white/5 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-amber-400/50"
              />
            </div>

            {/* Background choice — always shown */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-semibold">Reel background</Label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setBackground("mood")}
                  className={cn(
                    "rounded-lg p-2 text-left border transition-all",
                    background === "mood"
                      ? "border-amber-400 ring-2 ring-amber-400/30 bg-amber-400/5"
                      : "border-white/10 hover:border-white/30"
                  )}
                >
                  <div className="text-sm">🎨</div>
                  <div className="text-[11px] font-semibold mt-0.5">Mood</div>
                </button>
                <button
                  type="button"
                  onClick={() => setBackground("cover")}
                  disabled={!bookTitle.trim()}
                  className={cn(
                    "rounded-lg p-2 text-left border transition-all",
                    background === "cover"
                      ? "border-amber-400 ring-2 ring-amber-400/30 bg-amber-400/5"
                      : "border-white/10 hover:border-white/30",
                    !bookTitle.trim() && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <div className="text-sm">📖</div>
                  <div className="text-[11px] font-semibold mt-0.5">Cover</div>
                </button>
                <button
                  type="button"
                  onClick={() => setBackground("image")}
                  className={cn(
                    "rounded-lg p-2 text-left border transition-all",
                    background === "image"
                      ? "border-amber-400 ring-2 ring-amber-400/30 bg-amber-400/5"
                      : "border-white/10 hover:border-white/30"
                  )}
                >
                  <div className="text-sm">🖼️</div>
                  <div className="text-[11px] font-semibold mt-0.5">Image</div>
                </button>
                <button
                  type="button"
                  onClick={() => setBackground("video")}
                  className={cn(
                    "rounded-lg p-2 text-left border transition-all",
                    background === "video"
                      ? "border-amber-400 ring-2 ring-amber-400/30 bg-amber-400/5"
                      : "border-white/10 hover:border-white/30"
                  )}
                >
                  <div className="text-sm">🎬</div>
                  <div className="text-[11px] font-semibold mt-0.5">Video</div>
                </button>
              </div>

              {/* Image background controls */}
              {background === "image" && (
                <div className="space-y-2 pt-1">
                  {backgroundImage ? (
                    <div className="relative rounded-lg overflow-hidden border border-white/10">
                      <img
                        src={backgroundImage}
                        alt="Background preview"
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setBackgroundImage("")}
                        className="absolute top-1.5 right-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-500"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                      />
                      <span className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors",
                        "bg-amber-400/15 text-amber-400 hover:bg-amber-400/25",
                        imageUploading && "opacity-50 pointer-events-none"
                      )}>
                        {imageUploading ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</>
                        ) : (
                          <><ImageIcon className="w-3.5 h-3.5" /> Upload from phone</>
                        )}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={handleImageUrl}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                    >
                      <Link2 className="w-3.5 h-3.5" /> Paste URL
                    </button>
                  </div>
                  <p className="text-[10px] text-white/40">
                    Upload any image from your device, or paste a URL from the internet. Image is resized to max 1080px.
                  </p>
                </div>
              )}

              {/* Video background controls */}
              {background === "video" && (
                <div className="space-y-2 pt-1">
                  {videoData ? (
                    <div className="relative rounded-lg overflow-hidden border border-white/10">
                      <video
                        src={videoData}
                        className="w-full h-32 object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                      {videoMeta && (
                        <div className="absolute top-1.5 left-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                          {videoMeta.duration.toFixed(1)}s · {videoMeta.sizeMB.toFixed(1)}MB
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => { setVideoData(""); setVideoMeta(null); }}
                        className="absolute top-1.5 right-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-500"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                  <label className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-colors cursor-pointer",
                    "bg-amber-400/15 text-amber-400 hover:bg-amber-400/25",
                    videoUploading && "opacity-50 pointer-events-none"
                  )}>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleVideoUpload(file);
                      }}
                    />
                    {videoUploading ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing video…</>
                    ) : (
                      <><Film className="w-3.5 h-3.5" /> Upload 7-second video from phone</>
                    )}
                  </label>
                  <p className="text-[10px] text-white/40">
                    Upload any video that&apos;s <strong>7 seconds or shorter</strong> and <strong>15MB or smaller</strong>.
                    Any format works (MP4, MOV, WEBM, etc). The video loops as your reel background with the hook text overlaid.
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={submit}
            disabled={!hook.trim() || isOver || submitting}
            className="w-full bg-amber-400 text-black hover:bg-amber-300 font-bold py-3"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Publish my 7-second reel
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
