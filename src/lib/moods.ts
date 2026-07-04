// Mood -> gradient mapping for reel backgrounds
// Each mood is a 2-color gradient + a complementary accent for text.

export type Mood = "amber" | "rose" | "emerald" | "violet" | "slate" | "ocean";

export const MOODS: Record<
  Mood,
  { from: string; to: string; accent: string; label: string; emoji: string }
> = {
  amber: {
    from: "#1c1408",
    to: "#3d2810",
    accent: "#fbbf24",
    label: "Amber",
    emoji: "🕯️",
  },
  rose: {
    from: "#1f0814",
    to: "#451027",
    accent: "#fb7185",
    label: "Rose",
    emoji: "🌹",
  },
  emerald: {
    from: "#06140d",
    to: "#0f2e1f",
    accent: "#34d399",
    label: "Emerald",
    emoji: "🌿",
  },
  violet: {
    from: "#14082a",
    to: "#2d1565",
    accent: "#a78bfa",
    label: "Violet",
    emoji: "🔮",
  },
  slate: {
    from: "#0a0e14",
    to: "#1f2937",
    accent: "#cbd5e1",
    label: "Slate",
    emoji: "🗿",
  },
  ocean: {
    from: "#06141f",
    to: "#0e2a44",
    accent: "#38bdf8",
    label: "Ocean",
    emoji: "🌊",
  },
};

export const MOOD_LIST: Mood[] = ["amber", "rose", "emerald", "violet", "slate", "ocean"];

export function getMood(mood: string): Mood {
  return (MOODS as Record<string, unknown>)[mood] ? (mood as Mood) : "amber";
}
