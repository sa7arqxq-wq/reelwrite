"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MOODS, getMood } from "@/lib/moods";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StoryUser {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarColor: string;
    avatarEmoji: string;
    image?: string | null;
  };
  stories: {
    id: string;
    text: string;
    mood: string;
    background: string;
    backgroundImage?: string | null;
    createdAt: string;
    viewed: boolean;
  }[];
  hasUnviewed: boolean;
}

interface StoryBarProps {
  currentUserId: string;
  onOpenStory: (storyUser: StoryUser) => void;
}

export function StoryBar({ currentUserId, onOpenStory }: StoryBarProps) {
  const [storyUsers, setStoryUsers] = useState<StoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [storyMood, setStoryMood] = useState("amber");
  const { toast } = useToast();

  const loadStories = () => {
    fetch("/api/stories")
      .then((r) => r.json())
      .then((d) => setStoryUsers(d.stories || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStories();
  }, []);

  async function createStory() {
    if (!storyText.trim()) return;
    const res = await fetch("/api/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: storyText, mood: storyMood }),
    });
    if (res.ok) {
      toast({ title: "Story posted ✨", description: "Expires in 24 hours." });
      setStoryText("");
      setCreating(false);
      loadStories();
    }
  }

  return (
    <>
      {/* Story bar — horizontal scroll of circles */}
      <div className="px-4 py-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-3">
          {/* Add story button */}
          <button
            onClick={() => setCreating(true)}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div className="relative">
              {storyUsers.find((su) => su.user.id === currentUserId) ? (
                <span className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-500">
                  <span className="block w-full h-full rounded-full overflow-hidden bg-[#0a0a0a] p-[2px]">
                    {storyUsers.find((su) => su.user.id === currentUserId)?.user.image ? (
                      <img src={storyUsers.find((su) => su.user.id === currentUserId)?.user.image} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="flex w-full h-full rounded-full items-center justify-center text-lg" style={{ background: storyUsers.find((su) => su.user.id === currentUserId)?.user.avatarColor }}>
                        {storyUsers.find((su) => su.user.id === currentUserId)?.user.avatarEmoji}
                      </span>
                    )}
                  </span>
                </span>
              ) : (
                <span className="w-16 h-16 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white/50" />
                </span>
              )}
            </div>
            <span className="text-[10px] text-white/60">Your story</span>
          </button>

          {/* Other users' stories */}
          {storyUsers
            .filter((su) => su.user.id !== currentUserId)
            .map((su) => (
              <button
                key={su.user.id}
                onClick={() => onOpenStory(su)}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <span
                  className={cn(
                    "w-16 h-16 rounded-full p-[2px]",
                    su.hasUnviewed
                      ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-500"
                      : "bg-white/15"
                  )}
                >
                  <span className="block w-full h-full rounded-full overflow-hidden bg-[#0a0a0a] p-[2px]">
                    {su.user.image ? (
                      <img src={su.user.image} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="flex w-full h-full rounded-full items-center justify-center text-lg" style={{ background: su.user.avatarColor }}>
                        {su.user.avatarEmoji}
                      </span>
                    )}
                  </span>
                </span>
                <span className="text-[10px] text-white/60 truncate max-w-[64px]">
                  {su.user.username.length > 8 ? su.user.username.slice(0, 8) + "…" : su.user.username}
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Story creation modal */}
      {creating && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setCreating(false)}>
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Add story</h3>
              <button onClick={() => setCreating(false)}>
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            <div
              className="rounded-2xl p-6 mb-3 min-h-[200px] flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${MOODS[storyMood as keyof typeof MOODS]?.from || "#1c1408"}, ${MOODS[storyMood as keyof typeof MOODS]?.to || "#3d2810"})` }}
            >
              <p className="font-serif text-xl font-bold text-center text-white">
                {storyText || "Your story text..."}
              </p>
            </div>
            <Textarea
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              placeholder="Write a quote, teaser, or announcement..."
              rows={3}
              className="bg-white/5 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-amber-400/50 resize-none mb-3"
              autoFocus
            />
            <div className="flex gap-1.5 mb-3">
              {(["amber", "rose", "emerald", "violet", "slate", "ocean"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setStoryMood(m)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2",
                    storyMood === m ? "border-white" : "border-transparent"
                  )}
                  style={{ background: MOODS[m].accent }}
                />
              ))}
            </div>
            <Button
              onClick={createStory}
              disabled={!storyText.trim()}
              className="w-full bg-amber-400 text-black hover:bg-amber-300 font-bold"
            >
              Post story (expires in 24h)
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// Full-screen story viewer
interface StoryViewerProps {
  storyUser: StoryUser | null;
  open: boolean;
  onClose: () => void;
}

export function StoryViewer({ storyUser, open, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const currentUserId = typeof window !== "undefined" ? "" : "";

  useEffect(() => {
    if (!open || !storyUser) return;
    setCurrentIndex(0);
    setProgress(0);
  }, [open, storyUser]);

  useEffect(() => {
    if (!open || !storyUser) return;
    const story = storyUser.stories[currentIndex];
    if (!story) return;

    // Mark as viewed
    fetch(`/api/stories/${story.id}/view`, { method: "POST" }).catch(() => {});

    // Progress bar animation (5 seconds per story)
    const duration = 5000;
    const interval = 50;
    const increment = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          if (currentIndex < storyUser.stories.length - 1) {
            setCurrentIndex((i) => i + 1);
            return 0;
          } else {
            onClose();
            return 0;
          }
        }
        return p + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [open, storyUser, currentIndex, onClose]);

  if (!open || !storyUser) return null;

  const story = storyUser.stories[currentIndex];
  if (!story) return null;
  const mood = getMood(story.mood);
  const moodData = MOODS[mood];

  return (
    <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: story.backgroundImage
            ? `url(${story.backgroundImage}) center/cover`
            : `radial-gradient(120% 100% at 50% 0%, ${moodData.to} 0%, ${moodData.from} 70%, #050505 100%)`,
        }}
      />
      {story.backgroundImage && (
        <div className="absolute inset-0 bg-black/40" />
      )}

      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {storyUser.stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-white"
              style={{ width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* User info */}
      <div className="absolute top-8 left-4 right-4 flex items-center gap-2 z-10">
        {storyUser.user.image ? (
          <img src={storyUser.user.image} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <span className="flex w-8 h-8 rounded-full items-center justify-center text-sm" style={{ background: storyUser.user.avatarColor }}>
            {storyUser.user.avatarEmoji}
          </span>
        )}
        <span className="text-sm font-semibold text-white">@{storyUser.user.username}</span>
        <button onClick={onClose} className="ml-auto">
          <X className="w-6 h-6 text-white/80" />
        </button>
      </div>

      {/* Story text */}
      <div className="relative z-10 px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={story.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="font-serif text-2xl font-bold leading-tight text-white"
            style={{ textShadow: `0 2px 20px ${moodData.accent}55` }}
          >
            {story.text}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Tap zones */}
      <button
        className="absolute left-0 top-0 bottom-0 w-1/3 z-5"
        onClick={() => currentIndex > 0 && setCurrentIndex((i) => i - 1)}
      />
      <button
        className="absolute right-0 top-0 bottom-0 w-1/3 z-5"
        onClick={() => {
          if (currentIndex < storyUser.stories.length - 1) {
            setCurrentIndex((i) => i + 1);
            setProgress(0);
          } else {
            onClose();
          }
        }}
      />
    </div>
  );
}
