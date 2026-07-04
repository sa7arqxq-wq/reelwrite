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

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type FeedTab = "for-you" | "following" | "trending";

interface TopBarProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

export function TopBar({ activeTab, onTabChange }: TopBarProps) {
  const tabs: { id: FeedTab; label: string }[] = [
    { id: "following", label: "Following" },
    { id: "for-you", label: "For You" },
    { id: "trending", label: "Trending" },
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pt-4 pb-2 bg-gradient-to-b from-black/70 to-transparent">
      <div className="flex flex-col items-center">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="text-xl">✒️</span>
          <span className="font-serif text-lg font-bold tracking-tight text-amber-400">
            ReelWrite
          </span>
        </div>
        <nav className="flex items-center gap-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative text-sm font-semibold transition-colors",
                activeTab === tab.id ? "text-white" : "text-white/55"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.span
                  layoutId="topbar-active"
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-amber-400"
                />
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
