"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Shield,
  ShieldAlert,
  Ban,
  Activity,
  Bug,
  Code2,
  FolderTree,
  Gauge,
  Trash2,
  Lock,
  Unlock,
  Loader2,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SecurityStats {
  totalEvents: number;
  events24h: number;
  events1h: number;
  blockedIps: number;
  honeypots24h: number;
  sqli24h: number;
  xss24h: number;
  pathTraversal24h: number;
  criticalEvents24h: number;
}

interface SecurityEvent {
  id: string;
  ip: string;
  path: string;
  method: string;
  userAgent: string;
  type: string;
  severity: string;
  blocked: boolean;
  metadata: string;
  createdAt: string;
}

interface BlockedIp {
  id: string;
  ip: string;
  reason: string;
  expiresAt: string;
  createdAt: string;
}

interface SecurityTabProps {
  currentUserId: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  LOW: "border-white/30 text-white/60",
  MEDIUM: "border-amber-500/50 text-amber-400",
  HIGH: "border-orange-500/50 text-orange-400",
  CRITICAL: "border-rose-500/50 text-rose-400",
};

const TYPE_ICONS: Record<string, typeof Bug> = {
  HONEYPOT: FolderTree,
  SQL_INJECTION: Bug,
  XSS: Code2,
  PATH_TRAVERSAL: FolderTree,
  CMD_INJECTION: Bug,
  RATE_LIMIT: Gauge,
  BLOCKED: Ban,
  SCAN: Search,
};

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function SecurityTab({ currentUserId }: SecurityTabProps) {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [blocked, setBlocked] = useState<BlockedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL");
  const [manualBlockIp, setManualBlockIp] = useState("");
  const { toast } = useToast();

  const loadAll = useCallback(() => {
    Promise.all([
      fetch(`/api/admin/security/stats?userId=${currentUserId}`).then((r) => r.json()),
      fetch(`/api/admin/security/events?userId=${currentUserId}&limit=50&type=${filterType}`).then((r) => r.json()),
      fetch(`/api/admin/security/blocked?userId=${currentUserId}`).then((r) => r.json()),
    ])
      .then(([s, e, b]) => {
        setStats(s.stats || null);
        setEvents(e.events || []);
        setBlocked(b.blocked || []);
      })
      .finally(() => setLoading(false));
  }, [currentUserId, filterType]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const t = setInterval(loadAll, 15_000);
    return () => clearInterval(t);
  }, [loadAll]);

  async function unblockIp(ip: string) {
    const res = await fetch(`/api/admin/security/unblock/${encodeURIComponent(ip)}?userId=${currentUserId}`, {
      method: "POST",
    });
    if (res.ok) {
      toast({ title: "IP unblocked", description: ip });
      setBlocked((prev) => prev.filter((b) => b.ip !== ip));
    }
  }

  async function manualBlock() {
    const ip = manualBlockIp.trim();
    if (!ip) return;
    const res = await fetch(`/api/admin/security/block/${encodeURIComponent(ip)}?userId=${currentUserId}`, {
      method: "POST",
    });
    if (res.ok) {
      toast({ title: "IP blocked for 24h", description: ip, variant: "destructive" });
      setManualBlockIp("");
      loadAll();
    } else {
      const data = await res.json().catch(() => ({}));
      toast({ title: "Block failed", description: data.error || "Unknown error", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-2">
          <SecStatCard
            icon={<Activity className="w-4 h-4" />}
            label="Events (1h)"
            value={stats.events1h}
            sub={`${stats.events24h} in 24h`}
            color="#f59e0b"
          />
          <SecStatCard
            icon={<Ban className="w-4 h-4" />}
            label="Blocked IPs"
            value={stats.blockedIps}
            sub="active blocks"
            color="#f43f5e"
          />
          <SecStatCard
            icon={<FolderTree className="w-4 h-4" />}
            label="Honeypots (24h)"
            value={stats.honeypots24h}
            sub="scanner probes"
            color="#fb923c"
          />
          <SecStatCard
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Critical (24h)"
            value={stats.criticalEvents24h}
            sub="SQLi + cmd injection"
            color="#ef4444"
          />
          <SecStatCard
            icon={<Bug className="w-4 h-4" />}
            label="SQLi (24h)"
            value={stats.sqli24h}
            sub="injection attempts"
            color="#a78bfa"
          />
          <SecStatCard
            icon={<Code2 className="w-4 h-4" />}
            label="XSS (24h)"
            value={stats.xss24h}
            sub="script injections"
            color="#34d399"
          />
        </div>
      )}

      {/* Active blocks + manual block input */}
      <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-bold">Active IP blocks ({blocked.length})</h3>
        </div>

        {/* Manual block input */}
        <div className="flex gap-2 mb-3">
          <Input
            value={manualBlockIp}
            onChange={(e) => setManualBlockIp(e.target.value)}
            placeholder="Manually block an IP (e.g. 1.2.3.4)"
            onKeyDown={(e) => {
              if (e.key === "Enter") manualBlock();
            }}
            className="bg-white/5 border-white/15 text-white placeholder:text-white/35 text-xs h-8 focus-visible:ring-rose-400/50"
          />
          <Button
            size="sm"
            onClick={manualBlock}
            disabled={!manualBlockIp.trim()}
            className="bg-rose-500 hover:bg-rose-600 text-white h-8 text-xs"
          >
            <Ban className="w-3 h-3 mr-1" />
            Block
          </Button>
        </div>

        {blocked.length === 0 ? (
          <p className="text-xs text-white/45 text-center py-3">
            No active blocks. IPs that hit 3+ honeypots in 10min are auto-blocked for 1h.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {blocked.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2 rounded-lg bg-rose-500/[0.07] border border-rose-500/20 px-2.5 py-1.5"
              >
                <span className="font-mono text-xs text-rose-300 flex-1 truncate">
                  {b.ip}
                </span>
                <span className="text-[10px] text-white/55 truncate max-w-[50%]">
                  {b.reason}
                </span>
                <span className="text-[10px] text-white/40 shrink-0">
                  {formatTimeAgo(b.createdAt)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => unblockIp(b.ip)}
                  className="h-6 px-2 text-[10px] text-white/60 hover:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Unlock className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {["ALL", "HONEYPOT", "SQL_INJECTION", "XSS", "PATH_TRAVERSAL", "BLOCKED", "RATE_LIMIT"].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors",
              filterType === t
                ? "bg-amber-400 text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Live events feed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-400" />
            Live events
          </h3>
          <span className="text-[10px] text-white/45">auto-refreshes every 15s</span>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-8 rounded-xl bg-white/[0.02] border border-white/10">
            <Shield className="w-8 h-8 text-emerald-400/50 mx-auto mb-2" />
            <p className="text-sm text-white/55">No security events yet.</p>
            <p className="text-[11px] text-white/40 mt-1">
              The platform is quiet. Honeypots and attack detectors are active.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {events.map((e) => {
              const Icon = TYPE_ICONS[e.type] || Activity;
              return (
                <div
                  key={e.id}
                  className="rounded-lg bg-white/[0.03] border border-white/10 p-2.5"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[11px] font-mono text-white/80 truncate flex-1 min-w-0">
                      {e.path}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("text-[9px] py-0 px-1.5", SEVERITY_COLORS[e.severity])}
                    >
                      {e.severity}
                    </Badge>
                    {e.blocked && (
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-rose-500 text-rose-400">
                        <Ban className="w-2 h-2 mr-0.5" />
                        BLOCKED
                      </Badge>
                    )}
                    <span className="text-[9px] text-white/40 shrink-0">
                      {formatTimeAgo(e.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-white/50">
                    <span className="font-mono">{e.ip}</span>
                    <span>·</span>
                    <span className="font-mono">{e.method}</span>
                    <span>·</span>
                    <span className="truncate">{e.type.replace("_", " ")}</span>
                  </div>
                  {e.userAgent && (
                    <div className="text-[9px] text-white/35 mt-0.5 truncate font-mono">
                      UA: {e.userAgent.slice(0, 100)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20 p-3">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-white/70 leading-relaxed">
            <strong className="text-emerald-400">Active protections:</strong>{" "}
            honeypot endpoints (40+ paths), SQL injection detection, XSS detection,
            path traversal detection, command injection detection, rate limiting,
            auto-blocking (3 honeypot hits → 1h block; critical attacks → instant block),
            and IP blocklist with manual override. All events are logged with IP,
            timestamp, user-agent, and request path for forensic analysis.
          </div>
        </div>
      </div>
    </div>
  );
}

function SecStatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
      <div
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold"
        style={{ color }}
      >
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold mt-1">{formatCount(value)}</div>
      <div className="text-[9px] text-white/45 mt-0.5">{sub}</div>
    </div>
  );
}
