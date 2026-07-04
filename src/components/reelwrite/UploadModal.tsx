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
import { Timer, Sparkles, Loader2, Check, Wand2 } from "lucide-react";
import { MOODS, MOOD_LIST, type Mood } from "@/lib/moods";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  const [background, setBackground] = useState<"mood" | "cover">("mood");
  const [bookTitle, setBookTitle] = useState("");
  const [bookGenre, setBookGenre] = useState("Fiction");
  const [bookLink, setBookLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Pitch-to-reel generator state
  const [mode, setMode] = useState<"manual" | "generate">("manual");
  const [pitch, setPitch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [suggestedHooks, setSuggestedHooks] = useState<string[]>([]);
  const [suggestedMood, setSuggestedMood] = useState<Mood | null>(null);
  const [suggestedCaption, setSuggestedCaption] = useState<string | null>(null);
  const { toast } = useToast();

  const HOOK_LIMIT = 180;
  const isOver = hook.length > HOOK_LIMIT;

  async function generateFromPitch() {
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
    try {
      const res = await fetch("/api/reels/generate", {
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
      // Auto-select the first hook
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
        title: "Reel generated ✨",
        description: `Found ${data.hooks?.length || 0} hook candidates. Pick your favorite.`,
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
          background: bookTitle.trim() ? background : "mood",
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
      setMode("manual");
      setPitch("");
      setSuggestedHooks([]);
      setSuggestedMood(null);
      setSuggestedCaption(null);
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

        {/* Mode toggle: Manual vs Generate from pitch */}
        <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10 mb-3">
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
              mode === "manual"
                ? "bg-amber-400 text-black"
                : "text-white/60 hover:text-white"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Write hook
          </button>
          <button
            type="button"
            onClick={() => setMode("generate")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
              mode === "generate"
                ? "bg-amber-400 text-black"
                : "text-white/60 hover:text-white"
            )}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Generate from pitch
          </button>
        </div>

        <div className="space-y-5 py-2">
          {/* GENERATE MODE — paste your book pitch, we extract hooks */}
          {mode === "generate" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="pitch" className="text-sm font-semibold">
                  Paste your book&apos;s pitch or blurb
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
                  <span className="text-white/45 font-mono">{pitch.length}/2000</span>
                </div>
              </div>
              <Button
                type="button"
                onClick={generateFromPitch}
                disabled={generating || pitch.trim().length < 10}
                className="w-full bg-amber-400 text-black hover:bg-amber-300 font-bold py-2.5"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finding hooks…
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate hooks from pitch
                  </>
                )}
              </Button>

              {/* Suggested hooks */}
              {suggestedHooks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Pick your favorite ({suggestedHooks.length} candidates)
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

            {/* Background choice — only shown when a book title is entered */}
            {bookTitle.trim() && (
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-semibold">Reel background</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBackground("mood")}
                    className={cn(
                      "rounded-lg p-2.5 text-left border transition-all",
                      background === "mood"
                        ? "border-amber-400 ring-2 ring-amber-400/30 bg-amber-400/5"
                        : "border-white/10 hover:border-white/30"
                    )}
                  >
                    <div className="text-base">🎨</div>
                    <div className="text-xs font-semibold mt-0.5">Mood gradient</div>
                    <div className="text-[10px] text-white/50">Use the mood color palette</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackground("cover")}
                    className={cn(
                      "rounded-lg p-2.5 text-left border transition-all",
                      background === "cover"
                        ? "border-amber-400 ring-2 ring-amber-400/30 bg-amber-400/5"
                        : "border-white/10 hover:border-white/30"
                    )}
                  >
                    <div className="text-base">📖</div>
                    <div className="text-xs font-semibold mt-0.5">Book cover</div>
                    <div className="text-[10px] text-white/50">Use your book cover as the backdrop</div>
                  </button>
                </div>
              </div>
            )}
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
