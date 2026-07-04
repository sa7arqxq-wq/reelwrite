"use client";

import { Home, Compass, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type BottomNavView = "feed" | "discover" | "upload" | "profile";

interface BottomNavProps {
  active: BottomNavView;
  onChange: (view: BottomNavView) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const items: { id: BottomNavView; label: string; icon: typeof Home }[] = [
    { id: "feed", label: "Feed", icon: Home },
    { id: "discover", label: "Discover", icon: Compass },
    { id: "upload", label: "Create", icon: Plus },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/85 backdrop-blur-lg">
      <div className="flex items-stretch justify-around px-2 pt-2 pb-3 safe-area-bottom">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          const isUpload = item.id === "upload";
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="flex flex-1 flex-col items-center gap-0.5 py-1"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {isUpload ? (
                <span
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-lg transition-colors",
                    isActive
                      ? "bg-amber-400 text-black"
                      : "bg-amber-400/15 text-amber-400"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
                </span>
              ) : (
                <Icon
                  className={cn(
                    "h-6 w-6 transition-colors",
                    isActive ? "text-amber-400" : "text-white/55"
                  )}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
              )}
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-amber-400" : "text-white/55"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
