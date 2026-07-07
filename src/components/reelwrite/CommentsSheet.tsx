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
import { Send, Heart, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommentUser {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  avatarEmoji: string;
  image?: string | null;
}

interface Reply {
  id: string;
  text: string;
  createdAt: string;
  parentCommentId: string;
  user: CommentUser;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  parentCommentId?: string | null;
  user: CommentUser;
  replies?: Reply[];
}

interface CommentsSheetProps {
  reel: {
    id: string;
    hook: string;
    author: { username: string };
  } | null;
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!reel || !open) return;
    setLoading(true);
    fetch(`/api/reels/${reel.id}/comments`)
      .then((r) => r.json())
      .then((data) => setComments(data.comments || []))
      .finally(() => setLoading(false));
  }, [reel, open]);

  async function submitComment() {
    if (!reel || !text.trim()) return;
    const res = await fetch(`/api/reels/${reel.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUserId, text }),
    });
    const data = await res.json();
    if (data.comment) {
      setComments((c) => [...c, { ...data.comment, replies: [] }]);
      setText("");
    }
  }

  async function submitReply(parentId: string) {
    if (!reel || !replyText.trim()) return;
    const res = await fetch(`/api/reels/${reel.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUserId,
        text: replyText,
        parentCommentId: parentId,
      }),
    });
    const data = await res.json();
    if (data.comment) {
      setComments((c) =>
        c.map((comment) =>
          comment.id === parentId
            ? { ...comment, replies: [...(comment.replies || []), data.comment] }
            : comment
        )
      );
      setReplyText("");
      setReplyingTo(null);
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
            Comments and replies on this reel
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
            <div key={c.id} className="space-y-2">
              {/* Top-level comment */}
              <div className="flex gap-3">
                {c.user.image ? (
                  <img src={c.user.image} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <span
                    className="flex w-9 h-9 shrink-0 rounded-full items-center justify-center text-sm"
                    style={{ background: c.user.avatarColor }}
                  >
                    {c.user.avatarEmoji}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">@{c.user.username}</span>
                    {reel?.author.username === c.user.username && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 font-bold">
                        AUTHOR
                      </span>
                    )}
                    <span className="text-[10px] text-white/40">
                      {new Date(c.createdAt).toLocaleDateString(undefined, {
                        month: "short", day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-white/85 break-words">{c.text}</p>
                  <button
                    onClick={() => {
                      setReplyingTo(replyingTo === c.id ? null : c.id);
                      setReplyText("");
                    }}
                    className="text-[11px] text-white/40 hover:text-amber-400 mt-1 flex items-center gap-1"
                  >
                    <CornerDownRight className="w-3 h-3" />
                    Reply
                  </button>

                  {/* Reply input */}
                  {replyingTo === c.id && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to @${c.user.username}…`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitReply(c.id);
                        }}
                        className="bg-white/5 border-white/15 text-white placeholder:text-white/35 text-xs h-8 focus-visible:ring-amber-400/50"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => submitReply(c.id)}
                        disabled={!replyText.trim()}
                        className="bg-amber-400 text-black hover:bg-amber-300 h-8 w-8 p-0"
                      >
                        <Send className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Nested replies */}
              {c.replies && c.replies.length > 0 && (
                <div className="ml-12 space-y-2">
                  {c.replies.map((r) => (
                    <div key={r.id} className="flex gap-2">
                      {r.user.image ? (
                        <img src={r.user.image} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <span
                          className="flex w-7 h-7 shrink-0 rounded-full items-center justify-center text-xs"
                          style={{ background: r.user.avatarColor }}
                        >
                          {r.user.avatarEmoji}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold">@{r.user.username}</span>
                          {reel?.author.username === r.user.username && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 font-bold">
                              AUTHOR
                            </span>
                          )}
                          <span className="text-[9px] text-white/40">
                            {new Date(r.createdAt).toLocaleDateString(undefined, {
                              month: "short", day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-white/80 break-words">{r.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-3 flex gap-2 safe-area-bottom">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            onKeyDown={(e) => {
              if (e.key === "Enter") submitComment();
            }}
            className={cn(
              "flex-1 bg-white/5 border-white/15 text-white placeholder:text-white/40",
              "focus-visible:ring-amber-400/50"
            )}
          />
          <Button
            onClick={submitComment}
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
