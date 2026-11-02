---
name: improve-plan
description: Review a written plan for mistakes, gaps and overbuilding, fix the obvious, and ask about the rest in plain language. Use when asked to improve or review a plan.
---

# Improve a plan

A fresh look before building. A mistake found here costs one sentence; found after building,
it costs a rebuild. Use a new chat, so you see only what the plan actually says.

## Plain language rule

He doesn't code. Think in technical terms, but translate everything you write to him. Say
"if you refresh mid-entry, what you typed disappears", not "form state isn't persisted".
Every finding says what he'd notice or what work gets wasted. A few sentences each.

## Check

Read the plan, the outline sections it names, and the code it touches.

- **Correct:** does it fit the stack and how the site is really built? If unsure how a tool
  works today, look it up rather than trusting memory.
- **Complete:** vague steps ("handle errors"), unstated assumptions, missing tests, first-use
  and empty screens, bad input.
- **Phone:** works at 375px, main thing visible without scrolling, big tap targets.
- **Data:** can he lose it? Backup buttons? Does anything private reach the public repo?
- **Fits the outline:** anything contradicting it, or drifting beyond the stub's scope?
- **Too much:** features nobody asked for, things a simpler approach would do. Look hardest
  here. Less to build means less to break and less of the allowance used.
- **Done when:** can every item be checked the day it's built?

## Sort every finding

- **Fix it yourself** only if there is exactly one right answer and it doesn't change what
  gets built: a wrong path, a broken reference, a contradiction with `AGENTS.md`.
- **Ask him** if there's any real choice. When in doubt, ask.

## Report

1. **Verdict:** ready / needs work / major problems, and the top three items.
2. **Already fixed:** one line each.
3. **Must decide before building,** then **Worth considering,** then **Could be simpler.**

Omit empty sections. **End each item with the option you'd pick and why,** then ask.

## Finish

Apply his answers. When nothing is open, set `Status:` to `improved, not built`, tick the
second box on its `docs/TOC.md` line (`[x] [x] [ ]`), commit, and stop.
