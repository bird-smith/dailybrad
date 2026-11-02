---
name: write-plan
description: Fill in one plan stub with a full implementation plan. Use when asked to write a named plan from docs/plans/. Never builds it.
---

# Write a plan

**Write one plan. Build nothing.** Keep the stub's scope and leave other stubs alone.

1. Read the stub, and only the outline sections the stub names.
2. Look at the code that exists. Don't plan against an imagined site.
3. Ask him about real choices before writing, one at a time, with a recommendation.
4. Write over the stub, with these sections:
   - **Goal:** one paragraph, plain language.
   - **Depends on**
   - **What he sees:** on a phone and on desktop.
   - **Data:** what's saved, where, and who can see it.
   - **Steps:** what to do, not a keystroke script. Each ends with something checkable.
   - **Testing:** Vitest tests for every rule and sum, then how he tries it by hand.
   - **Done when:** only things that can be checked the day it's built.
   - **Notes:** why for any non-obvious decision, and what was rejected.
5. Keep `Outline:`. Set `Status:` to written. Tick the first box on its `docs/TOC.md` line:
   `[x] [ ] [ ]`. Rewriting an improved plan clears the second box.
6. **400 lines at most.** If it would pass that, split at a natural seam: the extra part
   becomes a new stub and a new TOC line. Never trim content to fit, and don't ask first.
7. Commit and stop. Improving is the next request, ideally in a new chat.
