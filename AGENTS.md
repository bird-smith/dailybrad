# Project Instructions

Every AI tool working on this project reads this file first. Switching tools changes nothing
here: this file holds the rules, whichever tool follows them.

## What this is

A personal website, mostly for its owner's own use. Sections, in build order:

1. **Coffee tracker:** log each brew (grind size, scoop size, water, and how it tasted) to
   find the best recipe.
2. **Personal productivity:** reading list, to-do list, other trackers and motivators.

The roadmap is `docs/TOC.md`. Nothing outside a section's own code may assume the site is
only about that section.

## About the owner

- **Not a programmer.** Explain in plain language: what he will see on the site, not what
  the code does. Translate jargon or skip it.
- When there's a choice, **recommend one option and say why**. Don't list ten.
- When he has to do something by hand (make an account, click a setting), give numbered,
  click-by-click steps. See `.claude/skills/click-by-click/SKILL.md`.
- Be critical, not affirming: point out problems, question approaches, flag what's missing.

## Keep AI usage low

He is on a free plan with a limited allowance.

- Do only what the current request asks, then stop.
- Read only the files the request needs. Never read a whole folder "for context".
- Keep replies short. Don't repeat a file's contents back after writing it.
- Run single test files while working, and the full check once at the end.

## Skills: follow them by reading the file

A skill is a written procedure. When a request matches a line here, **open that file and
follow it**, even if your tool has no skills feature. Read only the one you need.

| When he asks to... | Read |
|--------------------|------|
| Talk through a new idea | `.claude/skills/brainstorm/SKILL.md` |
| Write or revise an outline | `.claude/skills/outline/SKILL.md` |
| Split an approved outline into plan stubs | `.claude/skills/split-into-stubs/SKILL.md` |
| Write a plan from a stub | `.claude/skills/write-plan/SKILL.md` |
| Improve or review a plan | `.claude/skills/improve-plan/SKILL.md` |
| Build a plan | `.claude/skills/build-plan/SKILL.md` |
| Fix something broken | `.claude/skills/debug/SKILL.md` |
| Add or change anything in the database | `.claude/skills/database-change/SKILL.md` |
| Do something by hand (accounts, settings) | `.claude/skills/click-by-click/SKILL.md` |

## How work is planned

Top down, in small batches, one step per request:

brainstorm -> outline -> plan stubs -> for one stub at a time: write -> improve -> build

- **Never build unasked.** A planning request ends at the file it asked for: no code, no
  "while I'm here" edits, no running ahead to the next step.
- Each `docs/TOC.md` line has three boxes, ticked left to right: written, improved, built.
- A new chat for each step. The files carry everything the next chat needs.
- A helper (Noah, on his own account) may write, improve or build plans. What the site does
  stays the owner's call: leave those questions in the plan for him, or ask the helper to
  take them to him. Don't decide them for him, and don't start a plan someone else has open.

## Stack

| Piece | Choice | Job |
|-------|--------|-----|
| Pages | React + Vite + TypeScript, Tailwind CSS | The site itself |
| Hosting | GitHub Pages | Publishes `main` automatically (`.github/workflows/deploy.yml`) |
| Saving data | Supabase (online database) | Locked per `.claude/skills/database-change/SKILL.md` |
| Tests | Vitest | Checks rules and sums |

Target cost: $0. **Always ask first** before anything that costs money or anything
destructive (deleting data or accounts, force-pushing, rewriting history).

Known limits:

- GitHub Pages on a free account needs a **public** repo: everyone can read this repo, so
  nothing private goes in any file here. Personal entries are never committed.
- The site is hosted as plain files, so sub-pages use hash addresses (`/#/coffee`).
  Ordinary addresses show "not found" when refreshed on GitHub Pages.
- Browser storage lives on one device, in one browser, and clearing browser data erases
  it. **Any screen that saves data in browser storage needs Export and Import backup
  buttons in the same plan.** Tell him plainly that a phone and a computer won't share data.
- Free Supabase projects pause after a week unused; restore from the dashboard.

## Commands

- `npm run dev`: the site on this computer at http://localhost:5173 (Ctrl+C stops it)
- `npm test`: the Vitest checks
- `npm run check`: type-check, tests and build. Must pass before calling anything done.

## Conventions

- Every screen works at phone width (about 375px) and on desktop. Phone first: he'll log
  coffee on his phone in the kitchen, so big tap targets and as little typing as possible.
- Keep screens elegant and minimal: one main action per screen, room to breathe, and
  nothing on screen that isn't needed right now.
- Rules and sums get a Vitest test. Looks don't: list them for him to eyeball instead.
- React component files `PascalCase.tsx`, other code files `camelCase.ts`, constants
  `SCREAMING_SNAKE_CASE`.

## Secrets

Real keys live only in `.env`, which is never committed. `.env.example` lists names with no
values. Never read `.env`, never ask him to paste a secret into chat, and never put a secret
key in code that runs in the browser. Say which kind a key is when adding one.

## Git

- Small commits with a clear summary line. Stage files by name.
- Pushing `main` publishes the live site. A plan pushes once `npm run check` passes;
  otherwise leave pushing to him unless he asks.
- Someone helping him may also push to `main`. Pull before starting work. If a push is
  refused, pull and try again; never force-push.
