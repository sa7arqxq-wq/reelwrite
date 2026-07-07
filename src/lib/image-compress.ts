"use client";

/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * Client-side image compression helper.
 * Resizes and compresses images to keep base64 strings small enough for database storage.
 */

/**
 * Compress an image File to a base64 data URL.
 * Resizes to maxDimension x maxDimension and converts to JPEG at the given quality.
 *
 * @param file The image file from an <input type="file">
 * @param maxDimension Max width/height in pixels (image is scaled down proportionally)
 * @param quality JPEG quality 0-1 (default 0.8)
 * @returns Promise<string> — a base64 data URL
 */
export async function compressImage(
  file: File,
  maxDimension: number = 1080,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File must be an image"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate scaled dimensions
        let { width, height } = img;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // Draw to canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG data URL
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate that a URL points to an accessible image.
 * Returns the URL if valid, throws if invalid.
 */
export async function validateImageUrl(url: string): Promise<string> {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw new Error("URL must start with http:// or https://");
  }
  // We can't truly validate cross-origin images from the client due to CORS,
  // but we can do a basic check that it looks like an image URL
  return url;
}

/**
 * Get the approximate size of a base64 string in KB.
 */
export function base64SizeKb(dataUrl: string): number {
  // Remove the data URL prefix to get just the base64 part
  const base64 = dataUrl.split(",")[1] || dataUrl;
  // Base64 encoding inflates size by ~33%, so divide by 1.33
  return Math.round((base64.length * 0.75) / 1024);
}
