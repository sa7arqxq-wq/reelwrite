"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Shield,
  Users,
  Film,
  MessageSquare,
  TrendingUp,
  Trash2,
  Star,
  Ban,
  Crown,
  Eye,
  Heart,
  Share2,
  Bookmark,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MOODS } from "@/lib/moods";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalUsers: number;
  totalWriters: number;
  totalAdmins: number;
  totalReels: number;
  totalBooks: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  totalShares: number;
  totalSaves: number;
  bannedUsers: number;
  featuredReels: number;
  reelsToday: number;
  usersToday: number;
}

interface AdminReel {
  id: string;
  hook: string;
  mood: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  featured: boolean;
  createdAt: string;
  author: { id: string; username: string; displayName: string; avatarColor: string; avatarEmoji: string; banned: boolean };
  book: { title: string; genre: string } | null;
}

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarColor: string;
  avatarEmoji: string;
  role: string;
  banned: boolean;
  followers: number;
  reelsCount: number;
  createdAt: string;
  _count: { reels: number; books: number; comments: number };
}

interface AdminComment {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatarColor: string; avatarEmoji: string; banned: boolean };
  reel: { id: string; hook: string; author: { username: string } } | null;
}

interface AdminData {
  stats: AdminStats;
  topReels: AdminReel[];
  recentReels: AdminReel[];
  recentComments: AdminComment[];
}

interface AdminViewProps {
  currentUserId: string;
  onOpenProfile: (writerId: string) => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function AdminView({ currentUserId, onOpenProfile }: AdminViewProps) {
  const [data, setData] = useState<AdminData | null>(null);
  const [allReels, setAllReels] = useState<AdminReel[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const loadStats = useCallback(() => {
    fetch(`/api/admin/stats?userId=${currentUserId}`)
      .then((r) => {
        if (r.status === 403) throw new Error("forbidden");
        return r.json();
      })
      .then((d) => setData(d))
      .catch((e) => {
        if (e.message === "forbidden") {
          toast({
            title: "Admins only",
            description: "Your account does not have admin privileges.",
            variant: "destructive",
          });
        }
      });
  }, [currentUserId, toast]);

  const loadAllReels = useCallback(() => {
    fetch(`/api/admin/reels?userId=${currentUserId}`)
      .then((r) => r.json())
      .then((d) => setAllReels(d.reels || []))
      .catch(() => {});
  }, [currentUserId]);

  const loadAllUsers = useCallback(() => {
    fetch(`/api/admin/users?userId=${currentUserId}`)
      .then((r) => r.json())
      .then((d) => setAllUsers(d.users || []))
      .catch(() => {});
  }, [currentUserId]);

  useEffect(() => {
    Promise.all([loadStats(), loadAllReels(), loadAllUsers()]).finally(() =>
      setLoading(false)
    );
  }, [loadStats, loadAllReels, loadAllUsers]);

  function refresh() {
    setRefreshing(true);
    Promise.all([loadStats(), loadAllReels(), loadAllUsers()]).finally(() =>
      setTimeout(() => setRefreshing(false), 400)
    );
  }

  // Reel actions
  async function toggleFeature(reel: AdminReel) {
    const action = reel.featured ? "unfeature" : "feature";
    const res = await fetch(`/api/admin/reels/${reel.id}?userId=${currentUserId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUserId, action }),
    });
    if (res.ok) {
      toast({
        title: action === "feature" ? "Reel featured ⭐" : "Reel unfeatured",
        description: reel.hook.slice(0, 60) + (reel.hook.length > 60 ? "…" : ""),
      });
      // Optimistically update both lists
      const updated = { ...reel, featured: !reel.featured };
      setAllReels((prev) =>
        prev.map((r) => (r.id === reel.id ? updated : r))
      );
      setData((d) =>
        d
          ? {
              ...d,
              recentReels: d.recentReels.map((r) =>
                r.id === reel.id ? updated : r
              ),
              stats: {
                ...d.stats,
                featuredReels:
                  d.stats.featuredReels + (updated.featured ? 1 : -1),
              },
            }
          : d
      );
    }
  }

  async function deleteReel(reel: AdminReel) {
    if (!confirm(`Delete this reel?\n\n"${reel.hook.slice(0, 80)}${reel.hook.length > 80 ? "…" : ""}"\n\nThis cannot be undone.`)) {
      return;
    }
    const res = await fetch(`/api/admin/reels/${reel.id}?userId=${currentUserId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast({
        title: "Reel deleted",
        description: "Likes, comments, and saves were also removed.",
        variant: "destructive",
      });
      setAllReels((prev) => prev.filter((r) => r.id !== reel.id));
      setData((d) =>
        d
          ? {
              ...d,
              recentReels: d.recentReels.filter((r) => r.id !== reel.id),
              topReels: d.topReels.filter((r) => r.id !== reel.id),
              stats: {
                ...d.stats,
                totalReels: d.stats.totalReels - 1,
                featuredReels: d.stats.featuredReels - (reel.featured ? 1 : 0),
              },
            }
          : d
      );
    }
  }

  // User actions
  async function patchUser(user: AdminUser, action: "promote" | "demote" | "ban" | "unban") {
    const res = await fetch(`/api/admin/users/${user.id}?userId=${currentUserId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUserId, action }),
    });
    const json = await res.json();
    if (res.ok) {
      const labels: Record<typeof action, string> = {
        promote: "Promoted to admin 👑",
        demote: "Demoted to user",
        ban: "User banned 🔨",
        unban: "User unbanned",
      };
      toast({ title: labels[action], description: `@${user.username}` });
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                role: action === "promote" ? "ADMIN" : action === "demote" ? "USER" : u.role,
                banned:
                  action === "ban" ? true : action === "unban" ? false : u.banned,
              }
            : u
        )
      );
    } else {
      toast({
        title: "Action blocked",
        description: json.error || "Could not perform this action.",
        variant: "destructive",
      });
    }
  }

  // Comment actions
  async function deleteComment(comment: AdminComment) {
    const res = await fetch(`/api/admin/comments/${comment.id}?userId=${currentUserId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast({
        title: "Comment removed",
        description: comment.text.slice(0, 50) + (comment.text.length > 50 ? "…" : ""),
        variant: "destructive",
      });
      setData((d) =>
        d
          ? {
              ...d,
              recentComments: d.recentComments.filter((c) => c.id !== comment.id),
              stats: { ...d.stats, totalComments: d.stats.totalComments - 1 },
            }
          : d
      );
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-6">
        <AlertTriangle className="w-10 h-10 text-rose-400 mb-3" />
        <h3 className="text-lg font-bold mb-1">Admin access required</h3>
        <p className="text-sm text-white/55">
          Your account does not have admin privileges.
        </p>
      </div>
    );
  }

  return (
    <div className="no-scrollbar h-full overflow-y-auto pt-20 pb-24">
      {/* Header */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Shield className="w-5 h-5 text-amber-400" />
            Admin Console
          </h1>
          <p className="text-xs text-white/55">
            You have full control of ReelWrite.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={refreshing}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RefreshCw className={cn("w-4 h-4 mr-1.5", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats grid */}
      <div className="px-4 grid grid-cols-2 gap-2 mb-4">
        <StatCard
          icon={<Users className="w-4 h-4" />}
          label="Users"
          value={data.stats.totalUsers}
          sub={`${data.stats.usersToday} today`}
        />
        <StatCard
          icon={<Film className="w-4 h-4" />}
          label="Reels"
          value={data.stats.totalReels}
          sub={`${data.stats.reelsToday} today`}
        />
        <StatCard
          icon={<Eye className="w-4 h-4" />}
          label="Total views"
          value={data.stats.totalViews}
          sub="all-time"
        />
        <StatCard
          icon={<Heart className="w-4 h-4" />}
          label="Total likes"
          value={data.stats.totalLikes}
          sub="all-time"
        />
        <StatCard
          icon={<MessageSquare className="w-4 h-4" />}
          label="Comments"
          value={data.stats.totalComments}
          sub="all-time"
        />
        <StatCard
          icon={<Star className="w-4 h-4" />}
          label="Featured reels"
          value={data.stats.featuredReels}
          sub="pinned to For You"
        />
        <StatCard
          icon={<Crown className="w-4 h-4" />}
          label="Admins"
          value={data.stats.totalAdmins}
          sub={`${data.stats.totalWriters} writers total`}
        />
        <StatCard
          icon={<Ban className="w-4 h-4" />}
          label="Banned users"
          value={data.stats.bannedUsers}
          sub="active suspensions"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reels" className="px-4">
        <TabsList className="bg-white/5 border border-white/10 w-full justify-between h-auto p-1">
          <TabsTrigger
            value="reels"
            className="flex-1 data-[state=active]:bg-amber-400 data-[state=active]:text-black text-white/70"
          >
            Reels
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="flex-1 data-[state=active]:bg-amber-400 data-[state=active]:text-black text-white/70"
          >
            Users
          </TabsTrigger>
          <TabsTrigger
            value="comments"
            className="flex-1 data-[state=active]:bg-amber-400 data-[state=active]:text-black text-white/70"
          >
            Comments
          </TabsTrigger>
          <TabsTrigger
            value="top"
            className="flex-1 data-[state=active]:bg-amber-400 data-[state=active]:text-black text-white/70"
          >
            Top
          </TabsTrigger>
        </TabsList>

        {/* REELS TAB */}
        <TabsContent value="reels" className="mt-3 space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-white/55 mb-1">
            {allReels.length} reels · most recent first
          </div>
          {allReels.map((reel) => (
            <ReelModerationRow
              key={reel.id}
              reel={reel}
              onToggleFeature={() => toggleFeature(reel)}
              onDelete={() => deleteReel(reel)}
              onOpenProfile={() => onOpenProfile(reel.author.id)}
            />
          ))}
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users" className="mt-3 space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-white/55 mb-1">
            {allUsers.length} users
          </div>
          {allUsers.map((user) => (
            <UserModerationRow
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
              onAction={(action) => patchUser(user, action)}
              onOpenProfile={() => onOpenProfile(user.id)}
            />
          ))}
        </TabsContent>

        {/* COMMENTS TAB */}
        <TabsContent value="comments" className="mt-3 space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-white/55 mb-1">
            {data.recentComments.length} most recent comments
          </div>
          {data.recentComments.length === 0 && (
            <div className="text-sm text-white/50 text-center py-8">
              No comments yet.
            </div>
          )}
          {data.recentComments.map((c) => (
            <div
              key={c.id}
              className="rounded-lg bg-white/[0.04] border border-white/10 p-3"
            >
              <div className="flex items-start gap-2">
                <span
                  className="flex w-8 h-8 shrink-0 rounded-full items-center justify-center text-sm"
                  style={{ background: c.user.avatarColor }}
                >
                  {c.user.avatarEmoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">@{c.user.username}</span>
                    {c.user.banned && (
                      <Badge variant="outline" className="border-rose-500 text-rose-400 text-[9px] py-0">
                        BANNED
                      </Badge>
                    )}
                    <span className="text-[10px] text-white/40">
                      {new Date(c.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-white/85 break-words mt-0.5">{c.text}</p>
                  {c.reel && (
                    <p className="text-[10px] text-white/40 mt-1 truncate">
                      on @{c.reel.author.username}&apos;s reel: &ldquo;{c.reel.hook.slice(0, 50)}…&rdquo;
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 px-2"
                  onClick={() => deleteComment(c)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* TOP TAB */}
        <TabsContent value="top" className="mt-3 space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-white/55 mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Top 5 reels by views
          </div>
          {data.topReels.map((reel, i) => (
            <div
              key={reel.id}
              className="flex items-center gap-3 rounded-lg bg-white/[0.04] border border-white/10 p-3"
            >
              <div className="text-2xl font-bold text-amber-400 w-6 text-center">
                {i + 1}
              </div>
              <span
                className="flex w-9 h-9 shrink-0 rounded-full items-center justify-center text-base"
                style={{ background: reel.author.avatarColor }}
              >
                {reel.author.avatarEmoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">
                  @{reel.author.username}
                </div>
                <p className="text-xs text-white/70 line-clamp-1">
                  {reel.hook}
                </p>
              </div>
              <div className="text-right text-[10px] text-white/55 shrink-0">
                <div className="font-bold text-amber-400">
                  {formatCount(reel.views)}
                </div>
                <div>views</div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
      <div className="flex items-center gap-1.5 text-white/55 text-[11px] uppercase tracking-wider font-semibold">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold mt-1">{formatCount(value)}</div>
      <div className="text-[10px] text-white/45 mt-0.5">{sub}</div>
    </div>
  );
}

function ReelModerationRow({
  reel,
  onToggleFeature,
  onDelete,
  onOpenProfile,
}: {
  reel: AdminReel;
  onToggleFeature: () => void;
  onDelete: () => void;
  onOpenProfile: () => void;
}) {
  const mood = MOODS[(reel.mood as keyof typeof MOODS) || "amber"];
  return (
    <div className="rounded-lg bg-white/[0.04] border border-white/10 p-3">
      <div className="flex gap-3">
        {/* Mood swatch */}
        <div
          className="w-10 h-14 shrink-0 rounded-md flex items-center justify-center text-lg"
          style={{ background: `linear-gradient(160deg, ${mood.from}, ${mood.to})` }}
        >
          {mood.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenProfile}
              className="text-sm font-semibold hover:text-amber-400 transition-colors"
            >
              @{reel.author.username}
            </button>
            {reel.featured && (
              <Badge variant="outline" className="border-amber-400 text-amber-400 text-[9px] py-0">
                <Star className="w-2.5 h-2.5 mr-0.5 fill-amber-400" />
                FEATURED
              </Badge>
            )}
            {reel.author.banned && (
              <Badge variant="outline" className="border-rose-500 text-rose-400 text-[9px] py-0">
                BANNED AUTHOR
              </Badge>
            )}
            <span className="text-[10px] text-white/40">
              {new Date(reel.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <p className="text-xs text-white/85 mt-1 line-clamp-2">{reel.hook}</p>
          {reel.book && (
            <p className="text-[10px] text-white/45 mt-0.5">
              📖 {reel.book.title} · {reel.book.genre}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/55">
            <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" /> {formatCount(reel.likes)}</span>
            <span className="flex items-center gap-0.5"><MessageSquare className="w-2.5 h-2.5" /> {formatCount(reel.comments)}</span>
            <span className="flex items-center gap-0.5"><Share2 className="w-2.5 h-2.5" /> {formatCount(reel.shares)}</span>
            <span className="flex items-center gap-0.5"><Bookmark className="w-2.5 h-2.5" /> {formatCount(reel.saves)}</span>
            <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" /> {formatCount(reel.views)}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleFeature}
          className={cn(
            "h-7 text-[11px] flex-1",
            reel.featured
              ? "border-amber-400 text-amber-400 hover:bg-amber-400/10"
              : "border-white/20 text-white/70 hover:bg-white/10"
          )}
        >
          <Star className={cn("w-3 h-3 mr-1", reel.featured && "fill-amber-400")} />
          {reel.featured ? "Unfeature" : "Feature"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          className="h-7 text-[11px] border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}

function UserModerationRow({
  user,
  isSelf,
  onAction,
  onOpenProfile,
}: {
  user: AdminUser;
  isSelf: boolean;
  onAction: (action: "promote" | "demote" | "ban" | "unban") => void;
  onOpenProfile: () => void;
}) {
  const isAdmin = user.role === "ADMIN";
  return (
    <div className="rounded-lg bg-white/[0.04] border border-white/10 p-3">
      <div className="flex items-start gap-3">
        <span
          className="flex w-10 h-10 shrink-0 rounded-full items-center justify-center text-lg ring-2 ring-white/10"
          style={{ background: user.avatarColor }}
        >
          {user.avatarEmoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenProfile}
              className="text-sm font-semibold hover:text-amber-400 transition-colors"
            >
              {user.displayName}
            </button>
            {isAdmin && (
              <Badge variant="outline" className="border-amber-400 text-amber-400 text-[9px] py-0">
                <Crown className="w-2.5 h-2.5 mr-0.5" />
                ADMIN
              </Badge>
            )}
            {user.banned && (
              <Badge variant="outline" className="border-rose-500 text-rose-400 text-[9px] py-0">
                BANNED
              </Badge>
            )}
            {isSelf && (
              <Badge variant="outline" className="border-white/30 text-white/60 text-[9px] py-0">
                YOU
              </Badge>
            )}
          </div>
          <div className="text-xs text-white/50">@{user.username}</div>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-white/55">
            <span>{user._count.reels} reels</span>
            <span>·</span>
            <span>{user._count.books} books</span>
            <span>·</span>
            <span>{user._count.comments} comments</span>
            <span>·</span>
            <span>{formatCount(user.followers)} followers</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {!isAdmin ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isSelf}
            onClick={() => onAction("promote")}
            className="h-7 text-[11px] border-amber-400/50 text-amber-400 hover:bg-amber-400/10 disabled:opacity-30"
            title={isSelf ? "You cannot promote yourself" : undefined}
          >
            <Crown className="w-3 h-3 mr-1" />
            Make admin
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={isSelf}
            onClick={() => onAction("demote")}
            className="h-7 text-[11px] border-white/20 text-white/70 hover:bg-white/10 disabled:opacity-30"
            title={isSelf ? "You cannot demote yourself" : undefined}
          >
            Demote
          </Button>
        )}
        {!user.banned ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isSelf}
            onClick={() => onAction("ban")}
            className="h-7 text-[11px] border-rose-500/50 text-rose-400 hover:bg-rose-500/10 disabled:opacity-30"
            title={isSelf ? "You cannot ban yourself" : undefined}
          >
            <Ban className="w-3 h-3 mr-1" />
            Ban
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction("unban")}
            className="h-7 text-[11px] border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
          >
            Unban
          </Button>
        )}
      </div>
    </div>
  );
}
