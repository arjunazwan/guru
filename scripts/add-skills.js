#!/usr/bin/env node
/**
 * GURU Add Skills v1.0
 *
 * Ingests a skill repo into the guru/skills/ bundle.
 * Clones the repo, finds all skill folders (folders with SKILL.md),
 * copies them into guru/skills/, updates skills-registry.json.
 *
 * Usage:
 *   node guru/scripts/add-skills.js --repo https://github.com/user/repo
 *   node guru/scripts/add-skills.js --repo https://github.com/user/repo --name "My Skills"
 *   node guru/scripts/add-skills.js --repo https://github.com/user/repo --source-id my-skills
 *
 * Options:
 *   --repo <url>        GitHub repo URL (required)
 *   --name <name>       Human-readable name for the registry
 *   --source-id <id>    Registry ID (default: derived from repo name)
 *   --dry-run           Show what would be added without actually adding
 *
 * Zero dependencies — Node 18+ only (uses git for clone).
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const os = require("os");

const args = process.argv.slice(2);
function getFlag(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}
function hasFlag(flag) { return args.includes(flag); }

const REPO_URL = getFlag("--repo");
const CUSTOM_NAME = getFlag("--name");
const CUSTOM_ID = getFlag("--source-id");
const DRY_RUN = hasFlag("--dry-run");

if (!REPO_URL) {
  console.log("Usage: node guru/scripts/add-skills.js --repo <github-url> [--name \"Name\"] [--dry-run]");
  process.exit(1);
}

const GURU_DIR = path.join(__dirname, "..");
const BUNDLED_DIR = path.join(GURU_DIR, "skills");
const REGISTRY_FILE = path.join(GURU_DIR, "skills-registry.json");
const TMP_DIR = path.join(os.tmpdir(), `guru-add-${Date.now()}`);

function deriveId(url) {
  const match = url.match(/github\.com\/[\w.-]+\/([\w.-]+?)(?:\.git)?$/);
  return match ? match[1].toLowerCase().replace(/[^a-z0-9-]/g, "-") : `source-${Date.now()}`;
}

function deriveName(url) {
  const match = url.match(/github\.com\/[\w.-]+\/([\w.-]+?)(?:\.git)?$/);
  if (!match) return "Unknown Source";
  return match[1]
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function findSkillFolders(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .filter(e => {
      // Check if this folder itself has SKILL.md
      if (fs.existsSync(path.join(dir, e.name, "SKILL.md"))) return true;
      // Check one level deeper (e.g., document-skills/docx/)
      const inner = path.join(dir, e.name);
      if (!fs.statSync(inner).isDirectory()) return false;
      const subdirs = fs.readdirSync(inner, { withFileTypes: true })
        .filter(s => s.isDirectory())
        .filter(s => fs.existsSync(path.join(inner, s.name, "SKILL.md")));
      return subdirs.length > 0;
    })
    .flatMap(e => {
      const fullPath = path.join(dir, e.name);
      // If this is a parent folder with sub-skills
      if (!fs.existsSync(path.join(fullPath, "SKILL.md"))) {
        return fs.readdirSync(fullPath, { withFileTypes: true })
          .filter(s => s.isDirectory())
          .filter(s => fs.existsSync(path.join(fullPath, s.name, "SKILL.md")))
          .map(s => ({
            name: s.name,
            sourcePath: path.join(fullPath, s.name),
            parent: e.name
          }));
      }
      return [{
        name: e.name,
        sourcePath: fullPath,
        parent: null
      }];
    });
}

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_FILE)) {
    return { version: "1.0", sources: [] };
  }
  return JSON.parse(fs.readFileSync(REGISTRY_FILE, "utf8"));
}

function saveRegistry(reg) {
  reg.last_updated = new Date().toISOString().split("T")[0];
  reg.total_bundled_skills = fs.readdirSync(BUNDLED_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .filter(e => fs.existsSync(path.join(BUNDLED_DIR, e.name, "SKILL.md")))
    .length;
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(reg, null, 2) + "\n");
}

console.log("📦 GURU Add Skills v1.0\n");

const sourceId = CUSTOM_ID || deriveId(REPO_URL);
const sourceName = CUSTOM_NAME || deriveName(REPO_URL);

// 1. Clone
console.log(`⬇️  Cloning: ${REPO_URL}`);
if (!DRY_RUN) {
  try {
    execSync(`git clone --depth 1 "${REPO_URL}" "${TMP_DIR}"`, {
      stdio: "pipe",
      timeout: 60000
    });
    console.log(`   ✅ Cloned to temp\n`);
  } catch (e) {
    console.log(`   ❌ Clone failed: ${e.message}`);
    process.exit(1);
  }
}

// 2. Find skills
console.log("🔍 Scanning for skill folders...");
const skills = DRY_RUN ? [] : findSkillFolders(TMP_DIR);
console.log(`   Found ${skills.length} skill folders\n`);

if (skills.length === 0) {
  console.log("❌ No skill folders (SKILL.md) found in this repo. Nothing to add.\n");
  if (!DRY_RUN) fs.rmSync(TMP_DIR, { recursive: true, force: true });
  process.exit(1);
}

// 3. Show what will be added
console.log("📋 Skills to add:");
const preview = skills.slice(0, 15);
for (const s of preview) {
  const tag = s.parent ? ` (from ${s.parent}/)` : "";
  console.log(`   + ${s.name}${tag}`);
}
if (skills.length > 15) console.log(`   ... and ${skills.length - 15} more`);

// 4. Check for conflicts
const existing = new Set(
  fs.existsSync(BUNDLED_DIR)
    ? fs.readdirSync(BUNDLED_DIR, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name)
    : []
);
const conflicts = skills.filter(s => existing.has(s.name));
const newSkills = skills.filter(s => !existing.has(s.name));

if (conflicts.length > 0) {
  console.log(`\n⚠️  ${conflicts.length} skills already exist — will be skipped:`);
  for (const s of conflicts.slice(0, 10)) console.log(`   ⏭️  ${s.name}`);
  if (conflicts.length > 10) console.log(`   ... and ${conflicts.length - 10} more`);
}

console.log(`\n📊 ${newSkills.length} new, ${conflicts.length} already exist`);
console.log(`   Source: ${sourceName}`);
console.log(`   Source ID: ${sourceId}`);

if (DRY_RUN) {
  console.log("\n🔍 --dry-run mode. No changes made.\n");
  process.exit(0);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 5. Copy new skills
console.log("\n📁 Installing...");
let installed = 0;
ensureDir(BUNDLED_DIR);
for (const s of newSkills) {
  const dst = path.join(BUNDLED_DIR, s.name);
  fs.cpSync(s.sourcePath, dst, { recursive: true });
  installed++;
}
console.log(`   ✅ ${installed} skills added to guru/skills/`);

// 6. Update registry
console.log("\n📝 Updating registry...");
const reg = loadRegistry();
const existingSource = reg.sources.find(s => s.id === sourceId);
if (existingSource) {
  existingSource.last_synced = new Date().toISOString().split("T")[0];
  existingSource.skill_count += installed;
  console.log(`   Updated existing source: ${sourceId}`);
} else {
  reg.sources.push({
    id: sourceId,
    name: sourceName,
    repo: REPO_URL,
    skill_count: installed,
    last_synced: new Date().toISOString().split("T")[0],
    categories: []
  });
  console.log(`   Added new source: ${sourceId}`);
}
saveRegistry(reg);
console.log(`   Registry saved.`);

// 7. Cleanup
fs.rmSync(TMP_DIR, { recursive: true, force: true });

// 8. Summary
console.log(`\n✅ Done. ${installed} new skills bundled into guru/skills/.`);
console.log(`📦 Total bundled: ${reg.total_bundled_skills} skills from ${reg.sources.length} sources.`);
console.log(`\n💡 Next steps:`);
console.log(`   1. Run: node guru/scripts/install-skills.js  (extract to global dirs)`);
console.log(`   2. Say: "GURU update yourself"               (rebuild capability map)`);
