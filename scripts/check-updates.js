#!/usr/bin/env node
/**
 * GURU Check Updates v1.0
 *
 * Compares each source repo's latest commit against the registry's last_synced.
 * Reports which sources have upstream updates available.
 *
 * Usage:
 *   node guru/scripts/check-updates.js                         (check all sources)
 *   node guru/scripts/check-updates.js --source marketingskills (check one)
 *   node guru/scripts/check-updates.js --update                (pull updates for stale sources)
 *   node guru/scripts/check-updates.js --update --source <id>  (pull one source)
 *
 * Zero dependencies — Node 18+ only (uses git for remote checks).
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

const GURU_DIR = path.join(__dirname, "..");
const BUNDLED_DIR = path.join(GURU_DIR, "skills");
const REGISTRY_FILE = path.join(GURU_DIR, "skills-registry.json");

const TARGET_SOURCE = getFlag("--source");
const DO_UPDATE = hasFlag("--update");

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_FILE)) {
    console.log("❌ No registry found. Run add-skills.js first.\n");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(REGISTRY_FILE, "utf8"));
}

function getLatestCommit(repoUrl) {
  // Use git ls-remote to get the HEAD commit hash + date without cloning
  try {
    const output = execSync(`git ls-remote --symref "${repoUrl}" HEAD`, {
      stdio: "pipe",
      timeout: 30000
    }).toString().trim();

    const hashMatch = output.match(/^([a-f0-9]+)\tHEAD/);
    if (!hashMatch) return null;
    const hash = hashMatch[1];

    // Get commit date via GitHub API (no auth needed for public repos)
    const apiUrl = repoUrl
      .replace("https://github.com/", "https://api.github.com/repos/")
      .replace(/\.git$/, "");
    const commitUrl = `${apiUrl}/commits/${hash}`;

    try {
      const apiOutput = execSync(`curl -s -H "Accept: application/vnd.github.v3+json" "${commitUrl}"`, {
        stdio: "pipe",
        timeout: 15000
      }).toString();

      const commit = JSON.parse(apiOutput);
      const date = commit?.commit?.committer?.date;
      if (date) {
        return {
          hash: hash.slice(0, 7),
          date: date.split("T")[0],
          message: commit?.commit?.message?.split("\n")[0]?.slice(0, 80) || ""
        };
      }
    } catch {
      // GitHub API might rate-limit. Fall back to hash-only.
      return { hash: hash.slice(0, 7), date: null, message: "" };
    }

    return null;
  } catch (e) {
    return null;
  }
}

function updateSource(source) {
  const tmpDir = path.join(os.tmpdir(), `guru-update-${source.id}-${Date.now()}`);
  console.log(`\n⬇️  Cloning latest: ${source.repo}`);

  try {
    execSync(`git clone --depth 1 "${source.repo}" "${tmpDir}"`, {
      stdio: "pipe",
      timeout: 60000
    });
  } catch (e) {
    console.log(`   ❌ Clone failed: ${e.message}`);
    return 0;
  }

  // Find skills
  const findSkills = (dir) => {
    if (!fs.existsSync(dir)) return [];
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const full = path.join(dir, e.name);
      if (fs.existsSync(path.join(full, "SKILL.md"))) {
        results.push({ name: e.name, path: full });
      } else {
        // Check one level deeper for parent folders like document-skills/
        const subs = fs.readdirSync(full, { withFileTypes: true })
          .filter(s => s.isDirectory())
          .filter(s => fs.existsSync(path.join(full, s.name, "SKILL.md")))
          .map(s => ({ name: s.name, path: path.join(full, s.name) }));
        results.push(...subs);
      }
    }
    return results;
  };

  const skills = findSkills(tmpDir);
  let added = 0, updated = 0;

  for (const s of skills) {
    const dst = path.join(BUNDLED_DIR, s.name);
    if (fs.existsSync(dst)) {
      // Update: replace existing
      fs.rmSync(dst, { recursive: true, force: true });
      fs.cpSync(s.path, dst, { recursive: true });
      updated++;
    } else {
      fs.cpSync(s.path, dst, { recursive: true });
      added++;
    }
  }

  // Update registry
  source.last_synced = new Date().toISOString().split("T")[0];
  source.skill_count = skills.length;
  const reg = loadRegistry();
  const idx = reg.sources.findIndex(s => s.id === source.id);
  if (idx >= 0) reg.sources[idx] = source;
  reg.last_updated = new Date().toISOString().split("T")[0];
  reg.total_bundled_skills = fs.readdirSync(BUNDLED_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .filter(e => fs.existsSync(path.join(BUNDLED_DIR, e.name, "SKILL.md")))
    .length;
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(reg, null, 2) + "\n");

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });

  return { added, updated };
}

console.log("🔍 GURU Check Updates v1.0\n");

const reg = loadRegistry();
const sources = TARGET_SOURCE
  ? reg.sources.filter(s => s.id === TARGET_SOURCE)
  : reg.sources;

if (sources.length === 0) {
  console.log(TARGET_SOURCE
    ? `❌ Source "${TARGET_SOURCE}" not found in registry.\n`
    : "📋 No sources registered.\n");
  process.exit(0);
}

if (TARGET_SOURCE) {
  console.log(`  Checking: ${TARGET_SOURCE}`);
} else {
  console.log(`  Checking ${sources.length} source${sources.length > 1 ? "s" : ""}...`);
}

let staleCount = 0;
const staleSources = [];

for (const source of sources) {
  console.log(`\n── ${source.name} ──`);
  console.log(`  Repo:      ${source.repo}`);
  console.log(`  Skills:    ${source.skill_count}`);
  console.log(`  Synced:    ${source.last_synced}`);

  const latest = getLatestCommit(source.repo);
  if (!latest) {
    console.log(`  Status:    ⚠️  Could not check (network or rate-limit?)`);
    continue;
  }

  console.log(`  Upstream:  ${latest.date || "unknown"} (${latest.hash})`);
  if (latest.message) console.log(`  Latest:    "${latest.message}"`);

  if (latest.date && latest.date > source.last_synced) {
    staleCount++;
    staleSources.push(source);
    console.log(`  Status:    🔔 UPDATE AVAILABLE — upstream is newer`);
  } else {
    console.log(`  Status:    ✅ Up to date`);
  }
}

console.log(`\n${"─".repeat(50)}`);

if (staleCount === 0) {
  console.log(`\n✅ All ${sources.length} source${sources.length > 1 ? "s are" : " is"} up to date.\n`);
} else {
  console.log(`\n🔔 ${staleCount} source${staleCount > 1 ? "s have" : " has"} updates available.`);
  for (const s of staleSources) {
    console.log(`   ${s.name} — ${s.repo}`);
  }

  if (DO_UPDATE) {
    console.log(`\n⬇️  Pulling updates...`);
    let totalAdded = 0, totalUpdated = 0;
    for (const s of staleSources) {
      const result = updateSource(s);
      if (typeof result === "object") {
        totalAdded += result.added;
        totalUpdated += result.updated;
      }
    }
    console.log(`\n✅ Updates applied: ${totalAdded} new, ${totalUpdated} updated.`);
    console.log(`💡 Run: node guru/scripts/install-skills.js && node guru/scripts/generate-map.js`);
  } else {
    console.log(`\n💡 To update: node guru/scripts/check-updates.js --update`);
  }
}

// Show registry summary
console.log(`\n📦 Registry: ${reg.sources.length} sources, ${reg.total_bundled_skills} total bundled skills.\n`);
