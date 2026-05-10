#!/usr/bin/env node
/**
 * GURU Skill Sync v3.0
 *
 * Copies skills between .agents/skills/ and ~/.claude/skills/
 * so both directories have the full set.
 *
 * Usage:
 *   node guru/scripts/sync-skills.js [--project-dir /path/to/project]
 *
 * If --project-dir is omitted, uses cwd.
 * Zero dependencies — Node 18+ only.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const args = process.argv.slice(2);
const projectDirFlag = args.indexOf("--project-dir");
const PROJECT_DIR = projectDirFlag >= 0
  ? path.resolve(args[projectDirFlag + 1])
  : process.cwd();

const AGENTS_DIR = path.join(PROJECT_DIR, ".agents", "skills");
const CLAUDE_DIR = path.join(os.homedir(), ".claude", "skills");

function getSkills(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory() || e.isSymbolicLink())
    .filter(e => {
      const real = e.isSymbolicLink()
        ? path.resolve(dir, fs.readlinkSync(path.join(dir, e.name)))
        : path.join(dir, e.name);
      return fs.existsSync(path.join(real, "SKILL.md"));
    })
    .map(e => e.name);
}

function copySkill(name, fromDir, toDir) {
  const src = path.join(fromDir, name);
  const dst = path.join(toDir, name);

  // Resolve symlinks for the source
  let realSrc = src;
  if (fs.lstatSync(src).isSymbolicLink()) {
    realSrc = path.resolve(fromDir, fs.readlinkSync(src));
  }

  if (fs.existsSync(dst)) return { name, status: "skipped (exists)" };

  // If source is a symlink, create symlink in destination too
  if (fs.lstatSync(src).isSymbolicLink()) {
    fs.symlinkSync(realSrc, dst);
  } else {
    fs.cpSync(src, dst, { recursive: true });
  }
  return { name, status: "copied" };
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

console.log("🔄 GURU Skill Sync v3.0\n");

ensureDir(AGENTS_DIR);
ensureDir(CLAUDE_DIR);

const agentsSkills = getSkills(AGENTS_DIR);
const claudeSkills = getSkills(CLAUDE_DIR);

console.log(`  .agents/skills/    : ${agentsSkills.length} skills`);
console.log(`  ~/.claude/skills/  : ${claudeSkills.length} skills\n`);

const missingInClaude = agentsSkills.filter(s => !claudeSkills.includes(s));
const missingInAgents = claudeSkills.filter(s => !agentsSkills.includes(s));

if (missingInClaude.length === 0 && missingInAgents.length === 0) {
  console.log("✅ Both directories are already in sync.\n");
} else {
  if (missingInClaude.length > 0) {
    console.log(`📋 Missing from ~/.claude/skills/ (${missingInClaude.length}):`);
    for (const s of missingInClaude) {
      const r = copySkill(s, AGENTS_DIR, CLAUDE_DIR);
      console.log(`   ${r.status === "copied" ? "✅" : "⏭️"} ${r.name} — ${r.status}`);
    }
    console.log();
  }

  if (missingInAgents.length > 0) {
    console.log(`📋 Missing from .agents/skills/ (${missingInAgents.length}):`);
    for (const s of missingInAgents) {
      const r = copySkill(s, CLAUDE_DIR, AGENTS_DIR);
      console.log(`   ${r.status === "copied" ? "✅" : "⏭️"} ${r.name} — ${r.status}`);
    }
    console.log();
  }

  console.log("✅ Sync complete.\n");
}

console.log("💡 Run 'node guru/scripts/generate-map.js' or say 'GURU update yourself' to refresh the map.");
