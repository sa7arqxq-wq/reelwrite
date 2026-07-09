"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface UpgradeViewProps {
  currentUserId: string;
}

export function UpgradeView({ currentUserId }: UpgradeViewProps) {
  const [tier, setTier] = useState<"FREE" | "PRO">("FREE");
  const [reelsThisMonth, setReelsThisMonth] = useState(0);
  const [reelsLimit, setReelsLimit] = useState(3);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.me) {
          // We need to also fetch subscription info
          fetch("/api/me/subscription")
            .then((r) => r.json())
            .then((s) => {
              setTier(s.tier || "FREE");
              setReelsThisMonth(s.reelsThisMonth || 0);
              setReelsLimit(s.reelsLimit || 3);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });
  }, []);

  const features = [
    { name: "3 reels per month", free: true, pro: false },
    { name: "Unlimited reels", free: false, pro: true },
    { name: "Mood gradient backgrounds", free: true, pro: true },
    { name: "Book cover backgrounds", free: false, pro: true },
    { name: "Custom image backgrounds", free: false, pro: true },
    { name: "Video upload backgrounds", free: false, pro: true },
    { name: "AI hook extraction", free: true, pro: true },
    { name: "AI hook rewriting", free: false, pro: true },
    { name: "Copy link sharing", free: true, pro: true },
    { name: "Social sharing (8 platforms)", free: false, pro: true },
    { name: "QR code + downloadable card", free: false, pro: true },
    { name: "Saved reels library", free: false, pro: true },
    { name: "Direct messages", free: false, pro: true },
    { name: "Private account option", free: false, pro: true },
    { name: "Made on ReelWrite watermark", free: true, pro: true },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-3xl animate-pulse">✒️</div>
      </div>
    );
  }

  return (
    <div className="no-scrollbar h-full overflow-y-auto pt-20 pb-24 px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">👑</div>
        <h1 className="font-serif text-2xl font-bold text-amber-400">Upgrade to Pro</h1>
        <p className="text-sm text-white/60 mt-1">
          {tier === "PRO"
            ? "You're a Pro member ✨"
            : `You've used ${reelsThisMonth}/${reelsLimit} free reels this month`}
        </p>
      </div>

      {/* Current status */}
      {tier === "FREE" && (
        <div className="rounded-xl bg-amber-400/10 border border-amber-400/30 p-3 mb-5 text-center">
          <p className="text-sm text-amber-300">
            {reelsThisMonth >= reelsLimit
              ? "You've reached your free limit. Upgrade for unlimited reels."
              : `${reelsLimit - reelsThisMonth} free reels remaining this month.`}
          </p>
        </div>
      )}

      {/* Pricing cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Free */}
        <div className={cn(
          "rounded-2xl border p-4",
          tier === "FREE" ? "border-white/30 bg-white/5" : "border-white/10 opacity-60"
        )}>
          <div className="text-xs font-semibold text-white/60 uppercase tracking-wide">Free</div>
          <div className="text-3xl font-bold mt-1">$0</div>
          <div className="text-[10px] text-white/40 mb-3">forever</div>
          <div className="space-y-1.5">
            <div className="text-[11px] text-white/70 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" /> 3 reels/month
            </div>
            <div className="text-[11px] text-white/70 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" /> Mood backgrounds
            </div>
            <div className="text-[11px] text-white/70 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" /> AI hook extraction
            </div>
            <div className="text-[11px] text-white/70 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" /> Copy link share
            </div>
          </div>
        </div>

        {/* Pro */}
        <div className={cn(
          "rounded-2xl border p-4 relative",
          tier === "PRO" ? "border-amber-400 bg-amber-400/10" : "border-amber-400/50 bg-amber-400/5"
        )}>
          {tier !== "PRO" && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-black text-[9px] font-bold px-2 py-0.5 rounded-full">
              RECOMMENDED
            </div>
          )}
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Pro</div>
          <div className="text-3xl font-bold mt-1">$5</div>
          <div className="text-[10px] text-white/40 mb-3">per month</div>
          <div className="space-y-1.5">
            <div className="text-[11px] text-white/90 flex items-center gap-1">
              <Check className="w-3 h-3 text-amber-400" /> Unlimited reels
            </div>
            <div className="text-[11px] text-white/90 flex items-center gap-1">
              <Check className="w-3 h-3 text-amber-400" /> All 4 backgrounds
            </div>
            <div className="text-[11px] text-white/90 flex items-center gap-1">
              <Check className="w-3 h-3 text-amber-400" /> AI rewrite
            </div>
            <div className="text-[11px] text-white/90 flex items-center gap-1">
              <Check className="w-3 h-3 text-amber-400" /> 8-platform sharing
            </div>
          </div>
        </div>
      </div>

      {/* Full feature comparison */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 mb-5">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-[11px]">
          <div className="font-semibold text-white/60 pb-2 border-b border-white/10">Feature</div>
          <div className="font-semibold text-white/60 pb-2 border-b border-white/10 text-center w-12">Free</div>
          <div className="font-semibold text-amber-400 pb-2 border-b border-white/10 text-center w-12">Pro</div>
          {features.map((f, i) => (
            <div key={i} className="contents">
              <div className="text-white/80 py-1.5">{f.name}</div>
              <div className="text-center py-1.5">
                {f.free ? <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <span className="text-white/20">—</span>}
              </div>
              <div className="text-center py-1.5">
                {f.pro ? <Check className="w-3.5 h-3.5 text-amber-400 mx-auto" /> : <span className="text-white/20">—</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment instructions */}
      {tier === "FREE" && (
        <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4 mb-4">
          <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            How to upgrade
          </h3>
          <div className="space-y-2 text-xs text-white/70">
            <p className="font-semibold text-white">Bank Transfer (FIB):</p>
            <ol className="list-decimal list-inside space-y-1 ml-1">
              <li>Transfer <strong className="text-amber-400">$5 USD</strong> (or equivalent in IQD) to:</li>
            </ol>
            <div className="rounded-lg bg-black/30 p-3 mt-2 font-mono text-center">
              <div className="text-[10px] text-white/40 uppercase">FIB Bank Account</div>
              <div className="text-sm text-amber-400 font-bold mt-1">[Your FIB Account Number]</div>
              <div className="text-[10px] text-white/40 mt-1">Account holder: [Your Name]</div>
            </div>
            <ol className="list-decimal list-inside space-y-1 ml-1" start={2}>
              <li>Take a screenshot of the transfer confirmation</li>
              <li>Email it to <strong className="text-amber-400">upgrade@reelwrite.app</strong></li>
              <li>Include your username: <strong className="text-white">@{currentUserId}</strong></li>
              <li>Your account will be upgraded within 24 hours</li>
            </ol>
            <div className="mt-3 p-2 rounded-lg bg-amber-400/10 border border-amber-400/20">
              <p className="text-[10px] text-amber-300">
                💡 Tip: One book sale driven by your reel pays for the subscription.
                Typical ebook royalty: $2–$4 per sale.
              </p>
            </div>
          </div>
        </div>
      )}

      {tier === "PRO" && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
          <Crown className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-emerald-400">You're a Pro member ✨</p>
          <p className="text-xs text-white/60 mt-1">
            Enjoy unlimited reels and all features.
          </p>
        </div>
      )}
    </div>
  );
}
