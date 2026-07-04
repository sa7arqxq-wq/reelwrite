"use client";

import { useEffect } from "react";

/**
 * Lightweight client-side discouragement layer.
 *
 * NOTE: This is NOT real protection. Anyone determined can bypass it in seconds.
 * It exists only to discourage casual copying and to signal "this is proprietary."
 *
 * Real protection comes from:
 * - Server-side validation (in /api routes)
 * - Copyright registration (see IP_PROTECTION.md)
 * - Trademark registration
 * - License enforcement
 */
export function CopyProtection() {
  useEffect(() => {
    // 1. Discourage right-click context menu (skip on form inputs)
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      e.preventDefault();
    };

    // 2. Discourage common keyboard shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      // F12 = devtools
      if (key === "f12") {
        e.preventDefault();
        return;
      }
      // Ctrl/Cmd+Shift+I or J or C = devtools
      if (ctrl && shift && ["i", "j", "c"].includes(key)) {
        e.preventDefault();
        return;
      }
      // Ctrl/Cmd+U = view source
      if (ctrl && key === "u") {
        e.preventDefault();
        return;
      }
    };

    // 3. Discourage text selection on non-input elements (won't block copy from inputs)
    const onSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      // Allow selection in comments / dialog text for usability — only block bulk copy
      // by intercepting copy events below
    };

    // 4. Intercept copy events of large text blocks (more than 200 chars)
    const onCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection?.();
      const text = selection?.toString() || "";
      if (text.length > 200) {
        e.preventDefault();
        if (e.clipboardData) {
          e.clipboardData.setData(
            "text/plain",
            "© 2026 ReelWrite. All rights reserved. This content is proprietary — copying is prohibited."
          );
        }
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("selectstart", onSelectStart);
    document.addEventListener("copy", onCopy);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("selectstart", onSelectStart);
      document.removeEventListener("copy", onCopy);
    };
  }, []);

  return null;
}
