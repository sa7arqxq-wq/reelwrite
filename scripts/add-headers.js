// Adds a copyright header to every source file in src/ and prisma/ that doesn't already have one.
// Run with: node scripts/add-headers.js
const fs = require("fs");
const path = require("path");

const HEADER = `/*
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
`;

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
const SKIP_DIRS = ["node_modules", ".next", ".git", "out", "build", "examples", "skills", "scripts"];

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.includes(entry.name)) continue;
      walk(fullPath, files);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (EXTENSIONS.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

const projectRoot = path.join(__dirname, "..");
const srcDir = path.join(projectRoot, "src");
const files = walk(srcDir);

let added = 0;
let skipped = 0;

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  // Skip if already has a copyright header
  if (content.includes("Copyright (c) 2026 ReelWrite")) {
    skipped++;
    continue;
  }
  // Skip CSS files
  if (file.endsWith(".css")) {
    skipped++;
    continue;
  }
  const newContent = HEADER + "\n" + content;
  fs.writeFileSync(file, newContent, "utf8");
  added++;
  console.log(`✓ ${path.relative(projectRoot, file)}`);
}

console.log(`\nDone. Added header to ${added} files, skipped ${skipped} files.`);
