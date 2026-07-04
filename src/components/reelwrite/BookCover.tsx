"use client";

import { cn } from "@/lib/utils";

interface BookCoverProps {
  title: string;
  subtitle?: string;
  coverColor: string;
  coverAccent: string;
  coverEmoji: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * A CSS-rendered book cover — spine + cover face with emoji crest.
 * No image assets required; works for any book in the catalog.
 */
export function BookCover({
  title,
  subtitle,
  coverColor,
  coverAccent,
  coverEmoji,
  className,
  size = "md",
}: BookCoverProps) {
  const dims =
    size === "sm"
      ? "w-16 h-24"
      : size === "lg"
        ? "w-32 h-48"
        : "w-24 h-36";

  return (
    <div
      className={cn(
        "relative shrink-0 rounded-r-md rounded-l-sm shadow-2xl overflow-hidden",
        dims,
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${coverColor} 0%, ${coverColor} 60%, rgba(0,0,0,0.4) 100%)`,
        boxShadow: `0 10px 30px -10px rgba(0,0,0,0.8), 0 0 0 1px ${coverAccent}22`,
      }}
      aria-label={`Book cover: ${title}`}
    >
      {/* Spine */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{
          background: `linear-gradient(180deg, ${coverAccent}55 0%, ${coverAccent}22 50%, ${coverAccent}55 100%)`,
        }}
      />
      {/* Cover face */}
      <div className="absolute inset-0 flex flex-col items-center justify-between p-2 pl-3 text-center">
        <div
          className="text-[8px] uppercase tracking-[0.2em] font-semibold opacity-80"
          style={{ color: coverAccent }}
        >
          {subtitle || "A Book"}
        </div>
        <div className="text-2xl drop-shadow">{coverEmoji}</div>
        <div
          className="text-[10px] font-serif font-bold leading-tight line-clamp-3"
          style={{ color: coverAccent }}
        >
          {title}
        </div>
      </div>
      {/* Gloss */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
    </div>
  );
}
