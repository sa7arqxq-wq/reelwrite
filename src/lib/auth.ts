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

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// Generate a stable demo secret if NEXTAUTH_SECRET isn't set (dev only).
// In production, ALWAYS set NEXTAUTH_SECRET in your environment.
const secret =
  process.env.NEXTAUTH_SECRET ||
  "reelwrite-dev-secret-change-in-production-9f2a7c4e1b8d";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret,
  // Let NextAuth auto-detect the host from request headers.
  trustHost: true,
  // Custom cookie names — this invalidates ALL old cookies from
  // previous sign-in attempts that were causing REQUEST_HEADER_TOO_LARGE.
  // Using shorter cookie names also reduces header size.
  cookies: {
    sessionToken: {
      name: "rw-session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    callbackUrl: {
      name: "rw-callback",
      options: {
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    csrfToken: {
      name: "rw-csrf",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    pkceCodeVerifier: {
      name: "rw-pkce",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    state: {
      name: "rw-state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    nonce: {
      name: "rw-nonce",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
  providers: [
    // Google OAuth — requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // Credentials (email + password) — always available
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user || !user.passwordHash) return null;
        if (user.banned) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // Only return the id — keep the JWT small to avoid
        // REQUEST_HEADER_TOO_LARGE errors on Vercel.
        // The full user data is fetched in getSessionUser() via /api/me
        return {
          id: user.id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    // We handle sign-in via a modal in the SPA, so we don't need a custom page.
    // NextAuth's default redirect still works if needed.
  },
};

// Helper: get the current user's DB record from a session, or null
export async function getSessionUser(): Promise<{
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: string;
  banned: boolean;
  avatarColor: string;
  avatarEmoji: string;
  image: string | null;
  bio: string;
  followers: number;
  following: number;
  reelsCount: number;
} | null> {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.banned) return null;
  return user;
}
