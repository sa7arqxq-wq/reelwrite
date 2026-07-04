"use client";

import { useEffect, useRef, useState } from "react";
import { ReelCard, ReelWithRelations } from "./ReelCard";
import { Loader2 } from "lucide-react";

interface ReelFeedProps {
  reels: ReelWithRelations[];
  currentUserId: string;
  onLike: (reelId: string, liked: boolean) => void;
  onOpenComments: (reel: ReelWithRelations) => void;
  onOpenProfile: (writerId: string) => void;
  onShare: (reelId: string) => void;
  onSave: (reelId: string) => void;
  loading?: boolean;
}

export function ReelFeed({
  reels,
  currentUserId,
  onLike,
  onOpenComments,
  onOpenProfile,
  onShare,
  onSave,
  loading,
}: ReelFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track which reel is in view using IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            setActiveIndex(idx);
          }
        });
      },
      { root: container, threshold: [0.6, 0.9] }
    );

    const items = container.querySelectorAll("[data-index]");
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [reels.length]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-6">
        <div className="text-5xl mb-4">📭</div>
        <h3 className="text-xl font-bold mb-1">No reels yet</h3>
        <p className="text-sm text-white/60">
          Follow some writers or upload your own 7-second reel to get started.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="no-scrollbar snap-feed h-full w-full overflow-y-scroll"
    >
      {reels.map((reel, i) => (
        <div
          key={reel.id}
          data-index={i}
          className="snap-item h-full w-full"
        >
          <ReelCard
            reel={reel}
            isActive={i === activeIndex}
            currentUserId={currentUserId}
            onLike={onLike}
            onOpenComments={onOpenComments}
            onOpenProfile={onOpenProfile}
            onShare={onShare}
            onSave={onSave}
          />
        </div>
      ))}
    </div>
  );
}
