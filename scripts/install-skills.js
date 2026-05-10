#!/usr/bin/env node
/**
 * GURU Skill Installer v1.0
 *
 * Self-extracting installer. Copies all bundled skills from inside the
 * guru skill folder out to the global skill directories.
 *
 * Like Neo downloading kung fu. One pill, everything inside.
 *
 * Usage:
 *   node guru/scripts/install-skills.js [--target ~/.claude/skills] [--target .agents/skills]
 *
 * If no --target flags, installs to BOTH directories.
 * Zero dependencies — Node 18+ only.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

// Bundled skills live inside the guru skill folder
const BUNDLED_DIR = path.join(__dirname, "..", "skills");

// Default targets: both directories
const args = process.argv.slice(2);
let targets = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--target" && args[i + 1]) {
    targets.push(path.resolve(args[i + 1]));
    i++;
  }
}

if (targets.length === 0) {
  targets = [
    path.join(os.homedir(), ".claude", "skills"),
    path.join(process.cwd(), ".agents", "skills"),
  ];
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getBundledSkills() {
  if (!fs.existsSync(BUNDLED_DIR)) return [];
  return fs.readdirSync(BUNDLED_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .filter(e => fs.existsSync(path.join(BUNDLED_DIR, e.name, "SKILL.md")))
    .map(e => e.name);
}

function installSkill(name, targetDir) {
  const src = path.join(BUNDLED_DIR, name);
  const dst = path.join(targetDir, name);

  if (fs.existsSync(dst)) {
    // Already exists — check if ours is newer
    const srcStat = fs.statSync(path.join(src, "SKILL.md"));
    const dstStat = fs.statSync(path.join(dst, "SKILL.md"));
    if (srcStat.mtime <= dstStat.mtime) {
      return { name, status: "up-to-date" };
    }
    // Overwrite with newer version
    fs.rmSync(dst, { recursive: true, force: true });
    fs.cpSync(src, dst, { recursive: true });
    return { name, status: "updated" };
  }

  fs.cpSync(src, dst, { recursive: true });
  return { name, status: "installed" };
}

console.log("💊 GURU Skill Installer v1.0\n");
console.log(`  Bundled skills: ${BUNDLED_DIR}`);

const bundled = getBundledSkills();
console.log(`  Available:       ${bundled.length} skills\n`);

if (bundled.length === 0) {
  console.log("❌ No bundled skills found. Is guru/skills/ populated?\n");
  process.exit(1);
}

let totalInstalled = 0;
let totalUpdated = 0;
let totalSkipped = 0;

for (const targetDir of targets) {
  ensureDir(targetDir);
  console.log(`📁 Installing to: ${targetDir}`);

  let installed = 0, updated = 0, skipped = 0;
  for (const skillName of bundled) {
    const result = installSkill(skillName, targetDir);
    if (result.status === "installed") installed++;
    else if (result.status === "updated") updated++;
    else skipped++;
  }

  console.log(`   ✅ ${installed} installed, 🔄 ${updated} updated, ⏭️ ${skipped} up-to-date\n`);
  totalInstalled += installed;
  totalUpdated += updated;
  totalSkipped += skipped;
}

console.log(`💊 ${totalInstalled} new skills installed, ${totalUpdated} updated, ${totalSkipped} already current.`);
console.log(`\n💡 Say "GURU update yourself" to rebuild the capability map.`);
