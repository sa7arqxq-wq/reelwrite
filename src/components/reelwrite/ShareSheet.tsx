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

import { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Copy, Check, Download, Link2, Loader2, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { MOODS, getMood } from "@/lib/moods";
import type { ReelWithRelations } from "./ReelCard";

interface ShareSheetProps {
  reel: ReelWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function ShareSheet({ reel, open, onOpenChange }: ShareSheetProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cardReady, setCardReady] = useState(false);

  // Build the shareable URL — points back to this app at the reel's deep link
  const shareUrl = reel
    ? `${typeof window !== "undefined" ? window.location.origin : "https://reelwrite.app"}/?reel=${reel.id}`
    : "";

  // Generate the QR code whenever the reel changes
  useEffect(() => {
    if (!reel || !open) return;
    setQrDataUrl("");
    QRCode.toDataURL(shareUrl, {
      margin: 1,
      width: 480,
      color: { dark: "#0a0a0a", light: "#fafaf9" },
      errorCorrectionLevel: "M",
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [reel, open, shareUrl]);

  // Render the shareable card onto a hidden canvas once we have the QR
  useEffect(() => {
    if (!reel || !qrDataUrl || !open) return;
    setCardReady(false);
    renderCard(reel, qrDataUrl).then((canvas) => {
      if (canvas) {
        cardCanvasRef.current = canvas;
        setCardReady(true);
      }
    });
  }, [reel, qrDataUrl, open]);

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadCard() {
    if (!cardCanvasRef.current || !reel) return;
    setDownloading(true);
    try {
      const dataUrl = cardCanvasRef.current.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      const slug = reel.hook
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40);
      a.download = `reelwrite-${reel.author.username}-${slug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] max-h-[85vh] flex flex-col bg-[#0a0a0a] border-white/10 text-white p-0"
      >
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-white/10">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Link2 className="w-4 h-4 text-amber-400" />
            Share this reel
          </SheetTitle>
          <SheetDescription className="sr-only">
            Share this 7-second reel via link, QR code, or downloadable card.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!reel ? (
            <div className="text-center text-sm text-white/50 py-12">
              No reel selected.
            </div>
          ) : (
            <>
              {/* Shareable card preview */}
              <CardPreview reel={reel} qrDataUrl={qrDataUrl} />

              {/* Share URL */}
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
                    className={
                      copied
                        ? "bg-emerald-500 text-white hover:bg-emerald-500"
                        : "bg-amber-400 text-black hover:bg-amber-300"
                    }
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* QR code */}
              <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
                <div className="text-[10px] uppercase tracking-wider text-white/55 font-semibold mb-2 flex items-center gap-1">
                  <QrCode className="w-3 h-3" />
                  QR code
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-white shrink-0 flex items-center justify-center">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR code for reel"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
                    )}
                  </div>
                  <p className="text-xs text-white/65 leading-relaxed">
                    Scan with any phone camera to open this reel directly.
                    Perfect for posters, bookmarks, and book-signing swag.
                  </p>
                </div>
              </div>

              {/* Download button */}
              <Button
                onClick={downloadCard}
                disabled={!cardReady || downloading}
                className="w-full bg-amber-400 text-black hover:bg-amber-300 font-bold py-3"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download shareable card (.png)
                  </>
                )}
              </Button>
              <p className="text-[10px] text-white/40 text-center">
                The card includes the hook, author, book cover, and QR code —
                ready to post anywhere.
              </p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Live preview of the shareable card, rendered as HTML/CSS.
 * The actual downloadable PNG is rendered to a hidden canvas in renderCard().
 */
function CardPreview({
  reel,
  qrDataUrl,
}: {
  reel: ReelWithRelations;
  qrDataUrl: string;
}) {
  const mood = getMood(reel.mood);
  const moodData = MOODS[mood];

  return (
    <div
      className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden border border-white/10"
      style={{
        background: `radial-gradient(120% 100% at 50% 0%, ${moodData.to} 0%, ${moodData.from} 70%, #050505 100%)`,
      }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -top-1/3 left-1/2 -translate-x-1/2 w-[120%] h-[80%] rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(circle, ${moodData.accent} 0%, transparent 70%)` }}
      />

      {/* Top branding bar */}
      <div className="absolute top-0 left-0 right-0 px-4 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">✒️</span>
          <span className="font-serif text-xs font-bold tracking-tight text-amber-400">
            ReelWrite
          </span>
        </div>
        <div
          className="text-[9px] font-mono px-2 py-0.5 rounded-full"
          style={{
            background: `${moodData.accent}22`,
            color: moodData.accent,
            border: `1px solid ${moodData.accent}44`,
          }}
        >
          7s reel
        </div>
      </div>

      {/* Hook */}
      <div className="absolute inset-0 flex items-center justify-center px-6 pt-8 pb-32">
        <p
          className="font-serif text-xl font-bold leading-tight text-center"
          style={{ color: "#fafaf9", textShadow: `0 2px 20px ${moodData.accent}55` }}
        >
          {reel.hook}
        </p>
      </div>

      {/* Bottom: author + book + QR */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className="flex w-5 h-5 rounded-full items-center justify-center text-[10px]"
                style={{ background: reel.author.avatarColor }}
              >
                {reel.author.avatarEmoji}
              </span>
              <span className="text-[11px] font-semibold truncate">
                @{reel.author.username}
              </span>
            </div>
            {reel.book && (
              <div className="text-[9px] text-white/60 truncate">
                📖 {reel.book.title}
                {reel.book.genre ? ` · ${reel.book.genre}` : ""}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1.5 text-[9px] text-white/50">
              <span>❤️ {formatCount(reel.likes)}</span>
              <span>👁 {formatCount(reel.views)}</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-md overflow-hidden bg-white shrink-0 flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR"
                className="w-full h-full object-contain"
              />
            ) : (
              <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Render the shareable card to a canvas, returns the canvas.
 * Mirrors the CardPreview layout but in raw canvas pixels for download.
 */
async function renderCard(
  reel: ReelWithRelations,
  qrDataUrl: string
): Promise<HTMLCanvasElement | null> {
  const W = 1080;
  const H = 1350; // 4:5 portrait
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const mood = getMood(reel.mood);
  const moodData = MOODS[mood];

  // 1. Background gradient
  const bgGrad = ctx.createRadialGradient(W / 2, 0, 0, W / 2, H / 2, H);
  bgGrad.addColorStop(0, moodData.to);
  bgGrad.addColorStop(0.7, moodData.from);
  bgGrad.addColorStop(1, "#050505");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Ambient glow circle (top)
  const glowGrad = ctx.createRadialGradient(W / 2, H * 0.1, 0, W / 2, H * 0.1, W * 0.6);
  glowGrad.addColorStop(0, `${moodData.accent}40`);
  glowGrad.addColorStop(1, "transparent");
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, W, H);

  // 3. Top branding bar
  ctx.font = "bold 36px Georgia, serif";
  ctx.fillStyle = "#f59e0b";
  ctx.textBaseline = "middle";
  ctx.fillText("✒️ ReelWrite", 60, 70);

  // "7s reel" pill (top right)
  ctx.font = "bold 22px monospace";
  const pillText = "7s reel";
  const pillW = ctx.measureText(pillText).width + 40;
  const pillH = 44;
  const pillX = W - 60 - pillW;
  const pillY = 50;
  ctx.fillStyle = `${moodData.accent}22`;
  roundRect(ctx, pillX, pillY, pillW, pillH, 22);
  ctx.fill();
  ctx.strokeStyle = `${moodData.accent}66`;
  ctx.lineWidth = 2;
  roundRect(ctx, pillX, pillY, pillW, pillH, 22);
  ctx.stroke();
  ctx.fillStyle = moodData.accent;
  ctx.textAlign = "center";
  ctx.fillText(pillText, pillX + pillW / 2, pillY + pillH / 2 + 2);
  ctx.textAlign = "left";

  // 4. Hook text — centered, wrapped
  ctx.fillStyle = "#fafaf9";
  ctx.font = "bold 64px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Shadow
  ctx.shadowColor = `${moodData.accent}88`;
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 2;
  const lines = wrapText(ctx, reel.hook, W - 160);
  const lineHeight = 76;
  const totalH = lines.length * lineHeight;
  const startY = H / 2 - totalH / 2 - 40;
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, startY + i * lineHeight);
  });
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 5. Bottom gradient overlay
  const bottomGrad = ctx.createLinearGradient(0, H - 380, 0, H);
  bottomGrad.addColorStop(0, "transparent");
  bottomGrad.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, H - 380, W, 380);

  // 6. QR code (bottom right)
  const qrSize = 220;
  const qrX = W - 60 - qrSize;
  const qrY = H - 60 - qrSize;
  try {
    const qrImg = await loadImage(qrDataUrl);
    // White background for QR
    ctx.fillStyle = "#fafaf9";
    roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 16);
    ctx.fill();
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  } catch {
    // skip QR on load error
  }

  // 7. Author + book info (bottom left)
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  // Author avatar circle
  ctx.fillStyle = reel.author.avatarColor;
  ctx.beginPath();
  ctx.arc(100, H - 200, 30, 0, Math.PI * 2);
  ctx.fill();
  // Avatar emoji
  ctx.font = "32px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(reel.author.avatarEmoji, 100, H - 198);
  ctx.textAlign = "left";

  // Author username
  ctx.font = "bold 34px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`@${reel.author.username}`, 150, H - 200);

  // Book info
  if (reel.book) {
    ctx.font = "26px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    const bookText = `📖 ${reel.book.title}${reel.book.genre ? ` · ${reel.book.genre}` : ""}`;
    const truncated = truncateText(ctx, bookText, W - qrSize - 200);
    ctx.fillText(truncated, 60, H - 130);
  }

  // Stats line
  ctx.font = "24px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText(
    `❤️ ${formatCount(reel.likes)}   👁 ${formatCount(reel.views)}   🔗 reelwrite.app`,
    60,
    H - 80
  );

  return canvas;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  // Cap at 6 lines to fit the card
  return lines.slice(0, 6);
}

function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + "…").width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
