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

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Bookmark, Share2, BookOpen, ExternalLink, Play, Pause } from "lucide-react";
import { BookCover } from "./BookCover";
import { MOODS, getMood } from "@/lib/moods";
import { cn } from "@/lib/utils";

export interface ReelWithRelations {
  id: string;
  hook: string;
  hookLines: string;
  caption: string;
  mood: string;
  duration: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  liked?: boolean;
  featured?: boolean;
  background?: string; // "mood" | "cover"
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarColor: string;
    avatarEmoji: string;
    bio: string;
    followers: number;
  };
  book: {
    id: string;
    title: string;
    subtitle: string;
    coverColor: string;
    coverAccent: string;
    coverEmoji: string;
    description: string;
    genre: string;
    buyLink: string;
    pages: number;
  } | null;
}

interface ReelCardProps {
  reel: ReelWithRelations;
  isActive: boolean;
  currentUserId: string;
  onLike: (reelId: string, liked: boolean) => void;
  onOpenComments: (reel: ReelWithRelations) => void;
  onOpenProfile: (writerId: string) => void;
  onShare: (reel: ReelWithRelations) => void;
  onSave: (reelId: string) => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function ReelCard({
  reel,
  isActive,
  currentUserId,
  onLike,
  onOpenComments,
  onOpenProfile,
  onShare,
  onSave,
}: ReelCardProps) {
  const mood = getMood(reel.mood);
  const moodData = MOODS[mood];
  const useCoverBackground = reel.background === "cover" && reel.book;
  const cover = reel.book;
  const lines = reel.hookLines.split("\n").filter(Boolean);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [saved, setSaved] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  // Each reel loops its 7-second kinetic reveal.
  useEffect(() => {
    if (!isActive || paused) return;
    setAnimKey((k) => k + 1);
    const t = setTimeout(() => {
      setCycle((c) => c + 1);
    }, reel.duration * 1000);
    return () => clearTimeout(t);
  }, [isActive, paused, cycle, reel.duration]);

  // Reset cycle when becoming active
  useEffect(() => {
    if (isActive) {
      setCycle(0);
      setPaused(false);
      setAnimKey((k) => k + 1);
    }
  }, [isActive]);

  const lineDelay = (reel.duration * 1000) / (lines.length + 1);

  // Accent color for text/badges — uses cover accent when in cover mode, mood accent otherwise
  const accentColor = useCoverBackground ? cover!.coverAccent : moodData.accent;

  return (
    <section
      className="snap-item relative h-full w-full overflow-hidden flex items-center justify-center"
      style={
        useCoverBackground
          ? {
              background: `radial-gradient(120% 100% at 50% 0%, ${cover!.coverColor} 0%, #050505 80%, #000000 100%)`,
            }
          : {
              background: `radial-gradient(120% 100% at 50% 0%, ${moodData.to} 0%, ${moodData.from} 70%, #050505 100%)`,
            }
      }
      onClick={() => setPaused((p) => !p)}
    >
      {/* Cover-background mode: render a giant blurred book cover behind the text */}
      {useCoverBackground && (
        <>
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <div
              className="w-[180%] h-[180%] flex items-center justify-center rounded-[3rem] opacity-40"
              style={{
                background: `linear-gradient(160deg, ${cover!.coverColor} 0%, ${cover!.coverColor} 50%, #000000 100%)`,
                boxShadow: `0 0 200px 80px ${cover!.coverAccent}33`,
              }}
            >
              <span className="text-[280px] opacity-50 select-none" style={{ filter: "blur(2px)" }}>
                {cover!.coverEmoji}
              </span>
            </div>
          </div>
          {/* Dark overlay for text contrast */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
          {/* Cover accent glow */}
          <div
            className="pointer-events-none absolute -top-1/3 left-1/2 -translate-x-1/2 w-[120%] h-[80%] rounded-full opacity-25 blur-3xl"
            style={{ background: `radial-gradient(circle, ${cover!.coverAccent} 0%, transparent 70%)` }}
          />
        </>
      )}

      {/* Ambient mood glow (mood mode only) */}
      {!useCoverBackground && (
        <div
          className="pointer-events-none absolute -top-1/3 left-1/2 -translate-x-1/2 w-[120%] h-[80%] rounded-full opacity-30 blur-3xl"
          style={{ background: `radial-gradient(circle, ${moodData.accent} 0%, transparent 70%)` }}
        />
      )}
      {/* Floating paper-grain noise (cheap, CSS-only) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* 7-second progress bar at the top */}
      <div className="absolute top-0 left-0 right-0 z-30 px-3 pt-3">
        <div className="h-[3px] w-full rounded-full bg-white/15 overflow-hidden">
          <motion.div
            key={`${animKey}-${cycle}`}
            className="h-full rounded-full"
            style={{ background: accentColor }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: reel.duration, ease: "linear" }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-white/60 font-mono">
          <span className="flex items-center gap-1.5">
            <span>{reel.duration}s reel</span>
            {reel.featured && (
              <span
                className="flex items-center gap-0.5 rounded-full px-1.5 py-px font-sans font-bold"
                style={{
                  background: `${accentColor}22`,
                  color: accentColor,
                  border: `1px solid ${accentColor}44`,
                }}
              >
                ★ Featured
              </span>
            )}
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: accentColor }}
            />
            {moodData.emoji} {moodData.label}
          </span>
        </div>
      </div>

      {/* Paused overlay */}
      {paused && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-7 h-7 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Kinetic typography — the heart of the reel */}
      <div className="relative z-10 w-full max-w-md px-6 pl-6 pr-20 text-center" key={animKey}>
        <AnimatePresence mode="wait">
          <motion.div
            key={cycle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-2"
          >
            {lines.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { delay: i * lineDelay / 1000, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                }}
                className="font-serif text-3xl sm:text-4xl font-bold leading-tight tracking-tight"
                style={{ color: "#fafaf9", textShadow: `0 2px 20px ${accentColor}55` }}
              >
                {line}
              </motion.p>
            ))}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{
                opacity: 1,
                scaleX: 1,
                transition: { delay: (lines.length * lineDelay) / 1000, duration: 0.5 },
              }}
              className="mx-auto mt-4 h-px w-12 origin-center"
              style={{ background: accentColor }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* "Made on ReelWrite" watermark — growth lever */}
      <div className="absolute bottom-[88px] left-4 z-10 select-none pointer-events-none">
        <span className="text-[9px] font-mono text-white/30 tracking-wide">
          ✒️ Made on ReelWrite
        </span>
      </div>

      {/* Right action rail */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-5">
        {/* Author avatar */}
        <button
          className="relative"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile(reel.author.id);
          }}
          aria-label={`View ${reel.author.displayName}'s profile`}
        >
          <span
            className="flex w-12 h-12 rounded-full items-center justify-center text-xl ring-2 ring-white/40"
            style={{ background: reel.author.avatarColor }}
          >
            {reel.author.avatarEmoji}
          </span>
          <span
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs text-black font-bold"
            style={{ background: accentColor }}
          >
            +
          </span>
        </button>

        {/* Like */}
        <button
          className="flex flex-col items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onLike(reel.id, !reel.liked);
          }}
          aria-label="Like"
        >
          <Heart
            className={cn(
              "w-8 h-8 transition-transform",
              reel.liked ? "fill-rose-500 text-rose-500 scale-110" : "text-white"
            )}
          />
          <span className="text-xs text-white font-semibold drop-shadow">
            {formatCount(reel.likes)}
          </span>
        </button>

        {/* Comments */}
        <button
          className="flex flex-col items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onOpenComments(reel);
          }}
          aria-label="Comments"
        >
          <MessageCircle className="w-8 h-8 text-white" />
          <span className="text-xs text-white font-semibold drop-shadow">
            {formatCount(reel.comments)}
          </span>
        </button>

        {/* Save */}
        <button
          className="flex flex-col items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            setSaved((s) => !s);
            onSave(reel.id);
          }}
          aria-label="Save"
        >
          <Bookmark
            className={cn(
              "w-8 h-8 transition-transform",
              saved ? "fill-amber-400 text-amber-400 scale-110" : "text-white"
            )}
          />
          <span className="text-xs text-white font-semibold drop-shadow">
            {formatCount(reel.saves + (saved ? 1 : 0))}
          </span>
        </button>

        {/* Share */}
        <button
          className="flex flex-col items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onShare(reel);
          }}
          aria-label="Share"
        >
          <Share2 className="w-8 h-8 text-white" />
          <span className="text-xs text-white font-semibold drop-shadow">
            {formatCount(reel.shares)}
          </span>
        </button>
      </div>

      {/* Bottom info panel */}
      <div className="absolute bottom-24 left-0 right-16 z-20 px-4 pb-2">
        <button
          className="block mb-2 text-left"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile(reel.author.id);
          }}
        >
          <span className="text-base font-bold text-white drop-shadow">
            @{reel.author.username}
          </span>
        </button>
        <p className="text-sm text-white/95 mb-2 drop-shadow leading-snug">
          {reel.caption}
        </p>
        {reel.book && (
          <div className="rounded-xl bg-black/40 backdrop-blur-md border border-white/10 p-2.5 max-w-sm">
            <div className="flex items-center gap-3">
              <BookCover
                title={reel.book.title}
                subtitle={reel.book.subtitle}
                coverColor={reel.book.coverColor}
                coverAccent={reel.book.coverAccent}
                coverEmoji={reel.book.coverEmoji}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">
                  {reel.book.genre} · {reel.book.pages}p
                </div>
                <div className="text-sm font-bold text-white truncate">
                  {reel.book.title}
                </div>
                <div className="text-xs text-white/70 truncate">
                  by {reel.author.displayName}
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-white/80 line-clamp-2">
              {reel.book.description}
            </p>
            <a
              href={reel.book.buyLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 flex items-center justify-center gap-2 w-full rounded-lg py-2 text-sm font-bold text-black transition-transform active:scale-95"
              style={{ background: accentColor }}
            >
              <BookOpen className="w-4 h-4" />
              Read this book
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
