import { db } from "@/lib/db";

export const FREE_TIER_REEL_LIMIT = 3;
export const PRO_PRICE = 5; // $5/month

export interface SubscriptionInfo {
  tier: "FREE" | "PRO";
  isPro: boolean;
  reelsThisMonth: number;
  reelsRemaining: number; // -1 = unlimited (PRO)
  reelsLimit: number; // -1 = unlimited (PRO)
  subscriptionExpires: Date | null;
}

export async function getSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return {
      tier: "FREE",
      isPro: false,
      reelsThisMonth: 0,
      reelsRemaining: FREE_TIER_REEL_LIMIT,
      reelsLimit: FREE_TIER_REEL_LIMIT,
      subscriptionExpires: null,
    };
  }

  const isPro = user.subscriptionTier === "PRO" &&
    (!user.subscriptionExpires || user.subscriptionExpires > new Date());

  // Check if monthly reset is needed
  const now = new Date();
  let reelsThisMonth = user.reelsThisMonth;
  if (user.reelsMonthReset && user.reelsMonthReset < now) {
    // Reset monthly counter
    reelsThisMonth = 0;
    await db.user.update({
      where: { id: userId },
      data: {
        reelsThisMonth: 0,
        reelsMonthReset: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      },
    });
  }

  return {
    tier: isPro ? "PRO" : "FREE",
    isPro,
    reelsThisMonth,
    reelsRemaining: isPro ? -1 : Math.max(0, FREE_TIER_REEL_LIMIT - reelsThisMonth),
    reelsLimit: isPro ? -1 : FREE_TIER_REEL_LIMIT,
    subscriptionExpires: user.subscriptionExpires,
  };
}

export async function canCreateReel(userId: string): Promise<{ allowed: boolean; reason?: string; info: SubscriptionInfo }> {
  const info = await getSubscriptionInfo(userId);
  if (info.isPro) {
    return { allowed: true, info };
  }
  if (info.reelsRemaining > 0) {
    return { allowed: true, info };
  }
  return {
    allowed: false,
    reason: `You've used all ${FREE_TIER_REEL_LIMIT} free reels this month. Upgrade to Pro for unlimited reels.`,
    info,
  };
}

export async function incrementReelCount(userId: string): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const now = new Date();
  // Set monthly reset date if not set
  if (!user.reelsMonthReset) {
    await db.user.update({
      where: { id: userId },
      data: {
        reelsThisMonth: 1,
        reelsMonthReset: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      },
    });
  } else {
    await db.user.update({
      where: { id: userId },
      data: { reelsThisMonth: { increment: 1 } },
    });
  }
}

export function isFeatureAvailable(feature: string, isPro: boolean): boolean {
  const proFeatures = [
    "cover_background",
    "image_background",
    "video_background",
    "ai_rewrite",
    "social_share_all",
    "qr_card",
    "saved_library",
    "dms",
    "privacy",
  ];
  if (proFeatures.includes(feature)) {
    return isPro;
  }
  return true; // Free features always available
}
