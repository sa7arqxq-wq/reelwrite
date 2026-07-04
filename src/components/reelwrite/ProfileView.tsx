"use client";

import { useEffect, useState } from "react";
import { Loader2, BookOpen, ExternalLink, Settings, PenLine } from "lucide-react";
import { BookCover } from "./BookCover";
import { MOODS } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ProfileReel {
  id: string;
  hook: string;
  mood: string;
  likes: number;
  views: number;
  comments: number;
  createdAt: string;
  book: {
    title: string;
    subtitle: string;
    coverColor: string;
    coverAccent: string;
    coverEmoji: string;
    genre: string;
    buyLink: string;
  } | null;
}

interface ProfileBook {
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
}

interface WriterProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarColor: string;
  avatarEmoji: string;
  followers: number;
  following: number;
  reelsCount: number;
  reels: ProfileReel[];
  books: ProfileBook[];
}

interface ProfileViewProps {
  writerId: string;
  isMe: boolean;
  onEditBio?: (newBio: string) => void;
  onOpenReelInFeed?: (reelId: string) => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function ProfileView({ writerId, isMe, onEditBio }: ProfileViewProps) {
  const [profile, setProfile] = useState<WriterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/writers/${writerId}`)
      .then((r) => r.json())
      .then((data) => {
        setProfile(data.writer);
        setBioDraft(data.writer?.bio || "");
      })
      .finally(() => setLoading(false));
  }, [writerId]);

  if (loading || !profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="no-scrollbar h-full overflow-y-auto pt-20 pb-24">
      {/* Header */}
      <div className="px-4 pb-4">
        <div className="flex items-start gap-4">
          <span
            className="flex w-20 h-20 shrink-0 rounded-full items-center justify-center text-3xl ring-4 ring-white/10"
            style={{ background: profile.avatarColor }}
          >
            {profile.avatarEmoji}
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <h1 className="text-xl font-bold truncate">{profile.displayName}</h1>
            <p className="text-sm text-white/50 truncate">@{profile.username}</p>
            <div className="mt-2 flex gap-4 text-sm">
              <div>
                <span className="font-bold">{formatCount(profile.followers)}</span>{" "}
                <span className="text-white/55">followers</span>
              </div>
              <div>
                <span className="font-bold">{profile.reelsCount}</span>{" "}
                <span className="text-white/55">reels</span>
              </div>
              <div>
                <span className="font-bold">{profile.books.length}</span>{" "}
                <span className="text-white/55">books</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4">
          {editingBio ? (
            <div className="space-y-2">
              <Textarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                rows={2}
                className="bg-white/5 border-white/15 text-white text-sm focus-visible:ring-amber-400/50 resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-amber-400 text-black hover:bg-amber-300"
                  onClick={() => {
                    onEditBio?.(bioDraft);
                    setEditingBio(false);
                    if (profile) setProfile({ ...profile, bio: bioDraft });
                  }}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/70 hover:text-white"
                  onClick={() => setEditingBio(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <p className="text-sm text-white/85 flex-1 leading-relaxed">
                {profile.bio || "No bio yet."}
              </p>
              {isMe && (
                <button
                  onClick={() => setEditingBio(true)}
                  className="text-white/40 hover:text-amber-400 transition-colors"
                  aria-label="Edit bio"
                >
                  <PenLine className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4 flex gap-2">
          {isMe ? (
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 flex-1"
              onClick={() => setEditingBio(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit profile
            </Button>
          ) : (
            <Button
              className={cn(
                "flex-1 font-bold",
                following
                  ? "bg-white/10 text-white hover:bg-white/15"
                  : "bg-amber-400 text-black hover:bg-amber-300"
              )}
              onClick={() => setFollowing((f) => !f)}
            >
              {following ? "Following" : "Follow"}
            </Button>
          )}
        </div>
      </div>

      {/* Reels grid */}
      {profile.reels.length > 0 && (
        <section className="px-4 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/55 mb-2">
            7-second reels
          </h2>
          <div className="grid grid-cols-3 gap-1.5">
            {profile.reels.map((r) => {
              const mood = MOODS[(r.mood as keyof typeof MOODS) || "amber"];
              return (
                <div
                  key={r.id}
                  className="relative aspect-[9/14] rounded-md overflow-hidden border border-white/10"
                  style={{
                    background: `linear-gradient(160deg, ${mood.from}, ${mood.to})`,
                  }}
                >
                  <div className="absolute inset-0 p-2 flex flex-col justify-between">
                    <div
                      className="text-[10px] font-serif font-bold leading-tight line-clamp-4"
                      style={{ color: mood.accent }}
                    >
                      {r.hook}
                    </div>
                    <div className="text-[8px] text-white/60 flex items-center gap-1">
                      <span>❤️ {formatCount(r.likes)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Books */}
      {profile.books.length > 0 && (
        <section className="px-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/55 mb-3">
            Books
          </h2>
          <div className="space-y-3">
            {profile.books.map((b) => (
              <div
                key={b.id}
                className="flex gap-3 rounded-xl bg-white/[0.04] border border-white/10 p-3"
              >
                <BookCover
                  title={b.title}
                  subtitle={b.subtitle}
                  coverColor={b.coverColor}
                  coverAccent={b.coverAccent}
                  coverEmoji={b.coverEmoji}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-wider text-white/55 font-semibold">
                    {b.genre} · {b.pages || "?"}p
                  </div>
                  <div className="text-sm font-bold truncate">{b.title}</div>
                  <p className="text-xs text-white/70 mt-1 line-clamp-2">
                    {b.description || "A new release from this author."}
                  </p>
                  {b.buyLink && (
                    <a
                      href={b.buyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Read this book
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {profile.reels.length === 0 && profile.books.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="text-4xl mb-2">✍️</div>
          <p className="text-sm text-white/55">
            {isMe
              ? "You haven't published any reels yet. Tap Create to make your first 7-second reel."
              : "No reels yet."}
          </p>
        </div>
      )}
    </div>
  );
}
