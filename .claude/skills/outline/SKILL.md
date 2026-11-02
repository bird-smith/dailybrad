---
name: outline
description: Write or revise a plain-language outline of a feature in docs/outlines/. Use after a brainstorm, or when asked to write or change an outline.
---

# Outline

Work goes top down so no single chat has to hold a whole feature. **Skip the outline** only
when the idea clearly fits in one plan (a small fix, one screen tweak).

- **Where:** `docs/outlines/<name>.md`.
- **Who it's for:** him. Plain language, what he'll see and do. No data tables, columns,
  functions or file names; those belong in plans.
- **Size:** no line cap. Split only if it really holds two separate ideas.
- **Sections** (drop any that don't apply):

| Section | Holds |
|---------|-------|
| Status line | `**Status:** draft / approved / split into plans`, and the date |
| The pitch | 2-3 sentences |
| How it works | His experience, start to finish, as numbered steps |
| Rules and worked example | With real numbers |
| Look and feel | Phone and desktop |
| Still to decide | `- [ ]` items, each with a recommended answer |
| Not in the first version | Parked ideas |
| Plans | Pointer to the `docs/TOC.md` section. Empty until split. |

Commit it, then **stop and ask him to review it.** Revise until he says it looks good, then
set its status to approved. Splitting it is the next request: don't run ahead.

If a later plan changes something the outline decided, add it to a "Changed while planning"
list in the outline, for him to confirm. Plans and outline never quietly disagree.
