"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check, Link2 } from "lucide-react";

interface SocialShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reel: {
    id: string;
    hook: string;
    author: { username: string };
  } | null;
}

export function SocialShareSheet({ open, onOpenChange, reel }: SocialShareSheetProps) {
  const [copied, setCopied] = useState(false);

  if (!reel) return null;

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?reel=${reel.id}`
    : `https://my-project-two-xi-83.vercel.app/?reel=${reel.id}`;
  const shareText = `"${reel.hook}" — @${reel.author.username} on ReelWrite`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const platforms = [
    {
      name: "Instagram",
      icon: "📸",
      color: "#E1306C",
      action: () => {
        // Instagram doesn't support direct URL share — copy link + open Instagram
        copyLink();
        window.open("https://www.instagram.com/", "_blank");
      },
    },
    {
      name: "TikTok",
      icon: "🎵",
      color: "#000000",
      action: () => {
        copyLink();
        window.open("https://www.tiktok.com/", "_blank");
      },
    },
    {
      name: "Threads",
      icon: "🧵",
      color: "#000000",
      action: () => {
        window.open(`https://threads.net/intent/post?text=${encodedText}%20${encodedUrl}`, "_blank");
      },
    },
    {
      name: "X (Twitter)",
      icon: "𝕏",
      color: "#000000",
      action: () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, "_blank");
      },
    },
    {
      name: "WhatsApp",
      icon: "💬",
      color: "#25D366",
      action: () => {
        window.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`, "_blank");
      },
    },
    {
      name: "Facebook",
      icon: "📘",
      color: "#1877F2",
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`, "_blank");
      },
    },
    {
      name: "Telegram",
      icon: "✈️",
      color: "#0088CC",
      action: () => {
        window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, "_blank");
      },
    },
    {
      name: "Email",
      icon: "✉️",
      color: "#6B7280",
      action: () => {
        window.open(`mailto:?subject=${encodedText}&body=${encodedUrl}`, "_blank");
      },
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-[#0a0a0a] border-white/10 text-white p-0"
      >
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-white/10">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Link2 className="w-4 h-4 text-amber-400" />
            Share to social media
          </SheetTitle>
          <SheetDescription className="sr-only">Share this reel</SheetDescription>
        </SheetHeader>

        <div className="p-4">
          {/* Platform grid */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {platforms.map((p) => (
              <button
                key={p.name}
                onClick={p.action}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform hover:scale-110"
                  style={{ background: `${p.color}22`, border: `1px solid ${p.color}44` }}
                >
                  {p.icon}
                </span>
                <span className="text-[10px] text-white/70 font-medium">{p.name}</span>
              </button>
            ))}
          </div>

          {/* Copy link */}
          <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/55 font-semibold mb-1.5">
              Share link
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-amber-400/90 truncate font-mono">
                {shareUrl}
              </code>
              <Button
                size="sm"
                onClick={copyLink}
                className={copied ? "bg-emerald-500 text-white hover:bg-emerald-500" : "bg-amber-400 text-black hover:bg-amber-300"}
              >
                {copied ? <><Check className="w-3.5 h-3.5 mr-1" />Copied</> : <><Copy className="w-3.5 h-3.5 mr-1" />Copy</>}
              </Button>
            </div>
          </div>

          <p className="text-[10px] text-white/40 text-center mt-3">
            For Instagram & TikTok: link is copied, then the app opens for you to paste.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
