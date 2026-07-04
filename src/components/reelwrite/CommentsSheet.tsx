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

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Heart } from "lucide-react";
import { ReelWithRelations } from "./ReelCard";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarColor: string;
    avatarEmoji: string;
  };
}

interface CommentsSheetProps {
  reel: ReelWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
}

export function CommentsSheet({
  reel,
  open,
  onOpenChange,
  currentUserId,
}: CommentsSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reel || !open) return;
    setLoading(true);
    fetch(`/api/reels/${reel.id}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(data.comments || []))
      .finally(() => setLoading(false));
  }, [reel, open]);

  async function submit() {
    if (!reel || !text.trim()) return;
    const res = await fetch(`/api/reels/${reel.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUserId, text }),
    });
    const data = await res.json();
    if (data.comment) {
      setComments((c) => [data.comment, ...c]);
      setText("");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[70vh] max-h-[70vh] flex flex-col bg-[#0a0a0a] border-white/10 text-white p-0"
      >
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-white/10">
          <SheetTitle className="text-base">
            {comments.length} comments
          </SheetTitle>
          <SheetDescription className="sr-only">
            Comments on this reel
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {loading && (
            <div className="text-sm text-white/50 text-center py-8">
              Loading comments…
            </div>
          )}
          {!loading && comments.length === 0 && (
            <div className="text-sm text-white/50 text-center py-12">
              <div className="text-3xl mb-2">💬</div>
              Be the first to comment.
            </div>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <span
                className="flex w-9 h-9 shrink-0 rounded-full items-center justify-center text-base"
                style={{ background: c.user.avatarColor }}
              >
                {c.user.avatarEmoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold">
                    @{c.user.username}
                  </span>
                  <span className="text-[10px] text-white/40">
                    {new Date(c.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-sm text-white/85 break-words">{c.text}</p>
              </div>
              <button
                className="self-start mt-1 text-white/40 hover:text-rose-400 transition-colors"
                aria-label="Like comment"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-3 flex gap-2 safe-area-bottom">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            className={cn(
              "flex-1 bg-white/5 border-white/15 text-white placeholder:text-white/40",
              "focus-visible:ring-amber-400/50"
            )}
          />
          <Button
            onClick={submit}
            disabled={!text.trim()}
            className="bg-amber-400 text-black hover:bg-amber-300"
            size="icon"
            aria-label="Send comment"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
