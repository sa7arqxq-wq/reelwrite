"use client";

/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 *
 * Reusable Avatar component — renders a user's profile photo if they have one,
 * otherwise falls back to the emoji + color avatar.
 */

import { cn } from "@/lib/utils";

interface AvatarProps {
  image?: string | null;
  avatarColor: string;
  avatarEmoji: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  ring?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-9 h-9 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-12 h-12 text-xl",
  xl: "w-20 h-20 text-3xl",
};

export function Avatar({
  image,
  avatarColor,
  avatarEmoji,
  size = "md",
  className,
  ring = true,
}: AvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const ringClass = ring ? "ring-2 ring-white/10" : "";

  if (image) {
    return (
      <img
        src={image}
        alt="Profile photo"
        className={cn(
          "rounded-full object-cover shrink-0",
          sizeClass,
          ringClass,
          className
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex rounded-full items-center justify-center shrink-0",
        sizeClass,
        ringClass,
        className
      )}
      style={{ background: avatarColor }}
    >
      {avatarEmoji}
    </span>
  );
}
