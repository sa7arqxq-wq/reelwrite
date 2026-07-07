"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DMUser {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  avatarEmoji: string;
  image?: string | null;
}

interface DMMessage {
  id: string;
  text: string;
  createdAt: string;
  senderId: string;
  sender: DMUser;
}

interface Conversation {
  id: string;
  otherUser: DMUser | null;
  lastMessage: { text: string; createdAt: string; senderId: string } | null;
  hasUnread: boolean;
}

interface DMModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  targetUserId?: string | null;
}

export function DMModal({ open, onOpenChange, currentUserId, targetUserId }: DMModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(() => {
    fetch("/api/dm/conversations")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []))
      .catch(() => {});
  }, []);

  // Load conversations when modal opens
  useEffect(() => {
    if (open) loadConversations();
  }, [open, loadConversations]);

  // If a target user is specified, create/find conversation with them
  useEffect(() => {
    if (open && targetUserId) {
      setError("");
      fetch(`/api/dm/start/${targetUserId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.conversationId) {
            setActiveConversationId(d.conversationId);
            loadMessages(d.conversationId);
          } else if (d.error) {
            setError(d.error);
          }
        })
        .catch(() => {});
    } else if (!open) {
      setActiveConversationId(null);
      setMessages([]);
      setError("");
    }
  }, [open, targetUserId]);

  function loadMessages(conversationId: string) {
    fetch(`/api/dm/conversations/${conversationId}/messages`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []))
      .catch(() => {})
      .finally(() => {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      });
  }

  async function sendMessage() {
    if (!text.trim() || !activeConversationId) return;
    const messageText = text.trim();
    setText("");
    try {
      const res = await fetch(`/api/dm/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: messageText }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch {
      setText(messageText);
    }
  }

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] max-h-[85vh] flex flex-col bg-[#0a0a0a] border-white/10 text-white p-0"
      >
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-white/10">
          <SheetTitle className="flex items-center gap-2 text-base">
            {activeConversationId ? (
              <button onClick={() => { setActiveConversationId(null); setMessages([]); }}>
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <MessageCircle className="w-5 h-5 text-amber-400" />
            )}
            {activeConversation?.otherUser
              ? `@${activeConversation.otherUser.username}`
              : "Direct Messages"}
          </SheetTitle>
          <SheetDescription className="sr-only">DM conversations</SheetDescription>
        </SheetHeader>

        {error && (
          <div className="px-4 py-3 bg-rose-500/10 border-b border-rose-500/30 text-sm text-rose-300">
            {error}
          </div>
        )}

        {/* Conversation list or messages */}
        {!activeConversationId ? (
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-10 h-10 text-white/20 mx-auto mb-2" />
                <p className="text-sm text-white/50">No conversations yet.</p>
                <p className="text-xs text-white/40 mt-1">
                  Tap the DM icon on a writer&apos;s profile to start chatting.
                </p>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setActiveConversationId(c.id); loadMessages(c.id); }}
                  className="w-full flex items-center gap-3 rounded-lg p-2.5 hover:bg-white/5 transition-colors text-left"
                >
                  {c.otherUser?.image ? (
                    <img src={c.otherUser.image} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <span
                      className="flex w-12 h-12 rounded-full items-center justify-center text-lg shrink-0"
                      style={{ background: c.otherUser?.avatarColor || "#f59e0b" }}
                    >
                      {c.otherUser?.avatarEmoji || "✍️"}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm truncate">
                        {c.otherUser?.displayName || "Unknown"}
                      </span>
                      {c.hasUnread && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-white/55 truncate">
                      {c.lastMessage?.text || "No messages yet"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((m) => {
                const isMe = m.senderId === currentUserId;
                return (
                  <div key={m.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                        isMe
                          ? "bg-amber-400 text-black rounded-br-md"
                          : "bg-white/10 text-white rounded-bl-md"
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="border-t border-white/10 p-3 flex gap-2 safe-area-bottom">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                placeholder="Type a message…"
                className="bg-white/5 border-white/15 text-white placeholder:text-white/35 focus-visible:ring-amber-400/50"
              />
              <Button
                onClick={sendMessage}
                disabled={!text.trim()}
                className="bg-amber-400 text-black hover:bg-amber-300"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
