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

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, BookOpen, Film, Users, Shield, Zap, Heart } from "lucide-react";
import { MOODS } from "@/lib/moods";

interface LandingViewProps {
  onEnter: () => void;
}

interface DemoWriter {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  avatarEmoji: string;
  bio: string;
  followers: number;
}

const HOOKS = [
  { text: "She kept the light on for forty years — and on the forty-first, the dark kept it company.", mood: "violet" as const, author: "Marina Eclipse" },
  { text: "He mailed a letter to an address that no longer existed. Someone wrote back.", mood: "rose" as const, author: "Theodore Ink" },
  { text: "She told the town she only sold soup. The town agreed not to ask about the third ingredient.", mood: "emerald" as const, author: "Opal Verdant" },
  { text: "They told her the empire was unbreakable. They had not met her yet.", mood: "rose" as const, author: "Kael Merchant" },
];

export function LandingView({ onEnter }: LandingViewProps) {
  const [writers, setWriters] = useState<DemoWriter[]>([]);
  const [activeHook, setActiveHook] = useState(0);

  useEffect(() => {
    fetch("/api/discover")
      .then((r) => r.json())
      .then((data) => setWriters((data.writers || []).slice(0, 4)))
      .catch(() => {});
  }, []);

  // Rotate the hero hook every 4 seconds
  useEffect(() => {
    const t = setInterval(() => {
      setActiveHook((i) => (i + 1) % HOOKS.length);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="no-scrollbar h-full overflow-y-auto bg-[#0a0a0a] text-white">
      {/* HERO */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 py-16 overflow-hidden">
        {/* Ambient gradient backdrop */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[140%] h-[60%] rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-[60%] h-[40%] rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
          <div className="absolute top-0 left-0 w-[50%] h-[40%] rounded-full opacity-15 blur-3xl"
            style={{ background: "radial-gradient(circle, #f43f5e 0%, transparent 70%)" }} />
        </div>

        {/* Floating mood chips */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Object.values(MOODS).map((m, i) => (
            <motion.div
              key={m.label}
              className="absolute text-2xl opacity-20"
              style={{
                top: `${15 + (i * 13) % 70}%`,
                left: `${(i * 17 + 8) % 85}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 10, 0],
              }}
              transition={{
                duration: 6 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            >
              {m.emoji}
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 max-w-md w-full text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <span className="text-3xl">✒️</span>
            <span className="font-serif text-2xl font-bold tracking-tight text-amber-400">
              ReelWrite
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-3"
          >
            Market your book in{" "}
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">
              7 seconds
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base text-white/70 mb-8 leading-relaxed"
          >
            A TikTok-style platform built for writers. Turn your book&apos;s
            best line into a kinetic reel, attach your buy link, and let readers
            scroll straight to your story.
          </motion.p>

          {/* Rotating hook demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative h-32 mb-8 mx-auto max-w-sm"
          >
            {HOOKS.map((h, i) => {
              const mood = MOODS[h.mood];
              const isActive = i === activeHook;
              return (
                <div
                  key={i}
                  className="absolute inset-0 rounded-2xl border border-white/10 p-4 flex items-center justify-center text-center transition-all duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${mood.from}, ${mood.to})`,
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? "scale(1)" : "scale(0.95)",
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                >
                  <div>
                    <p
                      className="font-serif text-sm font-bold leading-snug"
                      style={{ color: mood.accent }}
                    >
                      &ldquo;{h.text}&rdquo;
                    </p>
                    <p className="text-[10px] text-white/50 mt-2">
                      — {h.author}, 7-second reel
                    </p>
                  </div>
                </div>
              );
            })}
            {/* Progress dots */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {HOOKS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveHook(i)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === activeHook ? 24 : 6,
                    background: i === activeHook ? "#f59e0b" : "rgba(255,255,255,0.3)",
                  }}
                  aria-label={`Go to hook ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col gap-3"
          >
            <button
              onClick={onEnter}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-8 py-4 text-base font-bold text-black transition-all hover:bg-amber-300 hover:scale-105 active:scale-100 shadow-xl shadow-amber-400/20"
            >
              <Sparkles className="w-5 h-5" />
              Enter ReelWrite
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="text-xs text-white/40">
              Free to explore · No signup needed · You&apos;re the admin
            </p>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-16 border-t border-white/5">
        <div className="max-w-md mx-auto">
          <h2 className="font-serif text-2xl font-bold text-center mb-2">
            Built for writers, not influencers
          </h2>
          <p className="text-sm text-white/60 text-center mb-10">
            Every feature exists to help your book find its reader.
          </p>

          <div className="space-y-4">
            <Feature
              icon={<Zap className="w-5 h-5" />}
              title="7-second kinetic reels"
              body="Write one hook, quote, or first line. We animate it into a looping 7-second reel with mood-themed gradients — no video editing required."
              accent="#f59e0b"
            />
            <Feature
              icon={<BookOpen className="w-5 h-5" />}
              title="Books attach to every reel"
              body="Each reel links to a book with cover, genre, and a Read this book CTA. Readers tap once, they're at your buy link."
              accent="#f43f5e"
            />
            <Feature
              icon={<Film className="w-5 h-5" />}
              title="Snap-scroll feed"
              body="TikTok-style vertical feed with For You, Following, and Trending tabs. Featured reels pin to the top of everyone's feed."
              accent="#7c3aed"
            />
            <Feature
              icon={<Heart className="w-5 h-5" />}
              title="Real engagement"
              body="Likes, comments, saves, and shares — all persisted. Watch your hooks land in real time."
              accent="#10b981"
            />
            <Feature
              icon={<Users className="w-5 h-5" />}
              title="Writer profiles"
              body="A profile that showcases your reels grid and book catalog in one scroll. Follow other writers to populate your Following feed."
              accent="#0ea5e9"
            />
            <Feature
              icon={<Shield className="w-5 h-5" />}
              title="Admin controls"
              body="You're the admin: feature reels, moderate comments, promote or ban users, and watch site-wide stats from one console."
              accent="#fb7185"
            />
          </div>
        </div>
      </section>

      {/* WRITERS */}
      {writers.length > 0 && (
        <section className="px-6 py-16 border-t border-white/5">
          <div className="max-w-md mx-auto">
            <h2 className="font-serif text-2xl font-bold text-center mb-2">
              Meet the writers
            </h2>
            <p className="text-sm text-white/60 text-center mb-8">
              A demo catalog of authors already publishing 7-second reels.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {writers.map((w) => (
                <div
                  key={w.id}
                  className="rounded-xl bg-white/[0.04] border border-white/10 p-3 text-center"
                >
                  <span
                    className="inline-flex w-12 h-12 rounded-full items-center justify-center text-xl mb-2 ring-2 ring-white/10"
                    style={{ background: w.avatarColor }}
                  >
                    {w.avatarEmoji}
                  </span>
                  <div className="text-sm font-semibold truncate">
                    {w.displayName}
                  </div>
                  <div className="text-[10px] text-white/50 truncate">
                    @{w.username}
                  </div>
                  <div className="text-[10px] text-amber-400 mt-1">
                    {w.followers.toLocaleString()} followers
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="px-6 py-20 border-t border-white/5">
        <div className="max-w-md mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-5xl mb-4">📖</div>
            <h2 className="font-serif text-3xl font-bold mb-3">
              Your next reader is one scroll away
            </h2>
            <p className="text-sm text-white/60 mb-8">
              Write a hook. Pick a mood. Publish in 7 seconds.
            </p>
            <button
              onClick={onEnter}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-8 py-4 text-base font-bold text-black transition-all hover:bg-amber-300 hover:scale-105 active:scale-100 shadow-xl shadow-amber-400/20"
            >
              <Sparkles className="w-5 h-5" />
              Start scrolling
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-8 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <span className="text-base">✒️</span>
          <span className="font-serif text-sm font-bold tracking-tight text-amber-400">
            ReelWrite
          </span>
        </div>
        <p className="text-[11px] text-white/40">
          A TikTok for writers · 7-second reels to market your books
        </p>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="flex gap-3 rounded-xl bg-white/[0.03] border border-white/10 p-4"
    >
      <div
        className="flex w-10 h-10 shrink-0 rounded-lg items-center justify-center"
        style={{ background: `${accent}22`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold mb-1">{title}</h3>
        <p className="text-xs text-white/65 leading-relaxed">{body}</p>
      </div>
    </motion.div>
  );
}
