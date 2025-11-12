## Summary

Briefly describe the changes in this PR.

- Why/Why‑else actions clarified (adds child vs sibling)
- Seed flow: “Add starting point” only when no root
- Delete node (non‑root) + Reset tree
- Refresh clusters (destructive) with unique colors
- Manual Assign cluster form
- Reflection template fix; UI polish (cluster grid, mobile)

## Details

- Clustering route renamed to `GET /session/:sessionId/refresh-clusters` (old route redirects)
- Colors assigned via shuffled palette per refresh to avoid duplicates
- Add‑response headings/prompts are mode‑aware; show LLM follow‑up + fallback on deepen

## Screenshots

(Optional) Before/after screenshots of dashboard and cluster tiles.

## Testing

- Seed session → root shows only “Why is that?”
- Non‑root node → shows “And why else…”, “Why is that?”, “Delete node”
- Refresh clusters → previous clusters cleared, new clusters created with varied colors
- Assign cluster → select any cluster or “No cluster”; updates node tag and counts
- Reflection → generates without template errors
- Mobile → cluster tiles stack in a single column

## Notes

- Participant view is experimental (single‑prompt flow, manual refresh)
- Data is in‑memory (no DB persistence)

