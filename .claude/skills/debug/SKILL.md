---
name: debug
description: Find the real cause of a bug or error before changing anything. Use when something is broken, an error appears, or a check fails.
---

# Debug

**No fixes until you know the cause.** Guessing burns the allowance and hides the real bug.

1. **Investigate:** read the whole error. Reproduce it. Ask what changed recently. If he
   describes a problem, ask for the exact wording, or what he tapped and what he saw.
2. **Compare:** find similar code that works. What's different?
3. **Test one idea:** state your theory in a sentence. Change one thing and see.
4. **Fix:** for a rule or sum, write a failing test first. Make one fix at the cause, then
   run `npm run check`.

**If three attempts fail, stop.** Tell him plainly what you tried and learned. The design may
be wrong, or a new chat may do better than more patches.

Tell him in plain words what went wrong and what he'll see now.
