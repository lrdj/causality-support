# Changelog

All notable changes to this project will be documented in this file.

## Unreleased (2025-11-12)

- Causality tree interactions
  - Replaced generic “Add response” with two explicit actions on each node:
    - “Why is that?” — deepens the branch (adds a child).
    - “And why else do you think?” — adds a sibling (adds another child to the parent).
  - Root node now only shows “Why is that?” (no siblings for root).
- Seeding flow
  - Dashboard now shows “Add starting point” only when no root exists.
  - Seeding sets the session root; prevents accidental multiple roots.
- Deletion and reset
  - Added “Delete node” (non-root) with recursive subtree deletion.
  - Added “Reset tree” on the dashboard to clear nodes, clusters, prompts, and reflection; resets phase to seeding.
- Clustering
  - “Suggest clusters” is now destructive and relabeled “Refresh clusters”: clears previous clusters and assignments, then applies fresh LLM suggestions based on all nodes.
  - Cluster color assignment now uses a shuffled palette each refresh to avoid duplicates while appearing random.
  - Added “Assign cluster” UI to manually assign or clear a node’s cluster.
- Reflection
  - Fixed Nunjucks template default for cluster counts to avoid rendering error.
- UI polish
  - Cluster tiles now render in a responsive grid; single-column on small screens.
  - Add-response page headings and prompts are mode-aware (why vs why-else vs seed), and show LLM follow-up + fallback phrasing when deepening.
- Known constraints
  - Participant view is functional for single-prompt flows but considered experimental (no realtime updates yet).
  - Session data remains in-memory (no DB); restarting the server clears data.

## 2025-11-22

- Agency (control) ratings
  - Added “Set agency” link on each node → select list with: No agency set, Low, Some, High.
  - Node backgrounds tint by agency (R/A/G; unset is grey) and show a small agency tag for Low/Some/High.
  - New Agency section on the dashboard with four tiles (unset/low/med/high) and details lists of node texts per category.
  - Export/Import JSON includes node `agency` values; unset stored as null.
- Reflection readability
  - Reflection text split into sentence bullets for easier scanning.
  - Theme lists now use Details pattern to expand individual node statements.
- Sessions utilities
  - Export JSON link per session; Import page (paste JSON); Load sample session (bundled tree).
  - Rename flow moved to its own page from the sessions table.
- Header & polish
  - Clarity Lab service nav added (unbranded kit layout); date formatting filter (`yy-MM-dd HH:mm`).
