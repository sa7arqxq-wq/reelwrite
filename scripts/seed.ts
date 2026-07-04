// Seed script — populates ReelWrite with demo writers, books, and 7-second reels.
// Run with: bun run scripts/seed.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const writers = [
  {
    username: "marina.eclipse",
    displayName: "Marina Eclipse",
    bio: "Speculative fiction author. The night is just a page turning.",
    avatarColor: "#7c3aed",
    avatarEmoji: "🌙",
  },
  {
    username: "theodore.ink",
    displayName: "Theodore Ink",
    bio: "Slow-burn romance, faster-burn coffee. ☕",
    avatarColor: "#f43f5e",
    avatarEmoji: "🖋️",
  },
  {
    username: "sasha.quill",
    displayName: "Sasha Quill",
    bio: "Memoirist. I write the things I'm afraid to say out loud.",
    avatarColor: "#0ea5e9",
    avatarEmoji: "🌊",
  },
  {
    username: "fenwick.jones",
    displayName: "Fenwick Jones",
    bio: "Hardboiled mysteries, soft-boiled detectives.",
    avatarColor: "#10b981",
    avatarEmoji: "🔍",
  },
  {
    username: "opal.verdant",
    displayName: "Opal Verdant",
    bio: "Cozy fantasy, cottagecore chaos, tea-stained pages.",
    avatarColor: "#f59e0b",
    avatarEmoji: "🍄",
  },
  {
    username: "kael.merchant",
    displayName: "Kael Merchant",
    bio: "Epic fantasy. 12-book arcs. Yes, I sleep.",
    avatarColor: "#1e293b",
    avatarEmoji: "⚔️",
  },
];

const books = [
  { author: "marina.eclipse", title: "The Last Lighthouse", subtitle: "A Novel", coverColor: "#1e1b4b", coverAccent: "#fbbf24", coverEmoji: "🌑", description: "When the stars go dark, one keeper must light the way home.", genre: "Speculative", buyLink: "https://example.com/last-lighthouse", pages: 384 },
  { author: "marina.eclipse", title: "Saltwater Hymns", subtitle: "Poems", coverColor: "#0c4a6e", coverAccent: "#7dd3fc", coverEmoji: "🐚", description: "Tides, grief, and the language of the sea.", genre: "Poetry", buyLink: "https://example.com/saltwater", pages: 142 },
  { author: "theodore.ink", title: "Letters We Never Sent", subtitle: "A Romance", coverColor: "#7f1d1d", coverAccent: "#fecaca", coverEmoji: "💌", description: "Two strangers. One post office. Twelve unsent letters.", genre: "Romance", buyLink: "https://example.com/letters", pages: 312 },
  { author: "theodore.ink", title: "Coffee at Midnight", subtitle: "A Novella", coverColor: "#451a03", coverAccent: "#fcd34d", coverEmoji: "☕", description: "A barista. A night-shift nurse. A city that never sleeps.", genre: "Romance", buyLink: "https://example.com/coffee", pages: 168 },
  { author: "sasha.quill", title: "Bones Like Glass", subtitle: "A Memoir", coverColor: "#334155", coverAccent: "#e2e8f0", coverEmoji: "🦴", description: "On illness, inheritance, and learning to hold on.", genre: "Memoir", buyLink: "https://example.com/bones", pages: 256 },
  { author: "fenwick.jones", title: "The Marlowe File", subtitle: "A Mystery", coverColor: "#0f172a", coverAccent: "#ef4444", coverEmoji: "🔎", description: "Every detective has one case that won't stay buried.", genre: "Mystery", buyLink: "https://example.com/marlowe", pages: 432 },
  { author: "fenwick.jones", title: "Dead Letter Office", subtitle: "A Mystery", coverColor: "#1c1917", coverAccent: "#f59e0b", coverEmoji: "📮", description: "Some letters arrive sixty years too late.", genre: "Mystery", buyLink: "https://example.com/dead-letter", pages: 288 },
  { author: "opal.verdant", title: "The Mushroom Witch", subtitle: "A Cozy Fantasy", coverColor: "#14532d", coverAccent: "#fde68a", coverEmoji: "🍄", description: "She sells soup, spells, and absolutely no trouble. Mostly.", genre: "Fantasy", buyLink: "https://example.com/mushroom-witch", pages: 320 },
  { author: "opal.verdant", title: "Tea & Thunderstorms", subtitle: "Stories", coverColor: "#581c87", coverAccent: "#fcd34d", coverEmoji: "⛈️", description: "Twelve small stories for rainy afternoons.", genre: "Short Stories", buyLink: "https://example.com/tea-storms", pages: 196 },
  { author: "kael.merchant", title: "Emberfall", subtitle: "Book One of the Ash Cycle", coverColor: "#450a0a", coverAccent: "#fb923c", coverEmoji: "🔥", description: "An empire built on fire. A girl who learns to breathe it back.", genre: "Epic Fantasy", buyLink: "https://example.com/emberfall", pages: 612 },
];

const reels = [
  { author: "marina.eclipse", book: "The Last Lighthouse", hook: "She kept the light on for forty years — and on the forty-first, the dark kept it company.", caption: "Read the first chapter free. 🌑", mood: "violet", likes: 1284, comments: 92, shares: 188, saves: 411, views: 18420 },
  { author: "marina.eclipse", book: "Saltwater Hymns", hook: "Salt in my mouth, and the sea still asking my name.", caption: "Poetry for the tide-walkers. 🌊", mood: "ocean", likes: 822, comments: 41, shares: 76, saves: 233, views: 9840 },
  { author: "theodore.ink", book: "Letters We Never Sent", hook: "He mailed a letter to an address that no longer existed. Someone wrote back.", caption: "The romance everyone is whispering about. 💌", mood: "rose", likes: 3920, comments: 412, shares: 921, saves: 1832, views: 62400 },
  { author: "theodore.ink", book: "Coffee at Midnight", hook: "She ordered the same drink at 2 a.m. every night. He started learning her name.", caption: "A novella for night owls. ☕", mood: "amber", likes: 2103, comments: 188, shares: 244, saves: 612, views: 28100 },
  { author: "sasha.quill", book: "Bones Like Glass", hook: "My mother taught me to fold small. I have been unfolding ever since.", caption: "A memoir about inheritance, in every sense. 🦴", mood: "slate", likes: 1542, comments: 287, shares: 102, saves: 521, views: 21300 },
  { author: "fenwick.jones", book: "The Marlowe File", hook: "The case file had one name on it. Hers. And a date twenty years too late.", caption: "The mystery everyone's lost sleep over. 🔎", mood: "slate", likes: 982, comments: 64, shares: 88, saves: 244, views: 14200 },
  { author: "fenwick.jones", book: "Dead Letter Office", hook: "The letter arrived on a Tuesday. It was postmarked 1962.", caption: "Cold cases, warm ink. 📮", mood: "amber", likes: 1401, comments: 73, shares: 154, saves: 318, views: 19800 },
  { author: "opal.verdant", book: "The Mushroom Witch", hook: "She told the town she only sold soup. The town agreed not to ask about the third ingredient.", caption: "Cozy fantasy for the tired heart. 🍄", mood: "emerald", likes: 5230, comments: 612, shares: 1421, saves: 2402, views: 89300 },
  { author: "opal.verdant", book: "Tea & Thunderstorms", hook: "Every story in this book takes exactly one cup of tea to read. I timed them.", caption: "Twelve small stories. ⛈️", mood: "violet", likes: 1820, comments: 144, shares: 213, saves: 488, views: 23100 },
  { author: "kael.merchant", book: "Emberfall", hook: "They told her the empire was unbreakable. They had not met her yet.", caption: "Book One of the Ash Cycle. 🔥", mood: "rose", likes: 7420, comments: 1204, shares: 2810, saves: 5102, views: 142000 },
];

function breakHook(hook: string): string {
  // Split by punctuation into ~3-4 chunks for kinetic reveal
  const pieces = hook.split(/(?<=[.,—])\s+/);
  const lines: string[] = [];
  for (const p of pieces) {
    if (lines.length === 0) lines.push(p);
    else {
      const last = lines[lines.length - 1];
      if (last.length < 22) lines[lines.length - 1] = last + " " + p;
      else lines.push(p);
    }
  }
  return lines.join("\n");
}

async function main() {
  console.log("Clearing existing data...");
  await db.follow.deleteMany();
  await db.comment.deleteMany();
  await db.like.deleteMany();
  await db.reel.deleteMany();
  await db.book.deleteMany();
  await db.user.deleteMany();

  console.log("Seeding writers...");
  const userMap: Record<string, string> = {};
  for (const w of writers) {
    const u = await db.user.create({
      data: {
        ...w,
        followers: Math.floor(Math.random() * 40000) + 800,
        following: Math.floor(Math.random() * 200) + 12,
        reelsCount: 0,
      },
    });
    userMap[w.username] = u.id;
  }

  console.log("Seeding books...");
  const bookMap: Record<string, string> = {};
  for (const b of books) {
    const book = await db.book.create({
      data: {
        authorId: userMap[b.author],
        title: b.title,
        subtitle: b.subtitle,
        coverColor: b.coverColor,
        coverAccent: b.coverAccent,
        coverEmoji: b.coverEmoji,
        description: b.description,
        genre: b.genre,
        buyLink: b.buyLink,
        pages: b.pages,
      },
    });
    bookMap[b.title] = book.id;
  }

  console.log("Seeding reels...");
  for (const r of reels) {
    await db.reel.create({
      data: {
        authorId: userMap[r.author],
        bookId: bookMap[r.book],
        caption: r.caption,
        hook: r.hook,
        hookLines: breakHook(r.hook),
        mood: r.mood,
        duration: 7,
        likes: r.likes,
        comments: r.comments,
        shares: r.shares,
        saves: r.saves,
        views: r.views,
      },
    });
  }

  // Update reelsCount
  for (const username of Object.keys(userMap)) {
    const count = await db.reel.count({ where: { authorId: userMap[username] } });
    await db.user.update({ where: { id: userMap[username] }, data: { reelsCount: count } });
  }

  // Add a few demo comments
  const sampleComments = [
    { reelAuthor: "theodore.ink", text: "Just ordered. Crying already.", user: "marina.eclipse" },
    { reelAuthor: "opal.verdant", text: "The third ingredient HAD to be mushrooms.", user: "fenwick.jones" },
    { reelAuthor: "kael.merchant", text: "Pre-ordered the whole cycle. Take my money.", user: "sasha.quill" },
    { reelAuthor: "marina.eclipse", text: "That last line. Devastating.", user: "theodore.ink" },
    { reelAuthor: "sasha.quill", text: "Reading this felt like being seen.", user: "opal.verdant" },
    { reelAuthor: "fenwick.jones", text: "Did NOT see that twist coming.", user: "kael.merchant" },
  ];
  for (const sc of sampleComments) {
    const reel = await db.reel.findFirst({
      where: { author: { username: sc.reelAuthor } },
    });
    if (!reel) continue;
    await db.comment.create({
      data: {
        reelId: reel.id,
        userId: userMap[sc.user],
        text: sc.text,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
