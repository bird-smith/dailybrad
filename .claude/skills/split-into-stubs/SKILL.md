---
name: split-into-stubs
description: Divide an approved outline into short plan stub files and add one roadmap line per plan to docs/TOC.md. Use when an outline has been approved.
---

# Split an outline into plan stubs

Writing four full plans at once burns the allowance and makes each one worse. A stub costs a
few lines and waits until it's needed. **Don't write the plans.**

Divide the outline into bite-sized plans. Each should be expected to land under 400 lines and
give him something he can see or use when it's done. Common seams: saving the data, the entry
screen, the results screen. Then, for each plan, in build order:

1. Create `docs/plans/<section>/<section>.<n>-<feature-name>.md` from the template below,
   numbered by where it sits in `docs/TOC.md`.
2. Add one `[ ] [ ] [ ]` line to `docs/TOC.md`, under its section. **Under 90 characters**:
   a few words on what it covers, not a summary.

Set the outline's status to "split into plans", point its Plans section at the TOC section,
commit, show him the new TOC lines, and stop.

## Stub template

```markdown
# Plan: <name in plain words>

**Status:** stub, not written yet
**Outline:** `docs/outlines/<file>.md`, sections "<A>", "<B>"
**Depends on:** <other plan file names, or nothing>

## Scope

- <3-6 bullets: what this plan delivers, in terms of what he'll see>

**Not in this plan:** <what neighbouring plans cover>
```

Refer to other plans by file name with an x for the number (`1.x-brew-log.md`), never "plan
1.1", so renumbering doesn't break the link.
