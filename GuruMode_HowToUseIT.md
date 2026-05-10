# GuruMode — How To Use IT

> **GURU version:** 3.0 (skill-based)
> **Current level:** 🌟 Grandmaster GURU — 908 skills, 16 domains
> **Last updated:** 2026-05-10

---

## 1. The Big Question: Won't GURU Forget What It Has?

You have 908 skills — 907 of them bundled inside the guru skill folder itself (`guru/skills/`). When you install via `npx skills add`, you get the guru protocol PLUS all 907 dormant skills. On first run, GURU detects the fresh machine and offers to "extract" them — copying from inside the skill folder out to the global skill directories.

Claude Code's context window is ~200K tokens. If every skill's metadata loaded, it'd be ~90K tokens just for names and descriptions. So how does GURU stay aware?

**GURU has two layers of awareness, not one.**

```
LAYER 1 — Claude Code Native Skill Discovery
  ├─ Scans ~/.claude/skills/ + .agents/skills/ at session start
  ├─ Loads only name + description (~100 tokens each) for ALL 908 skills
  ├─ Uses progressive disclosure: full SKILL.md loads ONLY when triggered
  └─ This is Claude Code's built-in mechanism — not GURU's

LAYER 2 — GURU's Capability Map (capability-map.md)
  ├─ A ~30KB condensed index organized by 16 domains
  ├─ GURU reads this ONCE at startup (or on demand)
  ├─ Maps user intent → domain → specific skill
  └─ This is GURU's self-awareness — separate from Claude Code's loader
```

### How It Actually Works in a Conversation

```
User: "I need to send an invoice to a client"
        │
        ▼
GURU classifies: "invoice" → Productivity & Organization domain
        │
        ▼
GURU scans capability-map.md → finds zoho-invoice-automation, freshbooks-automation,
quickbooks-automation, invoice-organizer in that domain
        │
        ▼
GURU asks narrowing question: "Are you using Zoho, FreshBooks, or QuickBooks?"
        │
        ▼
User: "Zoho"
        │
        ▼
GURU routes to zoho-invoice-automation → Claude Code loads ONLY this skill's full body
        │
        ▼
907 other skills remain dormant. Context window untouched.
```

**The key insight:** GURU never loads all 908 skills at once. It reads the map (30KB, one-time), classifies the user's intent, narrows to the right domain, then loads 1-3 relevant skills. The other 905+ skills are invisible to the context window.

### What Could Go Wrong (And Doesn't)

| Fear | Reality |
|------|---------|
| "908 skills will overflow context" | Only 1-3 load at a time. The map is 30KB. |
| "GURU will forget lesser-used skills" | The map is organized by domain. GURU scans the domain, not memory. |
| "New skills won't be discovered" | `GURU update yourself` regenerates the map in ~2 seconds. |
| "Duplicate skills will confuse routing" | Generator deduplicates by name. `.agents/skills/` takes priority. |
| "Composio skills will trigger accidentally" | They only trigger when user mentions the app name or a clear action verb. |

---

## 2. All Trigger Phrases & Slash Commands

### GURU Activation

Say ANY of these. They all work the same way.

| Trigger | Type | What Happens |
|---------|------|-------------|
| `GURU` | Natural language | Full concierge: greet → suggest domains → ask questions → route → execute |
| `guru` | Natural language | Same as above (case insensitive) |
| `/guru` | Slash command | Same as above |
| `help me guru` | Natural language | Same as above |
| `I need guidance` | Natural language | Same as above |
| `what can you help me with` | Natural language | Same as above |

**After activation, GURU responds:** *"What you had in your mind, son?"*

### Knowledge Update Commands

| Trigger | Type | What It Does |
|---------|------|-------------|
| `GURU update yourself` | Natural language | Runs sync + regenerate-map + reports new skills, level, progress |
| `GURU regenerate` | Natural language | Same as above |
| `update GURU` | Natural language | Same as above |
| `regenerate map` | Natural language | Same as above |

**After update, GURU reports:** *"✨ 2 new skills. 910 total. Already at 🌟 Grandmaster GURU."*

### Internal Slash Commands (from Obsidian Second Brain Skill)

These come from the `obsidian-second-brain` skill. They work inside Claude Code:

| Command | What It Does |
|---------|-------------|
| `/graphify` | Convert any input to knowledge graph |
| `/research` | Web research with citations via Perplexity |
| `/research-deep` | Vault-first deep research with gap filling |
| `/x-read` | Deep-read an X (Twitter) post |
| `/x-pulse` | Scan X for trending topics |
| `/youtube` | Extract YouTube transcript + summary |
| `/obsidian-save` | Save conversation to Obsidian vault |
| `/obsidian-daily` | Create today's daily note |
| `/obsidian-find` | Search your vault |
| `/obsidian-health` | Run vault health check |
| `/obsidian-recap` | Summarize a time period from vault |

### Maintenance Commands (Terminal, not Claude Code)

```bash
# Regenerate the capability map manually
node guru/scripts/generate-map.js

# Sync skills between both directories
node guru/scripts/sync-skills.js

# Full bootstrap (new machine setup)
node guru/scripts/bootstrap.js

# Run with explicit project directory
node guru/scripts/generate-map.js --project-dir "/path/to/project"
```

---

## 3. The Concierge Pattern (What GURU Does After Activation)

Every GURU activation follows this sequence. It never skips steps.

### Step 1: Greet
> *"What you had in your mind, son?"*

### Step 2: Suggest Domains
GURU reads the capability map's Quick Reference table and offers 3-5 domains in plain language:
> *"I can help you sell things, build tools, write content, run ads, organize your work, or find customers. What do you need?"*

### Step 3: Listen
GURU waits for you to describe your problem. Doesn't interrupt. Doesn't suggest yet.

### Step 4: Narrow (3-5 Questions)
GURU asks simple multiple-choice questions. Each eliminates half the options. Never more than 5 questions. Examples:
- *"Is this for a business or personal project?"*
- *"Do you already have customers, or starting from zero?"*
- *"B2B or B2C?"*

### Step 5: Route (Silent)
GURU matches your answers to skill chains. You never see skill names unless you ask.

### Step 6: Execute
Delivers ready-to-use output. No theory. No "you could consider..." Something you can DO.

---

## 4. What GURU Can Do (Domains at a Glance)

Based on the current capability map. GURU reads this at startup.

| When you say... | GURU routes to... | Skills |
|-----------------|-------------------|--------|
| "I need to sell something" | Sales & Selling | 35 |
| "My page isn't converting" | Conversion Optimization (CRO) | 71 |
| "I need copy / content" | Content & Copy | 27 |
| "I want more search traffic" | SEO & Search | 784 |
| "I want to run ads" | Paid Advertising | 40 |
| "Help with social media" | Social Media | 12 |
| "Create images / videos" | Visual & Video Content | 27 |
| "Track / measure / test" | Analytics & Testing | 31 |
| "Plan / strategize / launch" | Strategy & Planning | 37 |
| "Grow / build community" | Growth & Community | 12 |
| "Customers are leaving" | Customer & Retention | 9 |
| "Understand behavior" | Psychology & Behavior | 2 |
| "Optimize my app listing" | App Store & ASO | 1 |
| "Build / test / ship code" | Development & Tools | 826 |
| "Organize my files / work" | Productivity & Organization | 43 |
| "Manage knowledge/notes" | Knowledge & Productivity | 12 |

**Note:** 784 in SEO & Search and 826 in Development & Tools because the composio automation skills get classified there by keyword matching. Most are SaaS app integrations — they only activate when you mention the specific app.

---

## 5. Skill Types: What Triggers What

Not all 908 skills are equal. They fall into three tiers:

### Tier A — Curated Marketing Skills (44 skills)
**Source:** marketingskills repo
**Trigger:** User describes a marketing problem
**Examples:** `pricing-strategy`, `copywriting`, `seo-audit`, `cold-email`, `social-content`, `page-cro`
**How they fire:** GURU's concierge narrows → routes to the right marketing chain

### Tier B — Curated Dev/Productivity Skills (31 skills)
**Source:** awesome-claude-skills repo root
**Trigger:** User describes a dev task or productivity problem
**Examples:** `mcp-builder`, `changelog-generator`, `webapp-testing`, `file-organizer`, `domain-name-brainstormer`, `artifacts-builder`, `canvas-design`, `skill-creator`
**How they fire:** Keyword match on dev/productivity terms in user's request

### Tier C — Composio SaaS Automation Skills (832 skills)
**Source:** awesome-claude-skills/composio-skills/
**Trigger:** User mentions the app name OR a clear action verb with the app
**Examples:** `slackbot-automation`, `googledrive-automation`, `zoho-invoice-automation`, `github-automation`
**How they fire:** Only when user explicitly mentions the app. These are the quietest skills — they don't trigger on generic requests.

### Tier S — System Skills (1 skill)
**Source:** guru skill itself
**Trigger:** "GURU" or any activation phrase
**Examples:** `guru`
**How it fires:** This IS the GURU protocol. Always loaded when triggered.

## 5b. Skill Source Registry & Updates

GURU knows where every skill came from. `guru/skills-registry.json` tracks all sources:

| Source | Repo | Skills | Last Synced |
|--------|------|--------|-------------|
| Marketing Skills | coreyhaines31/marketingskills | 44 | 2026-05-09 |
| Awesome Claude Skills | ComposioHQ/awesome-claude-skills | 863 | 2026-05-10 |

### Adding a new skill source

```bash
# Standard skill repos (folder-per-skill with SKILL.md):
node guru/scripts/add-skills.js --repo https://github.com/user/repo --name "My Skills"

# Plugin-format repos (Claude Code plugins):
# Inside Claude Code: /plugin install superpowers

# After either method:
node guru/scripts/install-skills.js   # Extract new ones to global dirs
# Then inside Claude Code say: "GURU update yourself"
```

### Checking for upstream updates

```bash
# Check all sources for new commits:
node guru/scripts/check-updates.js

# Pull updates for stale sources:
node guru/scripts/check-updates.js --update

# Check one source only:
node guru/scripts/check-updates.js --source marketingskills
```

---

## 6. Cross-Skill Chains (GURU's Secret Weapon)

When you describe a problem that spans multiple domains, GURU chains skills silently:

| Your Need | Chain (GURU routes through all of these) |
|-----------|------------------------------------------|
| Sell something | pricing-strategy → copywriting → image → sales-enablement → paid-ads → social-content |
| Launch a product | launch-strategy → copywriting → image → social-content → email-sequence → directory-submissions |
| Fix conversions | page-cro → copywriting → ab-test-setup → analytics-tracking |
| Build an audience | content-strategy → social-content → video → image → community-marketing |
| Reduce churn | churn-prevention → customer-research → email-sequence → onboarding-cro |
| SEO at scale | seo-audit → programmatic-seo → schema-markup → site-architecture |
| Paid campaigns | paid-ads → ad-creative → analytics-tracking |
| Build a dev tool | domain-name-brainstormer → mcp-builder → skill-creator → artifacts-builder → changelog-generator |
| Go freelance/pro | file-organizer → invoice-organizer → pricing-strategy → lead-research-assistant → email-sequence |

You never say these skill names. You say "I want to launch my product." GURU does the chain.

---

## 7. Gap Resolution (When GURU Doesn't Have a Skill)

Sometimes no skill matches. GURU doesn't pretend. It tells you and offers two paths:

> *"I don't have a specific skill for [X], but I can adapt [closest-skill]."*
> *"I can: A) Draft something from my knowledge right now, or B) You find a GitHub repo that covers this, and I'll install it."*

| You pick... | What happens |
|-------------|-------------|
| **A — Draft** | GURU builds it from its training knowledge. Output is ready to use. |
| **B — Fetch** | You provide a GitHub URL. GURU runs `npx skills add <repo>` or copies the folder. |

After either path: GURU logs the gap to `.agents/gaps-log.md` and tells you to run `GURU update yourself`.

---

## 8. The Upgrade Workflow (Step by Step)

### Option A: Add skills from a repo (bundled permanently)

```bash
# Ingest a standard skill repo into guru/skills/
node guru/scripts/add-skills.js --repo https://github.com/user/repo --name "My Skills"

# Extract to global directories
node guru/scripts/install-skills.js

# Update GURU's map
# Say inside Claude Code: "GURU update yourself"
```

### Option B: Install a Claude Code plugin

```
# Inside Claude Code:
/plugin install superpowers

# Then say: "GURU update yourself"
```

### Option C: Manual copy

```bash
cp -r /path/to/skill-folder .agents/skills/
# Then say: "GURU update yourself"
```

### When you want to check for upstream updates

```bash
# Check all sources
node guru/scripts/check-updates.js

# If updates available, pull them
node guru/scripts/check-updates.js --update

# Re-extract updated skills
node guru/scripts/install-skills.js

# Rebuild map
# Say: "GURU update yourself"
```

**What happens during update:**

```
1. check-updates.js → compares last_synced vs upstream commits
2. add-skills.js → clones repo, copies new/updated skills to guru/skills/
3. install-skills.js → extracts from guru/skills/ to ~/.claude/skills/ + .agents/skills/
4. GURU update yourself → sync + regenerate capability map
5. GURU reports: "✨ 5 new skills. 2 sources updated. 915 total. 🌟 Grandmaster GURU."
```

### The Startup Check (Automatic)

At the start of every conversation, GURU checks:
1. Does `.agents/capability-map.md` exist? → Read it.
2. Is it stale? (newer skill files exist) → Suggest: *"My map might be out of date. Want me to update?"*
3. What's my current level? → Note it.

This prevents the "GURU forgot" problem. The map is the source of truth, and it's checked every session.

---

## 9. File Reference (What Lives Where)

| File | Location | Purpose | Auto? |
|------|----------|---------|-------|
| `SKILL.md` | `guru/` | Full GURU protocol + first-run detection | Manual (you edit this) |
| `skills/` | `guru/skills/` | **907 bundled skills** (dormant until extracted) | Manual (add skills here) |
| `install-skills.js` | `guru/scripts/` | **The pill** — copies bundled skills to global dirs | Run on first boot |
| `bootstrap.js` | `guru/scripts/` | One-command setup (auto-detects + runs installer) | Run once per machine |
| `generate-map.js` | `guru/scripts/` | Scans skills → builds map | Run via trigger |
| `sync-skills.js` | `guru/scripts/` | Syncs skills between directories | Run via trigger |
| `capability-map.md` | `.agents/` | GURU's self-awareness index (30KB) | Auto-generated |
| `guru-status.md` | `.agents/` | Evolution level + history | Auto-generated |
| `gaps-log.md` | `.agents/` | Missing capabilities tracker | Manual (GURU writes) |
| `CLAUDE.md` | `~/.claude/` | Thin trigger file (25 lines) | Manual |
| `CLAUDE.md` | Workspace root | Workspace pointers | Manual |

**What to back up:**
- `guru/` — the entire skill folder (protocol + scripts + 907 bundled skills). Everything else is auto-generated.
- `.agents/gaps-log.md` — manual tracking (optional, low priority)
- That's it. Two things.

---

## 10. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| GURU doesn't respond to "GURU" | Skill not installed or CLAUDE.md missing trigger | Check `~/.claude/skills/guru/SKILL.md` exists |
| GURU responds but doesn't seem to know skills | capability-map.md stale or missing | Say `GURU update yourself` |
| "GURU update yourself" does nothing | Scripts not found | Run manually: `node guru/scripts/generate-map.js --project-dir .` |
| Too many irrelevant composio skills firing | Keyword overlap in domain classifier | Rare. GURU's narrowing questions filter before routing. |
| Generator shows 0 skills | Skills directory empty | Check `.agents/skills/` has folders with SKILL.md |
| Sync shows different counts | One directory missing skills | That's what sync fixes — run it |
| GURU works on machine A but not B | guru skill not on machine B | Copy `guru/` folder + run `node guru/scripts/bootstrap.js` |

---

## 11. Quick Reference Card

```
┌──────────────────────────────────────────────────────────┐
│                    GURU QUICK REFERENCE                     │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ACTIVATE:       Say "GURU"                                │
│  GREETING:       "What you had in your mind, son?"         │
│  UPDATE MAP:     Say "GURU update yourself"                │
│                                                            │
│  INSTALL GURU:   npx skills add arjunazwan/guru            │
│                  → then say "GURU" → auto-extracts         │
│                                                            │
│  BOOTSTRAP:      node guru/scripts/bootstrap.js            │
│  ADD SOURCE:     node guru/scripts/add-skills.js --repo .. │
│  CHECK UPDATES:  node guru/scripts/check-updates.js        │
│  PULL UPDATES:   node guru/scripts/check-updates.js --upd. │
│  EXTRACT SKILLS: node guru/scripts/install-skills.js       │
│  SYNC:           node guru/scripts/sync-skills.js          │
│  MAP:            node guru/scripts/generate-map.js         │
│                                                            │
│  CURRENT:        🌟 Grandmaster GURU — 908 skills          │
│  SOURCES:        2 tracked in skills-registry.json         │
│  BUNDLED IN:     guru/skills/  (907 dormant skills)        │
│  EXTRACTED TO:   ~/.claude/skills/ + .agents/skills/       │
│                                                            │
│  REGISTRY:       guru/skills-registry.json                 │
│  MAP FILE:       .agents/capability-map.md (30KB)          │
│  STATUS FILE:    .agents/guru-status.md                    │
│  GAPS FILE:      .agents/gaps-log.md                       │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

---

*GURU doesn't remember 908 skills — it reads one 30KB map. And all 907 skills are inside the guru folder, dormant until extracted. One pill. Everything inside.*
