#!/usr/bin/env node
/**
 * GURU Bootstrap v3.1
 *
 * First-run setup: detects if skills are installed, offers to extract
 * bundled skills, creates .agents/ structure, generates map.
 *
 * Usage:
 *   node guru/scripts/bootstrap.js [--project-dir /path/to/project]
 *
 * Safe to run multiple times — idempotent.
 * Zero dependencies — Node 18+ only.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const args = process.argv.slice(2);
const projectDirFlag = args.indexOf("--project-dir");
const PROJECT_DIR = projectDirFlag >= 0
  ? path.resolve(args[projectDirFlag + 1])
  : process.cwd();

const AGENTS_DIR = path.join(PROJECT_DIR, ".agents");
const SKILLS_DIR = path.join(AGENTS_DIR, "skills");
const GAPS_LOG = path.join(AGENTS_DIR, "gaps-log.md");
const MAP_FILE = path.join(AGENTS_DIR, "capability-map.md");

const SCRIPT_DIR = __dirname;
const INSTALL_SCRIPT = path.join(SCRIPT_DIR, "install-skills.js");
const SYNC_SCRIPT = path.join(SCRIPT_DIR, "sync-skills.js");
const GENERATE_SCRIPT = path.join(SCRIPT_DIR, "generate-map.js");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return "created";
  }
  return "exists";
}

function countSkills(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .filter(e => fs.existsSync(path.join(dir, e.name, "SKILL.md")))
    .length;
}

function countBundledSkills() {
  const bundledDir = path.join(SCRIPT_DIR, "..", "skills");
  if (!fs.existsSync(bundledDir)) return 0;
  return fs.readdirSync(bundledDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .filter(e => fs.existsSync(path.join(bundledDir, e.name, "SKILL.md")))
    .length;
}

console.log("🚀 GURU Bootstrap v3.1\n");
console.log(`  Project: ${PROJECT_DIR}`);

// 1. Create directory structure
console.log("\n📁 Directory structure:");
console.log(`  .agents/          → ${ensureDir(AGENTS_DIR)}`);
console.log(`  .agents/skills/   → ${ensureDir(SKILLS_DIR)}`);

// 2. Seed gaps-log if missing
if (!fs.existsSync(GAPS_LOG)) {
  fs.writeFileSync(GAPS_LOG, `# GURU Gap Log

> Skills users have requested that don't exist yet.
> Each entry = an opportunity to grow capability.
> When a gap repeats 3+ times, prioritize building that skill.

---

## Format

| Date | Skill Suggested | User Request | Closest Skill | Built? |
|------|-----------------|--------------|---------------|--------|
|      |                 |              |               |        |

---

*No gaps logged yet.*
`);
  console.log(`  .agents/gaps-log.md → created`);
} else {
  console.log(`  .agents/gaps-log.md → exists`);
}

// 3. Check: do we have skills installed?
const installedCount = countSkills(SKILLS_DIR);
const bundledCount = countBundledSkills();

console.log(`\n📊 Skills status:`);
console.log(`  Installed:  ${installedCount} in .agents/skills/`);
console.log(`  Bundled:    ${bundledCount} inside guru/skills/`);

// 4. If no skills installed but bundled skills exist, offer extraction
if (installedCount <= 1 && bundledCount > 0) {
  console.log(`\n💊 ${bundledCount} skills bundled inside the guru skill — ready to extract.`);
  console.log(`   Running installer...\n`);

  try {
    execSync(`node "${INSTALL_SCRIPT}"`, {
      cwd: PROJECT_DIR,
      stdio: "inherit"
    });
    console.log(`\n✅ Skills extracted.`);
  } catch (e) {
    console.log(`\n⚠️  Installer had issues — continuing anyway.`);
  }
} else if (installedCount > 1 && bundledCount > 0) {
  console.log(`\n✅ ${installedCount} skills already installed.`);
  console.log(`   (${bundledCount} bundled available for fresh installs)`);
}

// 5. Run sync
console.log("\n🔄 Running sync...");
try {
  execSync(`node "${SYNC_SCRIPT}" --project-dir "${PROJECT_DIR}"`, {
    cwd: PROJECT_DIR,
    stdio: "inherit"
  });
} catch (e) {
  console.log("  ⚠️  Sync had issues — continuing anyway");
}

// 6. Run generator
console.log("\n🧠 Running capability map generator...");
try {
  execSync(`node "${GENERATE_SCRIPT}" --project-dir "${PROJECT_DIR}"`, {
    cwd: PROJECT_DIR,
    stdio: "inherit"
  });
} catch (e) {
  console.log("  ⚠️  Generator had issues — continuing anyway");
}

// 7. Verify
const skillsExist = fs.existsSync(SKILLS_DIR);
const mapExists = fs.existsSync(MAP_FILE);
const statusExists = fs.existsSync(path.join(AGENTS_DIR, "guru-status.md"));
const finalCount = countSkills(SKILLS_DIR);

console.log("\n✅ Bootstrap complete.\n");
console.log("📋 Verification:");
console.log(`  Skills directory:  ${skillsExist ? "✅" : "❌"}`);
console.log(`  Capability map:    ${mapExists ? "✅" : "❌"}`);
console.log(`  Status file:       ${statusExists ? "✅" : "❌"}`);

if (mapExists) {
  const map = fs.readFileSync(MAP_FILE, "utf8");
  const countMatch = map.match(/Skills: (\d+)/);
  const levelMatch = map.match(/# ([\u{1F300}-\u{1F9FF}] .+?) —/u);
  if (countMatch && levelMatch) {
    console.log(`\n  ${levelMatch[1]} — ${countMatch[1]} skills ready.`);
  }
}

const nextSteps = (finalCount <= 1 && bundledCount > 0)
  ? `\n⏭️  Next: Say "GURU" → GURU will detect the bundled skills and offer to install them.`
  : `\n💬 Say "GURU" anytime. GURU is operational.`;

console.log(nextSteps);
