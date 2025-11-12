


Causality Garden
================


## About This Tool

This repository contains a GOV.UK Prototype Kit web app for facilitating a “Causality Garden” workshop — a structured-yet-organic method to explore unclear problems via open-ended causal mapping.

Key capabilities:

- Build a causal tree from a seed (“starting point”).
- Add two kinds of responses on each node:
  - “Why is that?” — deepens the branch (adds a child).
  - “And why else do you think?” — adds a sibling (adds another child to the same parent).
- AI assistance for splitting multi‑idea responses, generating follow-up questions, suggesting clusters (themes), and producing a short reflection.
- Manual cluster assignment per node; clusters display as colored tiles.
- Safe editing: delete a node (and its subtree), or reset the whole tree.

Quick start:

1. `npm install`
2. `export OPENAI_API_KEY=your_key_here`
3. `npm run dev` and open http://localhost:3000
4. Create a session → “Add starting point” → build the tree with “Why is that?” and “And why else do you think?”
5. “Refresh clusters” to re-calculate themes; optionally “Assign cluster” manually.
6. “Generate reflection” to produce a short summary.

Notes:

- Data is in-memory; restart or “Reset tree” clears the session content.
- Participant view is experimental (single-prompt flow; refresh to see new questions).

For a detailed technical overview, see IMPLEMENTATION.md. For installation specifics, see INSTALL.md. Recent changes are in CHANGELOG.md.


## **Part 1 – Facilitator Training Manual**

*(for learning and confidently leading a Causality Garden session)*

---

### 1. Overview

**Purpose:**
The *Causality Garden* is a structured-yet-organic method for exploring unclear problems through open-ended causal mapping. It blends the **Ishikawa (fishbone)** diagram’s systemic breadth with the **5 Whys** technique’s depth — adapted for situations where the participant doesn’t yet know what the “problem” is.

**Typical use cases:**

* Career or life reflection (“I feel stuck”)
* Service or organisational discovery before problem definition
* Group reflection on a shared frustration or systemic issue
* Sense-making after research or crisis (“What’s really going on here?”)

**Session goal:**
To help participants externalise complexity, explore causal threads, and discover emergent themes they can later act on.

---

### 2. Core principles

| Principle                      | Description                                                              |
| ------------------------------ | ------------------------------------------------------------------------ |
| **Start from uncertainty**     | You don’t need a clear problem; emotion or confusion is enough.          |
| **Grow, don’t force**          | Branches form naturally; don’t over-structure too early.                 |
| **Separate roots**             | Keep each causal thread distinct — one idea per note or node.            |
| **Drill deeper**               | Encourage multiple “whys” until reaching a meaningful insight or belief. |
| **Cluster later**              | Only after the garden grows should you group and name themes.            |
| **Reflection over correction** | The map is about sense-making, not factual accuracy.                     |

---

### 3. Session flow

#### **Phase 1: Seeding (5–10 mins)**

**Objective:** Identify the initial feeling or observation.
**Facilitator actions:**

1. Ask: “What feels stuck, frustrating, or confusing right now?”
2. Capture it as a single sentence or central node.
3. Check: “Does this phrasing feel true enough to start exploring?”

---

#### **Phase 2: Growing roots (20–30 mins)**

**Objective:** Explore first-level causes freely.
**Facilitator guidance:**

* Ask “Why might that be?” repeatedly — accept all directions.
* Keep each response separate (one card/sticky/note).
* Reassure participants: “We’re mapping possibilities, not certainties.”
* Don’t rush to category labels.

**Prompts:**

* “What’s contributing to that?”
* “When does it show up most clearly?”
* “What else might connect to that?”
* “If that’s true, what makes it so?”

---

#### **Phase 3: Deepening branches (20–30 mins)**

**Objective:** Follow promising lines of causality.
**Facilitator actions:**

* Choose a few interesting roots and keep asking “why?” until you reach beliefs, constraints, or system factors.
* Encourage **clarity**: “Does this belong on a new branch or continue the same one?”
* Watch for **branch blending** (participants mixing multiple causes in one note).
* Gently separate them: “It sounds like there are two ideas here — shall we split them?”

---

#### **Phase 4: Clustering and reflection (30–40 mins)**

**Objective:** Move from chaos to meaning.
**Steps:**

1. Ask the participant to step back.
2. Invite them to group related notes or branches — using colour, proximity, or shape.
3. Encourage emergent naming: “If these belong together, what might you call this cluster?”
4. Typical themes: *Identity*, *Environment*, *Security*, *Growth*, *Relationships*, *Health*, *Belonging*, *Agency*.
5. Reflect on energy: “Which clusters feel heavy? Which feel alive?”

---

#### **Phase 5: Harvest (10–20 mins)**

**Objective:** Surface insights and next questions.
**Prompts:**

* “What’s standing out to you now?”
* “What patterns or tensions do you see?”
* “If you could nurture one part of this garden, what would it be?”
* “What’s one small next step?”

**Optional outputs:**

* Photograph or export the map
* List emergent themes and reflections
* Identify topics for next coaching or design session

---

### 4. Facilitation tips

* **Tone:** Calm, exploratory, non-directive.
* **Language:** Use “might,” “seems,” “could,” rather than “is” or “should.”
* **Containment:** The garden can touch deep emotions — leave time for grounding.
* **Mediums:** Miro, Mural, Whimsical, Figjam, or physical Post-its.
* **Timing:** 90 minutes for individuals; 2 hours for groups.

---

### 5. Variants

| Variant                    | Description                                                     |
| -------------------------- | --------------------------------------------------------------- |
| **Solo reflection**        | Individual uses digital tool or paper map for journaling.       |
| **Paired coaching**        | One person maps while the other asks “why” and “what else.”     |
| **Group system mapping**   | Collective causes of shared problem (requires clustering time). |
| **After-research debrief** | Use to make sense of qualitative research findings.             |

---

### 6. Outputs and deliverables

* Open-ended *causality map* (tree or web form)
* Themed clusters (e.g. 4–8) with participant-chosen names
* Summary of insights, tensions, or next actions

