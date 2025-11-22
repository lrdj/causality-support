// Causality Garden – Architecture & Decisions (DEVNOTES)

This document captures the current architecture, user flows, and key decisions made during the build of the Causality Garden prototype. It is aimed at maintainers and facilitators so the context isn’t lost between iterations.

## Overview

- Stack: Node.js + GOV.UK Prototype Kit (Nunjucks, Express). No DB; in‑memory session data.
- Goal: Facilitate open-ended causal mapping with lightweight AI assists and simple workshop UX.
- Status: MVP validated in a live session; export/import and a sample loader support demos/training.

## Data Model (in-memory)

- Session
  - id, title, facilitator_name, phase (seeding|growing|deepening|clustering|reflection)
  - created_at
  - nodes[] (flat, with parent_id)
  - clusters[] (id, label, colour, description)
  - prompt_logs[] (prompt_text + timestamps)
  - reflection (string)
- Node
  - id, session_id, parent_id, text, level, author_id, created_at
  - tags[] (unused), cluster_id
  - agency: null|low|med|high (see RAG below)
  - children[] (derived for tree rendering)

## Key UX & Behaviour

### 1) Building the tree
- Two actions on each node:
  - Why is that? → adds a child (deepen branch)
  - And why else do you think? → adds a sibling (child on the parent)
- Root node only shows “Why is that?”.
- Add response page adapts H1 + label + hint to the mode and echoes parent text for context.

### 2) Agency (RAG control)
- Purpose: Capture perceived control over a given node/statement.
- Set Agency flow:
  - Link on each node: Set agency → select (No agency set | Low | Some | High)
  - “No agency set” stores null and leaves the grey background; other values tint background and add a tag.
- RAG mapping:
  - unset → grey (#f3f2f1), no tag
  - low → red tint (#f3d2d2), tag red
  - med → amber tint (#fff4e5), tag amber
  - high → green tint (#e0f3e8), tag green
- Dashboard: “Agency” tiles show counts and expandable lists of node texts per category.

### 3) Clusters (themes)
- Refresh clusters (destructive): Recomputes clusters via LLM and clears prior assignments; unique colours per refresh using a shuffled palette.
- Manual assign cluster per node; “Assign cluster” opens a select with current clusters.

### 4) Reflection
- Generated via the LLM; display splits long text into bullets for readability.
- Themes section: each cluster shows colour tile + count + description + details list of node texts.

### 5) Export / Import / Sample
- Export JSON: From Sessions table; downloads the full session object (includes clusters, agency, logs).
- Import JSON: Paste JSON to create a session; resolves ID collisions.
- Load sample session: One‑click loader that reads a bundled sample and regenerates node IDs for safe demos.

## Views
- Dashboard: tree, stats, quick actions, clusters, shallow nodes, agency tiles.
- Add response: mode‑aware H1/label/hint; supports deepen/why‑else/seed.
- Assign cluster: per node select.
- Assign agency: per node select (unset/low/med/high) with brief guidance.
- Reflection: panel with bullet sentences; themes with details lists.
- Sessions: table with Open / Export / Rename + Import + Load sample buttons.
- Participant: single‑prompt view (experimental); set by “Why is that?” route.

## Routes (selected)
- Sessions: `GET /sessions`
- New/Create: `GET/POST /session/new` → `/session/create`
- Dashboard: `GET /session/:id/dashboard`
- Responses: `GET /session/:id/add-response`, `POST /session/:id/process-response`
- Deepen: `GET /session/:id/node/:nodeId/deepen`
- Clusters: `GET /session/:id/refresh-clusters` (destructive), `GET/POST /session/:id/node/:nodeId/cluster`
- Agency: `GET/POST /session/:id/node/:nodeId/agency`
- Reflection: `GET /session/:id/reflection`, `POST /session/:id/generate-reflection`
- Export/Import: `GET /session/:id/export`, `GET/POST /session/import`
- Sample: `GET /session/create-sample`
- Rename: `GET /session/:id/edit-title`, `POST /session/:id/update-title`
- Reset tree: `GET /session/:id/reset-tree`

## Styling & Components
- GOV.UK Prototype Kit unbranded layout with a simple Clarity Lab header include.
- Tree nodes: border colour by cluster; background tint by agency; tags for cluster and agency.
- Cluster tiles: responsive grid; full colour tiles.
- Agency tiles: same grid; R/A/G/grey with details lists.
- Date formatting: custom Nunjucks filter `formatDate('yy-MM-dd HH:mm')`.

## LLM Integration
- analyzeResponse: split/multi‑idea detection for responses.
- generateFollowUp: short question based on depth; logged for Participant view.
- checkVagueness: supportive nudge for vague responses.
- suggestClusters: clustering with preferred label bias; JSON response consumed by routes.
- generateReflection: short 3–4 sentence reflection; rendered as bullets.

## Deployment Notes (Render)
- Use `npm start`; set `HOST=0.0.0.0`, `NODE_ENV=production`, and kit password env (e.g., `PASSWORD`).
- Custom domain: Render provisions TLS via Let’s Encrypt; ensure CNAME and no restrictive CAA.
- Health: optional `/healthz` route if you configure Render health checks.
- Engines: package.json has `"engines": { "node": "22.x" }`.

## Persistence Options (future)
- GitHub Contents API (lean): one JSON per session in a dedicated repo; optimistic concurrency via file SHA; private repo recommended.
- SQLite on Render Disk: simplest server‑side persistence; single instance; add nightly backup.
- PostgreSQL (managed): for multi‑user scale; add Prisma/Knex migrations.

## Known Limitations
- In‑memory data lost on restart; use Export JSON for backups (or add persistence as above).
- Participant view is single‑prompt, non‑realtime; refresh to see changes.
- No auth differentiation; kit password protects the whole prototype.

## Future Enhancements
- Persistence: GitHub‑backed save/load or SQLite.
- Trainer helpers: outline/YAML importer; multiple bundled samples.
- Export: DOT/GraphML; printable one‑pager; richer reflection formatting.
- Participant UX: auto‑refresh or prompt push indicator; node highlight for current prompt.
- Agency: optional “Agency not set” tag; Circle of Control visualization.
- Accessibility polish: focus management, keyboard shortcuts, contrast checks.

---

Questions or changes? This doc is meant to evolve alongside the prototype.
