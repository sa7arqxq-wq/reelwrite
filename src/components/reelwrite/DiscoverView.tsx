"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, Users } from "lucide-react";
import { BookCover } from "./BookCover";
import { cn } from "@/lib/utils";
import { MOODS } from "@/lib/moods";

interface DiscoverWriter {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  avatarEmoji: string;
  bio: string;
  followers: number;
  reelsCount: number;
}

interface DiscoverReel {
  id: string;
  hook: string;
  mood: string;
  likes: number;
  views: number;
  author: { username: string; displayName: string; avatarColor: string; avatarEmoji: string };
  book: {
    title: string;
    subtitle: string;
    coverColor: string;
    coverAccent: string;
    coverEmoji: string;
    genre: string;
  } | null;
}

interface DiscoverViewProps {
  currentUserId: string;
  onOpenProfile: (writerId: string) => void;
  onOpenReelInFeed: (reelId: string) => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function DiscoverView({ currentUserId, onOpenProfile }: DiscoverViewProps) {
  const [writers, setWriters] = useState<DiscoverWriter[]>([]);
  const [trending, setTrending] = useState<DiscoverReel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/discover")
      .then((r) => r.json())
      .then((data) => {
        setWriters(data.writers || []);
        setTrending(data.trendingReels || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="no-scrollbar h-full overflow-y-auto pt-20 pb-24 px-4">
      {/* Trending reels */}
      <section className="mb-8">
        <h2 className="flex items-center gap-2 text-lg font-bold mb-3">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          Trending this week
        </h2>
        <div className="no-scrollbar flex gap-3 overflow-x-auto -mx-4 px-4 pb-2">
          {trending.map((r) => {
            const mood = MOODS[(r.mood as keyof typeof MOODS) || "amber"];
            return (
              <button
                key={r.id}
                onClick={() => onOpenProfile(r.author.id)}
                className="shrink-0 w-36 rounded-xl overflow-hidden border border-white/10 text-left hover:scale-[1.02] transition-transform"
                style={{
                  background: `linear-gradient(160deg, ${mood.from}, ${mood.to})`,
                }}
              >
                <div className="p-3 h-32 flex flex-col justify-between">
                  <div
                    className="text-xs font-serif font-bold leading-snug line-clamp-3"
                    style={{ color: mood.accent }}
                  >
                    {r.hook}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="flex w-5 h-5 rounded-full items-center justify-center text-[10px]"
                      style={{ background: r.author.avatarColor }}
                    >
                      {r.author.avatarEmoji}
                    </span>
                    <span className="text-[10px] text-white/70 truncate">
                      @{r.author.username}
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-black/40 flex items-center justify-between text-[10px] text-white/60">
                  <span>❤️ {formatCount(r.likes)}</span>
                  <span>👁 {formatCount(r.views)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Writers to follow */}
      <section>
        <h2 className="flex items-center gap-2 text-lg font-bold mb-3">
          <Users className="w-5 h-5 text-amber-400" />
          Writers to follow
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {writers.map((w) => (
            <WriterCard
              key={w.id}
              writer={w}
              onOpenProfile={() => onOpenProfile(w.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function WriterCard({
  writer,
  onOpenProfile,
}: {
  writer: DiscoverWriter;
  onOpenProfile: () => void;
}) {
  const [following, setFollowing] = useState(false);
  return (
    <button
      onClick={onOpenProfile}
      className="flex items-start gap-3 rounded-xl bg-white/[0.04] border border-white/10 p-3 text-left hover:bg-white/[0.07] transition-colors"
    >
      <span
        className="flex w-12 h-12 shrink-0 rounded-full items-center justify-center text-xl ring-2 ring-white/10"
        style={{ background: writer.avatarColor }}
      >
        {writer.avatarEmoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold truncate">{writer.displayName}</div>
        <div className="text-xs text-white/50 truncate">@{writer.username}</div>
        <p className="text-xs text-white/70 mt-1 line-clamp-2">{writer.bio}</p>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-white/55">
          <span>{formatCount(writer.followers)} followers</span>
          <span>·</span>
          <span>{writer.reelsCount} reels</span>
        </div>
      </div>
      <span
        onClick={(e) => {
          e.stopPropagation();
          setFollowing((f) => !f);
        }}
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition-colors",
          following
            ? "bg-white/10 text-white/70"
            : "bg-amber-400 text-black hover:bg-amber-300"
        )}
      >
        {following ? "Following" : "Follow"}
      </span>
    </button>
  );
}
