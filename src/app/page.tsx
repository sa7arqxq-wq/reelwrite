"use client";

import { useCallback, useEffect, useState } from "react";
import { ReelFeed } from "@/components/reelwrite/ReelFeed";
import { TopBar, type FeedTab } from "@/components/reelwrite/TopBar";
import { BottomNav, type BottomNavView } from "@/components/reelwrite/BottomNav";
import { CommentsSheet } from "@/components/reelwrite/CommentsSheet";
import { UploadModal } from "@/components/reelwrite/UploadModal";
import { DiscoverView } from "@/components/reelwrite/DiscoverView";
import { ProfileView } from "@/components/reelwrite/ProfileView";
import { AdminView } from "@/components/reelwrite/AdminView";
import { LandingView } from "@/components/reelwrite/LandingView";
import { ShareSheet } from "@/components/reelwrite/ShareSheet";
import type { ReelWithRelations } from "@/components/reelwrite/ReelCard";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";

interface Me {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  avatarEmoji: string;
  role: string;
}

const LANDING_KEY = "reelwrite:entered";

export default function Home() {
  const [me, setMe] = useState<Me | null>(null);
  const [view, setView] = useState<BottomNavView>("feed");
  const [feed, setFeed] = useState<FeedTab>("for-you");
  const [reels, setReels] = useState<ReelWithRelations[]>([]);
  const [loadingReels, setLoadingReels] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsReel, setCommentsReel] = useState<ReelWithRelations | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareReel, setShareReel] = useState<ReelWithRelations | null>(null);
  const [profileWriterId, setProfileWriterId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  // Landing page: show on first visit (or until the user dismisses it)
  const [showLanding, setShowLanding] = useState(true);
  const { toast } = useToast();

  // Check localStorage on mount — if the user has already entered, skip landing
  useEffect(() => {
    try {
      if (localStorage.getItem(LANDING_KEY) === "1") {
        setShowLanding(false);
      }
    } catch {
      // localStorage might be unavailable; keep landing shown
    }
  }, []);

  // Get-or-create the demo current user
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setMe(data.me))
      .catch(() => {
        toast({
          title: "Could not load your session",
          description: "Please reload the page.",
          variant: "destructive",
        });
      });
  }, [toast]);

  // Load reels whenever feed changes
  const refreshReels = useCallback(() => {
    if (!me) return;
    setLoadingReels(true);
    const url = `/api/reels?feed=${feed}&userId=${me.id}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setReels(data.reels || []))
      .finally(() => setLoadingReels(false));
  }, [feed, me]);

  useEffect(() => {
    refreshReels();
  }, [refreshReels]);

  // Handlers
  function handleLike(reelId: string, liked: boolean) {
    if (!me) return;
    // Optimistic update
    setReels((prev) =>
      prev.map((r) =>
        r.id === reelId
          ? {
              ...r,
              liked,
              likes: r.likes + (liked ? 1 : -1),
            }
          : r
      )
    );
    fetch(`/api/reels/${reelId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id }),
    })
      .then((r) => r.json())
      .then((data) => {
        setReels((prev) =>
          prev.map((r) =>
            r.id === reelId ? { ...r, likes: data.likes, liked: data.liked } : r
          )
        );
      })
      .catch(() => {
        toast({
          title: "Could not like reel",
          variant: "destructive",
        });
      });
  }

  function handleOpenComments(reel: ReelWithRelations) {
    setCommentsReel(reel);
    setCommentsOpen(true);
  }

  function handleOpenProfile(writerId: string) {
    setProfileWriterId(writerId);
    setView("profile");
  }

  function handleShare(reel: ReelWithRelations) {
    // Increment share counter in the background
    fetch(`/api/reels/${reel.id}/share`, { method: "POST" })
      .then((r) => r.json())
      .then(() => {
        setReels((prev) =>
          prev.map((r) =>
            r.id === reel.id ? { ...r, shares: r.shares + 1 } : r
          )
        );
      })
      .catch(() => {});
    // Open the share sheet
    setShareReel(reel);
    setShareOpen(true);
  }

  function handleSave(reelId: string) {
    toast({
      title: "Saved to your library",
      description: "Find it later in your profile.",
    });
  }

  function handleUploadCreated() {
    toast({
      title: "Your 7-second reel is live 🎉",
      description: "Switch to your profile to see it, or scroll the feed.",
    });
    setView("feed");
    setFeed("for-you");
    // Refresh the feed to surface the new reel at the top
    setTimeout(() => refreshReels(), 200);
  }
  function handleEditBio(newBio: string) {
    if (!me) return;
    toast({
      title: "Bio updated",
      description: newBio.slice(0, 60) + (newBio.length > 60 ? "…" : ""),
    });
  }

  function enterApp() {
    try {
      localStorage.setItem(LANDING_KEY, "1");
    } catch {
      // ignore
    }
    setShowLanding(false);
  }

  function reopenLanding() {
    setShowLanding(true);
  }

  // Determine which profile to show
  const profileId = profileWriterId || me?.id;

  // LANDING VIEW — full-screen, shown on first visit
  if (showLanding) {
    return (
      <main className="relative h-[100dvh] w-full overflow-hidden bg-[#0a0a0a]">
        <LandingView onEnter={enterApp} />
        {/* Small "skip" link in the corner for returning users */}
        <button
          onClick={enterApp}
          className="absolute top-4 right-4 z-50 text-[11px] text-white/40 hover:text-white/70 transition-colors"
          aria-label="Skip and enter the app"
        >
          Skip →
        </button>
      </main>
    );
  }

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#0a0a0a]">
      {/* Floating "About" button to reopen the landing page */}
      <button
        onClick={reopenLanding}
        className="absolute top-3 right-3 z-40 flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/70 hover:text-amber-400 hover:border-amber-400/40 transition-colors"
        aria-label="About ReelWrite"
      >
        <Sparkles className="w-3 h-3" />
        About
      </button>

      {/* FEED view */}
      {view === "feed" && (
        <>
          <TopBar activeTab={feed} onTabChange={setFeed} />
          <ReelFeed
            reels={reels}
            currentUserId={me?.id || ""}
            onLike={handleLike}
            onOpenComments={handleOpenComments}
            onOpenProfile={handleOpenProfile}
            onShare={handleShare}
            onSave={handleSave}
            loading={loadingReels || !me}
          />
        </>
      )}

      {/* DISCOVER view */}
      {view === "discover" && (
        <>
          <header className="absolute top-0 left-0 right-0 z-20 pt-4 pb-2 bg-gradient-to-b from-black/70 to-transparent">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-xl">🧭</span>
                <span className="font-serif text-lg font-bold tracking-tight text-amber-400">
                  Discover
                </span>
              </div>
              <p className="text-xs text-white/55">
                Find your next favorite writer.
              </p>
            </div>
          </header>
          <DiscoverView
            currentUserId={me?.id || ""}
            onOpenProfile={handleOpenProfile}
            onOpenReelInFeed={() => setView("feed")}
          />
        </>
      )}

      {/* PROFILE view */}
      {view === "profile" && profileId && (
        <>
          <header className="absolute top-0 left-0 right-0 z-20 pt-4 pb-2 bg-gradient-to-b from-black/70 to-transparent">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-xl">👤</span>
                <span className="font-serif text-lg font-bold tracking-tight text-amber-400">
                  {profileWriterId === me?.id || !profileWriterId
                    ? "Your profile"
                    : "Writer"}
                </span>
              </div>
            </div>
          </header>
          <ProfileView
            writerId={profileId}
            isMe={profileId === me?.id}
            onEditBio={handleEditBio}
          />
        </>
      )}

      {/* ADMIN view — only visible to admins */}
      {view === "admin" && me?.role === "ADMIN" && (
        <AdminView
          currentUserId={me.id}
          onOpenProfile={handleOpenProfile}
        />
      )}

      {/* Bottom navigation — Create tab opens the modal */}
      <BottomNav
        active={view}
        isAdmin={me?.role === "ADMIN"}
        onChange={(v) => {
          if (v === "upload") {
            setUploadOpen(true);
          } else {
            setView(v);
          }
        }}
      />

      {/* Upload modal — overlays current view */}
      <UploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        currentUserId={me?.id || ""}
        onCreated={handleUploadCreated}
      />

      {/* Comments sheet */}
      <CommentsSheet
        reel={commentsReel}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        currentUserId={me?.id || ""}
      />

      {/* Share sheet (QR code + downloadable card) */}
      <ShareSheet
        reel={shareReel}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </main>
  );
}
