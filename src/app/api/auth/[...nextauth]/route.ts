/*
 * ReelWrite — 7-second reels for writers
 * Copyright (c) 2026 ReelWrite. All rights reserved.
 *
 * PROPRIETARY AND CONFIDENTIAL
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
