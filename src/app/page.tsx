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
import { SocialShareSheet } from "@/components/reelwrite/SocialShareSheet";
import { DMModal } from "@/components/reelwrite/DMModal";
import { OwnershipNotice } from "@/components/reelwrite/OwnershipNotice";
import { AuthModal } from "@/components/reelwrite/AuthModal";
import type { ReelWithRelations } from "@/components/reelwrite/ReelCard";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "next-auth/react";
import { Sparkles, Shield, LogOut, MessageCircle } from "lucide-react";

interface Me {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarColor: string;
  avatarEmoji: string;
  image?: string | null;
  bio: string;
  role: string;
  banned: boolean;
  followers: number;
  following: number;
  reelsCount: number;
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
  const [ownershipOpen, setOwnershipOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [meLoading, setMeLoading] = useState(true);
  const [dmOpen, setDmOpen] = useState(false);
  const [dmTargetUserId, setDmTargetUserId] = useState<string | null>(null);
  const [socialShareOpen, setSocialShareOpen] = useState(false);
  const [socialShareReel, setSocialShareReel] = useState<ReelWithRelations | null>(null);
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

  // Get the current user from the session
  const loadMe = useCallback(() => {
    setMeLoading(true);
    fetch("/api/me")
      .then((r) => {
        if (!r.ok) throw new Error("Request failed");
        return r.json();
      })
      .then((data) => setMe(data.me))
      .catch(() => {
        // Only show error toast on actual network failure, not on null session
        toast({
          title: "Connection issue",
          description: "Could not reach the server. Check your internet and retry.",
          variant: "destructive",
        });
      })
      .finally(() => setMeLoading(false));
  }, [toast]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

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
    // Open the QR card share sheet
    setShareReel(reel);
    setShareOpen(true);
    // Also open the social share sheet
    setSocialShareReel(reel);
    setSocialShareOpen(true);
  }

  function handleOpenDM(userId: string) {
    setDmTargetUserId(userId);
    setDmOpen(true);
  }

  function handleSave(reel: ReelWithRelations) {
    // Toggle save in the background
    fetch(`/api/reels/${reel.id}/save`, { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setReels((prev) =>
            prev.map((r) =>
              r.id === reel.id
                ? { ...r, saves: r.saves + (data.saved ? 1 : -1) }
                : r
            )
          );
          toast({
            title: data.saved ? "Saved to your library" : "Removed from library",
            description: data.saved ? "Find it in the Saved tab on your profile." : "",
          });
        }
      })
      .catch(() => {});
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
      {/* Floating buttons: DM + Sign out + Protected + About */}
      <div className="absolute top-3 right-3 z-40 flex items-center gap-1.5">
        {me && (
          <button
            onClick={() => { setDmTargetUserId(null); setDmOpen(true); }}
            className="flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/70 hover:text-amber-400 hover:border-amber-400/40 transition-colors"
            aria-label="Direct messages"
          >
            <MessageCircle className="w-3 h-3" />
            DMs
          </button>
        )}
        {me && (
          <button
            onClick={() => {
              signOut({ redirect: false }).then(() => {
                setMe(null);
                toast({ title: "Signed out", description: "See you soon ✨" });
              });
            }}
            className="flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/70 hover:text-rose-400 hover:border-rose-400/40 transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="w-3 h-3" />
            @{me.username}
          </button>
        )}
        <button
          onClick={() => setOwnershipOpen(true)}
          className="flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/70 hover:text-rose-400 hover:border-rose-400/40 transition-colors"
          aria-label="Ownership & protection notice"
          title="Ownership & protection"
        >
          <Shield className="w-3 h-3" />
          Protected
        </button>
        <button
          onClick={reopenLanding}
          className="flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/70 hover:text-amber-400 hover:border-amber-400/40 transition-colors"
          aria-label="About ReelWrite"
        >
          <Sparkles className="w-3 h-3" />
          About
        </button>
      </div>

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
            currentUserId={me?.id || ""}
            onEditBio={handleEditBio}
            onOpenDM={handleOpenDM}
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

      {/* Ownership & protection notice */}
      <OwnershipNotice
        open={ownershipOpen}
        onOpenChange={setOwnershipOpen}
      />

      {/* Social share sheet (Instagram, TikTok, Threads, X, WhatsApp, etc) */}
      <SocialShareSheet
        open={socialShareOpen}
        onOpenChange={setSocialShareOpen}
        reel={socialShareReel}
      />

      {/* DM modal */}
      <DMModal
        open={dmOpen}
        onOpenChange={setDmOpen}
        currentUserId={me?.id || ""}
        targetUserId={dmTargetUserId}
      />

      {/* Auth modal — shown when user needs to sign in or sign up */}
      <AuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSuccess={loadMe}
      />

      {/* Auth gate — when not logged in (and not loading), prompt to sign in */}
      {!meLoading && !me && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">✒️</div>
            <h2 className="font-serif text-2xl font-bold text-amber-400 mb-2">
              Sign in to continue
            </h2>
            <p className="text-sm text-white/65 mb-6 leading-relaxed">
              Create a writer account or sign in to scroll reels, like books,
              and publish your own 7-second hooks.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-black transition-all hover:bg-amber-300 hover:scale-105 active:scale-100"
            >
              <Sparkles className="w-4 h-4" />
              Sign in / Sign up
            </button>
            <p className="text-[10px] text-white/40 mt-4">
              Demo accounts: marina@reelwrite.demo · theodore@reelwrite.demo ·
              kael@reelwrite.demo · Password: demo1234
            </p>
          </div>
        </div>
      )}

      {/* Loading gate — while checking session */}
      {meLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]">
          <div className="text-center">
            <div className="text-3xl mb-3 animate-pulse">✒️</div>
            <p className="text-sm text-white/55">Loading ReelWrite…</p>
          </div>
        </div>
      )}
    </main>
  );
}
