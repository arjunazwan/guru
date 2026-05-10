#!/usr/bin/env node
/**
 * GURU Capability Map Generator v3.0
 *
 * Project-root aware. Scans all skill locations, deduplicates,
 * builds a UNIFIED capability map so GURU knows what it can do.
 *
 * Usage:
 *   node guru/scripts/generate-map.js [--project-dir /path/to/project]
 *
 * If --project-dir is omitted, uses cwd.
 * Zero dependencies — Node 18+ only.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

// Resolve project root
const args = process.argv.slice(2);
const projectDirFlag = args.indexOf("--project-dir");
const PROJECT_DIR = projectDirFlag >= 0
  ? path.resolve(args[projectDirFlag + 1])
  : process.cwd();

const AGENTS_DIR = path.join(PROJECT_DIR, ".agents");
const SKILLS_DIR = path.join(AGENTS_DIR, "skills");
const GLOBAL_SKILLS = path.join(os.homedir(), ".claude", "skills");
const OUTPUT = path.join(AGENTS_DIR, "capability-map.md");
const STATUS_FILE = path.join(AGENTS_DIR, "guru-status.md");
const GAPS_LOG = path.join(AGENTS_DIR, "gaps-log.md");

const LEVELS = [
  { min: 0,   title: "Apprentice GURU",   emoji: "🌱" },
  { min: 10,  title: "Junior GURU",       emoji: "🌿" },
  { min: 25,  title: "GURU",              emoji: "🧠" },
  { min: 50,  title: "Senior GURU",       emoji: "🔥" },
  { min: 100, title: "Master GURU",       emoji: "👑" },
  { min: 200, title: "Grandmaster GURU",   emoji: "🌟" },
];

const DOMAINS = {
  "Sales & Selling": {
    keywords: ["sell","sales","negotiate","objection","close","pricing","deal","buyer","purchase","discount","price","revenue operation","revenue","lead lifecycle","scoring","routing","pipeline","crm","cold email","cold outreach","prospect"],
    skills: []
  },
  "Conversion Optimization (CRO)": {
    keywords: ["convert","cro","conversion rate","landing page","signup","registration","checkout","form","popup","modal","overlay","banner","paywall","upgrade screen","upsell","onboarding","activation","time-to-value","trial"],
    skills: []
  },
  "Content & Copy": {
    keywords: ["copy","write","rewrite","edit","editing","blog","article","email sequence","email flow","drip campaign","lifecycle email","welcome email","nurture","headline","tagline"],
    skills: []
  },
  "SEO & Search": {
    keywords: ["seo","search engine","ranking","keyword","backlink","schema","structured data","serp","site architecture","page hierarchy","navigation","url structure","internal link","programmatic seo","ai search","ai overview","aeo","geo","llmo","llm"],
    skills: []
  },
  "Paid Advertising": {
    keywords: ["ad ","ads ","advertising","campaign","paid","ppc","ad creative","ad variant","ad copy","google ads","meta ads","facebook ad","instagram ad","tiktok ad","linkedin ad"],
    skills: []
  },
  "Social Media": {
    keywords: ["social media","social content","tiktok","instagram","facebook","linkedin","twitter","x.com","youtube","schedule","social post"],
    skills: []
  },
  "Visual & Video Content": {
    keywords: ["image","photo","graphic","visual","video","production","animation","thumbnail","banner","design","generate image","create image"],
    skills: []
  },
  "Analytics & Testing": {
    keywords: ["analytics","tracking","measure","a/b test","experiment","ab test","metric","kpi","dashboard","reporting","ga4","pixel","conversion tracking"],
    skills: []
  },
  "Strategy & Planning": {
    keywords: ["strategy","launch","product launch","announcement","release","idea","planning","positioning","brand","market research","competitive","competitor","alternative","comparison","directory","submission","product hunt"],
    skills: []
  },
  "Growth & Community": {
    keywords: ["community","referral","affiliate","co-marketing","partner","word-of-mouth","free tool","lead magnet","lead gen","growth"],
    skills: []
  },
  "Customer & Retention": {
    keywords: ["churn","retention","cancel","save offer","dunning","payment recovery","win-back","customer research","customer interview","survey","feedback"],
    skills: []
  },
  "Psychology & Behavior": {
    keywords: ["psychology","behavioral","mental model","cognitive bias","scarcity","social proof","anchoring"],
    skills: []
  },
  "App Store & ASO": {
    keywords: ["aso","app store","google play","app listing"],
    skills: []
  },
  "Development & Tools": {
    keywords: ["mcp","server","api","sdk","cli","commit","changelog","git","playwright","test","code","developer","devops","artifact","html","react","tailwind","skill creator","skill-creator","screenshot","portfoli","resume","cv","job","domain name","brainstorm"],
    skills: []
  },
  "Productivity & Organization": {
    keywords: ["organize","file","folder","invoice","receipt","tax","bookkeeping","cleanup","duplicate","download","transcript","meeting","youtube","video download"],
    skills: []
  },
  "Knowledge & Productivity": {
    keywords: ["obsidian","vault","second brain","knowledge graph","graphify","note","remotion","video creation"],
    skills: []
  }
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split("\n")) {
    const ci = line.indexOf(":");
    if (ci === -1) continue;
    const key = line.slice(0, ci).trim();
    let val = line.slice(ci + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    fm[key] = val;
  }
  return fm;
}

function classifySkill(name, description) {
  const text = (name + " " + description).toLowerCase();
  const matches = [];
  for (const [domain, cfg] of Object.entries(DOMAINS)) {
    for (const kw of cfg.keywords) {
      if (text.includes(kw.toLowerCase())) { matches.push(domain); break; }
    }
  }
  if (matches.length === 0) matches.push("Other");
  return matches;
}

function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath, { withFileTypes: true })
    .filter(e => e.isDirectory() || e.isSymbolicLink())
    .filter(e => {
      const real = e.isSymbolicLink()
        ? path.resolve(dirPath, fs.readlinkSync(path.join(dirPath, e.name)))
        : path.join(dirPath, e.name);
      return fs.existsSync(path.join(real, "SKILL.md"));
    })
    .map(entry => {
      const realPath = entry.isSymbolicLink()
        ? path.resolve(dirPath, fs.readlinkSync(path.join(dirPath, entry.name)))
        : path.join(dirPath, entry.name);
      const content = fs.readFileSync(path.join(realPath, "SKILL.md"), "utf8");
      const fm = parseFrontmatter(content);
      return {
        name: fm.name || entry.name,
        dir: entry.name,
        description: fm.description || "",
        path: realPath
      };
    });
}

function getGURULevel(count) {
  let lvl = LEVELS[0];
  for (const l of LEVELS) { if (count >= l.min) lvl = l; }
  return lvl;
}

function ensureGapsLog() {
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

*No gaps logged yet. This file populates when GURU detects missing capabilities.*
`);
  }
}

function generateStatusFile(allSkills, newSkills, removedSkills, prevCount) {
  const now = new Date().toISOString().split("T")[0];
  const count = allSkills.length;
  const lvl = getGURULevel(count);
  const next = LEVELS.find(l => l.min > count);
  const activeDomains = Object.values(DOMAINS).filter(d => d.skills.length > 0).length;

  let s = `# GURU Status — Evolution Tracker
> Last updated: ${now}

## Current Level: ${lvl.emoji} ${lvl.title}

- **Skills in unified pool**: ${count}
- **Domains covered**: ${activeDomains}
${next ? `- **Next level**: ${next.emoji} ${next.title} (need ${next.min - count} more)` : `- **Maximum level** 🏆`}

## Evolution History

| Date | Skills | Level |
|------|--------|-------|
`;

  if (fs.existsSync(STATUS_FILE)) {
    const ex = fs.readFileSync(STATUS_FILE, "utf8");
    const seen = new Set();
    for (const line of ex.matchAll(/\| (\d{4}-\d{2}-\d{2}) \| (\d+) \|/g)) {
      const key = `${line[1]}-${line[2]}`;
      if (!seen.has(key)) {
        seen.add(key);
        s += `| ${line[1]} | ${line[2]} | ${getGURULevel(parseInt(line[2])).title} |\n`;
      }
    }
  }
  const today = `| ${now} | ${count} | ${lvl.title} |`;
  if (!s.includes(today)) s += `${today}\n`;

  s += `\n## Recent Changes\n`;
  if (newSkills.length) {
    s += `\n### ✨ New (${newSkills.length})\n`;
    for (const sk of newSkills) {
      const desc = (sk.description || "").slice(0, 80);
      s += `- \`${sk.name}\` — ${desc}${desc.length >= 80 ? "..." : ""}\n`;
    }
  }
  if (removedSkills.length) {
    s += `\n### 🗑 Removed (${removedSkills.length})\n`;
    for (const sk of removedSkills) s += `- \`${sk.name}\`\n`;
  }
  if (!newSkills.length && !removedSkills.length) {
    s += `\nNo changes. All ${count} skills accounted for.\n`;
  }

  s += `
## How Skills Are Discovered

Skills land in two places depending on install method:
- \`/plugin install\` → \`~/.claude/skills/\`
- \`npx skills add\` → \`.agents/skills/\`
- Manual copy → either

GURU scans BOTH and presents them as ONE unified pool.

## Commands

| Action | Command |
|--------|---------|
| Activate GURU | Say \`GURU\` |
| Update map | Say \`GURU update yourself\` |
| Regenerate map | \`node guru/scripts/generate-map.js\` |
| Sync skills | \`node guru/scripts/sync-skills.js\` |

---

*"The day you stop adding skills is the day you stop being GURU."*
`;

  fs.writeFileSync(STATUS_FILE, s);
}

function generateCapabilityMap(allSkills) {
  // Reset domain skills
  for (const cfg of Object.values(DOMAINS)) cfg.skills = [];

  // Classify each skill into domains
  for (const skill of allSkills) {
    for (const domain of classifySkill(skill.name, skill.description)) {
      if (DOMAINS[domain]) DOMAINS[domain].skills.push(skill);
    }
  }

  const now = new Date().toISOString().split("T")[0];
  const lvl = getGURULevel(allSkills.length);
  const c = allSkills.length;

  let out = `# ${lvl.emoji} ${lvl.title} — Unified Capability Map
> Generated: ${now} | Skills: ${c} | Level: ${lvl.title}
> Sources: \`.agents/skills/\` + \`~/.claude/skills/\` → **one unified pool**
>
> Skills land wherever the install tool puts them. GURU scans both, deduplicates, presents as one.

---

## Quick Reference

| If you say... | GURU uses... |
|---|---|
`;

  for (const [domain, cfg] of Object.entries(DOMAINS)) {
    if (!cfg.skills.length) continue;
    const label = domain === "Conversion Optimization (CRO)" ? "My page isn't converting" :
                  domain === "Sales & Selling" ? "I need to sell something" :
                  domain === "Content & Copy" ? "I need copy / content" :
                  domain === "SEO & Search" ? "I want more search traffic" :
                  domain === "Paid Advertising" ? "I want to run ads" :
                  domain === "Social Media" ? "Help with social media" :
                  domain === "Visual & Video Content" ? "Create images / videos" :
                  domain === "Analytics & Testing" ? "Track / measure / test" :
                  domain === "Strategy & Planning" ? "Plan / strategize / launch" :
                  domain === "Growth & Community" ? "Grow / build community" :
                  domain === "Customer & Retention" ? "Customers are leaving" :
                  domain === "Psychology & Behavior" ? "Understand behavior" :
                  domain === "App Store & ASO" ? "Optimize my app listing" :
                  domain === "Development & Tools" ? "Build / test / ship code" :
                  domain === "Productivity & Organization" ? "Organize my files / work" :
                  "Manage knowledge/notes";
    out += `| "${label}" | ${domain} (${cfg.skills.length} skills) |\n`;
  }

  out += `
---

`;

  // Domain detail tables
  for (const [domain, cfg] of Object.entries(DOMAINS)) {
    if (!cfg.skills.length) continue;
    out += `## ${domain} (${cfg.skills.length})\n\n| Skill | What It Does |\n|-------|-------------|\n`;
    for (const sk of cfg.skills) {
      const sd = sk.description.length > 110 ? sk.description.slice(0, 107) + "..." : sk.description;
      out += `| \`${sk.name}\` | ${sd} |\n`;
    }
    out += `\n`;
  }

  // Unclassified
  const other = allSkills.filter(s => {
    const domains = classifySkill(s.name, s.description);
    return domains.length === 1 && domains[0] === "Other";
  });
  if (other.length) {
    out += `## Other (${other.length})\n\n| Skill | What It Does |\n|-------|-------------|\n`;
    for (const sk of other) {
      const sd = sk.description.length > 110 ? sk.description.slice(0, 107) + "..." : sk.description;
      out += `| \`${sk.name}\` | ${sd} |\n`;
    }
    out += `\n`;
  }

  // Cross-skill chains
  out += `---
## Cross-Skill Chains

| User Needs | Chain |
|---|---|
| Sell something | \`pricing-strategy\` → \`copywriting\` → \`image\` → \`sales-enablement\` → \`paid-ads\` → \`social-content\` |
| Launch product | \`launch-strategy\` → \`copywriting\` → \`image\` → \`social-content\` → \`email-sequence\` → \`directory-submissions\` |
| Fix conversions | \`page-cro\` → \`copywriting\` → \`ab-test-setup\` → \`analytics-tracking\` |
| Build audience | \`content-strategy\` → \`social-content\` → \`video\` → \`image\` → \`community-marketing\` |
| Reduce churn | \`churn-prevention\` → \`customer-research\` → \`email-sequence\` → \`onboarding-cro\` |
| SEO at scale | \`seo-audit\` → \`programmatic-seo\` → \`schema-markup\` → \`site-architecture\` |
| Paid campaigns | \`paid-ads\` → \`ad-creative\` → \`analytics-tracking\` |
| Build a dev tool | \`domain-name-brainstormer\` → \`mcp-builder\` → \`skill-creator\` → \`artifacts-builder\` → \`changelog-generator\` |
| Go freelance/pro | \`file-organizer\` → \`invoice-organizer\` → \`pricing-strategy\` → \`lead-research-assistant\` → \`email-sequence\` |

---

## Gap Resolution

When no skill matches:
1. **Adapt** with closest skill
2. **Offer**: "A) I'll draft a new skill now, or B) Find a GitHub repo — I'll install it."
3. **Build or Fetch** → log to \`gaps-log.md\`
4. **Regenerate**: \`node guru/scripts/generate-map.js\` or say "GURU update yourself"

---

*${lvl.emoji} ${lvl.title} — ${c} skills unified — ${now}*
`;

  fs.writeFileSync(OUTPUT, out);
  return { total: c, level: lvl, domains: Object.values(DOMAINS).filter(d => d.skills.length > 0).length };
}

function main() {
  console.log("🧠 GURU Capability Map Generator v3.0\n");
  console.log(`  Project dir: ${PROJECT_DIR}`);

  ensureDir(AGENTS_DIR);
  ensureDir(SKILLS_DIR);
  ensureGapsLog();

  const agentsSkills = scanDirectory(SKILLS_DIR);
  const claudeSkills  = scanDirectory(GLOBAL_SKILLS);

  console.log(`  .agents/skills/    → ${agentsSkills.length} skills`);
  console.log(`  ~/.claude/skills/  → ${claudeSkills.length} skills`);

  // Deduplicate by name — agents takes priority
  const agentsNames = new Set(agentsSkills.map(s => s.name));
  const uniqueClaude = claudeSkills.filter(s => !agentsNames.has(s.name));
  const allSkills = [...agentsSkills, ...uniqueClaude];

  console.log(`  Unified pool       → ${allSkills.length} skills`);
  if (uniqueClaude.length > 0)
    console.log(`  (${uniqueClaude.length} only in ~/.claude/skills/)\n`);
  else
    console.log(`  (all skills already in .agents/skills/)\n`);

  // Detect changes from previous map
  let prevCount = 0;
  const prevNames = new Set();
  if (fs.existsSync(OUTPUT)) {
    const old = fs.readFileSync(OUTPUT, "utf8");
    const pm = old.match(/Skills: (\d+)/);
    if (pm) prevCount = parseInt(pm[1]);
    for (const m of old.matchAll(/\| `([^`]+)` \|/g)) prevNames.add(m[1]);
  }

  const curNames = new Set(allSkills.map(s => s.name));
  const newSkills = allSkills.filter(s => !prevNames.has(s.name));
  const removedSkills = [...prevNames].filter(n => !curNames.has(n)).map(n => ({ name: n }));

  const result = generateCapabilityMap(allSkills);
  generateStatusFile(allSkills, newSkills, removedSkills, prevCount);

  console.log(`📊 ${result.level.emoji} ${result.level.title} — ${result.total} skills, ${result.domains} domains`);

  if (newSkills.length) {
    console.log(`\n✨ NEW (${newSkills.length}):`);
    for (const s of newSkills) console.log(`   + ${s.name}`);
  }
  if (removedSkills.length) {
    console.log(`\n🗑 REMOVED (${removedSkills.length}):`);
    for (const s of removedSkills) console.log(`   - ${s.name}`);
  }
  if (!newSkills.length && !removedSkills.length) {
    console.log(`✅ Map is current.`);
  }

  const nextLevel = LEVELS.find(l => l.min > result.total);
  if (nextLevel)
    console.log(`\n📈 ${nextLevel.min - result.total} more → ${nextLevel.emoji} ${nextLevel.title}`);

  console.log(`\n📄 ${OUTPUT}`);
  console.log(`📄 ${STATUS_FILE}`);
  console.log(`\n💬 Say "GURU" or "GURU update yourself" in Claude Code.`);
}

main();
