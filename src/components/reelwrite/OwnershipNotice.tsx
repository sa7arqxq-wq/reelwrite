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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Shield, Copyright, BadgeCheck, Lock, AlertTriangle, Mail } from "lucide-react";

interface OwnershipNoticeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OwnershipNotice({ open, onOpenChange }: OwnershipNoticeProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-5 h-5 text-amber-400" />
            Ownership &amp; Protection
          </DialogTitle>
          <DialogDescription className="text-white/60">
            ReelWrite is proprietary software. Here&apos;s what that means.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* Copyright */}
          <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Copyright className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm">Copyright © 2026 ReelWrite</h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              All source code, design, and content in this app are the
              proprietary work of ReelWrite. No part of this software may be
              copied, reproduced, or used to create derivative works without
              written permission.
            </p>
          </div>

          {/* Trademark */}
          <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <BadgeCheck className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm">Trademarks</h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              &ldquo;ReelWrite&rdquo; and the pen-nib logo are trademarks of
              ReelWrite. The 7-second kinetic reel format, mood-gradient system,
              and overall look-and-feel are protected trade dress.
            </p>
          </div>

          {/* Security */}
          <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Lock className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm">Security protections active</h3>
            </div>
            <ul className="text-xs text-white/70 leading-relaxed space-y-1">
              <li>• Content Security Policy (CSP) — blocks injected scripts</li>
              <li>• Rate limiting — 20 writes/min, 60 reads/min per IP</li>
              <li>• Input validation + sanitization on all endpoints</li>
              <li>• X-Frame-Options — prevents clickjacking</li>
              <li>• HSTS — forces HTTPS</li>
              <li>• Source maps disabled in production builds</li>
              <li>• Banned users cannot post or like</li>
            </ul>
          </div>

          {/* Warning */}
          <div className="rounded-xl bg-amber-500/[0.07] border border-amber-500/30 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-amber-400">
                Unauthorized use is prohibited
              </h3>
            </div>
            <p className="text-xs text-white/75 leading-relaxed">
              Copying, redistributing, or hosting this software without
              permission, or replicating its design and product concept for a
              competing service, may constitute copyright infringement, trade
              dress infringement, and/or trademark violation. Violators will be
              prosecuted to the full extent of the law.
            </p>
          </div>

          {/* Contact */}
          <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Mail className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm">DMCA &amp; licensing</h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              For copyright inquiries, takedown requests, or licensing:
              <br />
              <a
                href="mailto:legal@reelwrite.app"
                className="text-amber-400 hover:text-amber-300 font-mono"
              >
                legal@reelwrite.app
              </a>
            </p>
          </div>

          <p className="text-[10px] text-white/40 text-center pt-2">
            This notice is provided for informational purposes and does not
            constitute legal advice.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
