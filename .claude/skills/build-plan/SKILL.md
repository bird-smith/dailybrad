---
name: build-plan
description: Build one improved plan from docs/plans/, verify it, and publish. Use when asked to build or implement a named plan.
---

# Build a plan

1. **Read the plan critically first.** Raise concerns before starting. Stop and ask if it's
   unclear, depends on something missing, or would cost money or need a new account.
2. **Work in small steps.** For rules and sums, write the failing test first, see it fail,
   then write just enough to pass. Run only the test file you touched. Commit after each
   step, with a clear message.
3. **Stay in scope.** Noticed something else? Mention it; don't do it.
4. **Verify. Evidence before claims.** Run `npm run check` and read the output. Never say
   "should work" or "probably": if you didn't run it, say so. If the same fix fails three
   times, stop and follow `.claude/skills/debug/SKILL.md`.
5. **Hand over to him,** in plain language:
   - How to try it: what to open, tap and type, and what should happen, on a phone and on
     a computer.
   - An **eyeball list:** 3-6 short lines, "open X, you should see Y", for what tests
     don't catch (spacing, text running off the screen, wording).
6. **Close out, once the check passes:**
   - The plan's `Status:` -> built, with the date; its `Done when` boxes ticked.
   - Third box on its `docs/TOC.md` line: `[x] [x] [x]`.
   - Commit, then push `main`. That publishes the site. Never force-push.
   - Anything he spots later is a new small fix, not a reopened plan.
