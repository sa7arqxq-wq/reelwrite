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

import { Home, Compass, Plus, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export type BottomNavView = "feed" | "discover" | "upload" | "profile" | "admin";

interface BottomNavProps {
  active: BottomNavView;
  onChange: (view: BottomNavView) => void;
  isAdmin?: boolean;
}

export function BottomNav({ active, onChange, isAdmin }: BottomNavProps) {
  const items: { id: BottomNavView; label: string; icon: typeof Home }[] = [
    { id: "feed", label: "Feed", icon: Home },
    { id: "discover", label: "Discover", icon: Compass },
    { id: "upload", label: "Create", icon: Plus },
    { id: "profile", label: "Profile", icon: User },
    ...(isAdmin
      ? [{ id: "admin" as BottomNavView, label: "Admin", icon: Shield }]
      : []),
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/85 backdrop-blur-lg">
      <div className="flex items-stretch justify-around px-1.5 pt-2 pb-3 safe-area-bottom">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          const isUpload = item.id === "upload";
          const isAdmin = item.id === "admin";
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="flex flex-1 flex-col items-center gap-0.5 py-1 min-w-0"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {isUpload ? (
                <span
                  className={cn(
                    "flex h-7 w-11 items-center justify-center rounded-lg transition-colors",
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
                    "h-5 w-5 transition-colors",
                    isActive
                      ? isAdmin
                        ? "text-rose-400"
                        : "text-amber-400"
                      : isAdmin
                        ? "text-rose-400/60"
                        : "text-white/55"
                  )}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
              )}
              <span
                className={cn(
                  "text-[9px] font-medium transition-colors truncate",
                  isActive
                    ? isAdmin
                      ? "text-rose-400"
                      : "text-amber-400"
                    : isAdmin
                      ? "text-rose-400/60"
                      : "text-white/55"
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
