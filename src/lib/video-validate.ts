"use client";

/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * Video validation and processing helper.
 * Validates that uploaded videos are ≤7 seconds and ≤5MB.
 */

const MAX_DURATION_SECONDS = 7;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface VideoValidationResult {
  ok: boolean;
  error?: string;
  duration?: number;
  sizeMB?: number;
}

/**
 * Validate a video file: checks duration (≤7s) and file size (≤5MB).
 * Returns the video as a base64 data URL if valid.
 */
export async function validateAndReadVideo(file: File): Promise<{ validation: VideoValidationResult; dataUrl: string | null }> {
  // Check file type
  if (!file.type.startsWith("video/")) {
    return { validation: { ok: false, error: "File must be a video" }, dataUrl: null };
  }

  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      validation: { ok: false, error: `Video is ${sizeMB.toFixed(1)}MB — max is ${MAX_FILE_SIZE_MB}MB. Try a shorter clip or lower quality.` },
      dataUrl: null,
    };
  }

  // Check duration by loading the video element
  const durationCheck = await new Promise<VideoValidationResult>((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      if (isNaN(duration) || duration <= 0) {
        resolve({ ok: false, error: "Could not read video duration" });
        return;
      }
      if (duration > MAX_DURATION_SECONDS + 0.5) {
        // 0.5s tolerance
        resolve({
          ok: false,
          error: `Video is ${duration.toFixed(1)}s — must be ${MAX_DURATION_SECONDS}s or shorter. Trim it and try again.`,
        });
        return;
      }
      resolve({ ok: true, duration, sizeMB });
    };
    video.onerror = () => {
      resolve({ ok: false, error: "Could not load video. Try a different format (MP4 works best)." });
    };
    video.src = URL.createObjectURL(file);
  });

  if (!durationCheck.ok) {
    return { validation: durationCheck, dataUrl: null };
  }

  // Read as data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Could not read video file"));
    reader.readAsDataURL(file);
  });

  return { validation: durationCheck, dataUrl };
}
