# GURU Evolution Reference

## Levels

| Level | Skills | Emoji | What Unlocks |
|-------|--------|-------|-------------|
| Apprentice GURU | 0-9 | 🌱 | Basic concierge. Can ask questions and route to skills. |
| Junior GURU | 10-24 | 🌿 | Multi-skill chains. Can solve problems spanning 2-3 domains. |
| GURU | 25-49 | 🧠 | Full self-awareness. Reads own capability map. Cross-repo chaining. |
| Senior GURU | 50-99 | 🔥 | Broad capability. Most user needs covered without gaps. |
| Master GURU | 100-199 | 👑 | Near-complete. Can build custom skills for edge cases. |
| Grandmaster GURU | 200+ | 🌟 | Ultimate. Every domain covered. Self-healing. |

## Domains Tracked

The generator classifies skills into these domains:

1. Sales & Selling
2. Conversion Optimization (CRO)
3. Content & Copy
4. SEO & Search
5. Paid Advertising
6. Social Media
7. Visual & Video Content
8. Analytics & Testing
9. Strategy & Planning
10. Growth & Community
11. Customer & Retention
12. Psychology & Behavior
13. App Store & ASO
14. Development & Tools
15. Productivity & Organization
16. Knowledge & Productivity

## Key Design Decisions

### DD1 — Dual-Source Scanning
Skills land in two places depending on install method (`/plugin install` vs `npx skills add`). GURU scans both and deduplicates.

### DD2 — Concierge Pattern
Users describe problems in natural language. GURU classifies, asks narrowing questions, routes to skills silently. Skill names are never shown unless requested.

### DD3 — Progressive Disclosure
Skills load in 3 tiers: metadata (always), body (when triggered), resources (on demand). This prevents context overflow.

### DD4 — Gap Resolution
When no skill matches: adapt closest, or offer to build/fetch. Log gaps for future upgrade.

### DD5 — Self-Upgrade
`GURU update yourself` triggers sync + regeneration. New skills detected, map refreshed, evolution tracked.
