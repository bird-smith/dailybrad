# 2. The workflow: from idea to live feature

The AI is fast and confident, and it will happily build the wrong thing. This workflow keeps
you in charge. You make decisions in plain English, written down in files, before any code
exists. A wrong idea caught in an outline costs one sentence. Caught after building, it costs
a rebuild and a chunk of your free allowance.

```
brainstorm -> outline -> plan stubs -> then for one stub at a time: write -> improve -> build
```

**Each arrow is a separate request from you.** The AI stops at each step and waits.

## The files that make this work

| File | What it is | Who writes it |
|------|------------|---------------|
| `AGENTS.md` | The project's standing rules. The AI reads it at the start of every chat. | You and the AI |
| `CLAUDE.md` | One line pointing at `AGENTS.md`, for when you move to Claude. Leave it alone. | Nobody |
| `.claude/skills/` | Written procedures: how to write an outline, a plan, and so on. | Starts written |
| `docs/ideas.md` | Ideas that aren't ready yet. | You and the AI |
| `docs/outlines/` | One plain-English description per feature. | The AI, reviewed by you |
| `docs/TOC.md` | The roadmap: one line per plan, in order, with three tick boxes. | The AI |
| `docs/plans/` | One detailed plan per roadmap line. | The AI |

**Start a new chat for each step** (the **+** at the top of the Chat panel). A long chat uses
up your allowance faster and the AI gets worse as it fills up. Nothing is lost, because each
step leaves its result in a file for the next chat to read.

## The steps, with what to type

Copy these prompts and change the words in `<brackets>`.

### Step 1: Brainstorm (a conversation, no files)

> Follow `.claude/skills/brainstorm/SKILL.md`. My idea: `<a reading list where...>`

It asks one question at a time. Push back. Say "I'd never bother doing that every day".

**Your coffee tracker skips this step.** A draft outline is already written. Go to step 2.

### Step 2: Outline

After a brainstorm:

> Follow `.claude/skills/outline/SKILL.md` and write up what we just agreed.

For the coffee tracker:

> Follow `.claude/skills/outline/SKILL.md`. Open `docs/outlines/coffee-tracker.md`, ask me its
> "Still to decide" questions one at a time, and update the file with my answers.

**Then read the outline yourself.** This is the most valuable five minutes in the whole
process. Does it describe what you want? Say what's wrong, and repeat until it does. Then:

> The outline looks good. Mark it approved.

### Step 3: Split into plan stubs

> Follow `.claude/skills/split-into-stubs/SKILL.md` for `docs/outlines/coffee-tracker.md`.

You'll get a few short stub files, and new lines in `docs/TOC.md` like this:

```
- [ ] [ ] [ ] 1.1-brew-log: saving brews, with backup
- [ ] [ ] [ ] 1.2-new-brew: the new brew screen
- [ ] [ ] [ ] 1.3-best-recipes: the best recipes screen
```

The three boxes mean **written, improved, built**, and fill from left to right. That file is
your project at a glance: open it any time to see what's done and what's next.

The next three steps repeat for each line, one at a time. Start a new chat for each.

**This is a natural point to hand over to Noah.** The vision is decided, and the next three steps
use the most AI. If he has offered to take some (Part 6 of [the setup walkthrough](1-setup.md)):

1. Tell the AI:

   > Commit anything that isn't committed, and push it.

2. Text Noah which plans he's taking, by their line in `docs/TOC.md`, and which ones are yours.
3. Don't work on a plan he's working on. The boxes in `docs/TOC.md` show how far each one has got.
4. Answer the questions he brings back. Those decisions are still yours.
5. When he's done, pull his changes (Part 6 again), then try the feature on your site.

### Step 4: Write the plan

> Follow `.claude/skills/write-plan/SKILL.md` for `docs/plans/1/1.1-brew-log.md`.

Answer its questions. Boxes become `[x] [ ] [ ]`.

### Step 5: Improve the plan

> Follow `.claude/skills/improve-plan/SKILL.md` for `docs/plans/1/1.1-brew-log.md`.

A new chat looks at the plan with fresh eyes, fixes the obvious, and asks you about the rest.
It really does find problems, because it hasn't talked itself into anything yet. Boxes become
`[x] [x] [ ]`.

### Step 6: Build it

> Follow `.claude/skills/build-plan/SKILL.md` for `docs/plans/1/1.1-brew-log.md`.

It writes the code, runs the checks, publishes the site, and gives you a short list of things
to look at on your phone. Boxes become `[x] [x] [x]`. Open your site, and it's there.

## While the AI is working

- **Read what it asks to run.** It will ask before running commands. `npm run check` and
  `git push` are normal. If you see something deleting files, or anything you don't
  understand, ask "what does this do, in plain words?" before you approve it.
- **Don't turn on auto-approve yet.** Wait until you've seen what normal looks like.
- **It sometimes says "done" when it isn't.** Ask "did you run the check? What did it print?"
- **Never paste a password or secret key into chat.** Put it where the AI tells you to.

## When something goes wrong

- **Something's broken:**

  > Follow `.claude/skills/debug/SKILL.md`. I tapped `<X>` and saw `<Y>`. I expected `<Z>`.

- **It's going in circles:** stop. Start a new chat and describe the problem from scratch. A
  fresh chat often solves in one try what a long one couldn't in ten.
- **You'd like a human to look:** send Noah your repo's link. To let him change things directly,
  see Part 6 of [the setup walkthrough](1-setup.md).
- **A change made it worse:** every commit is saved, so nothing is really lost. Ask:

  > Undo your last commit, using a new commit that reverses it. Don't rewrite history.

- **The live site didn't update:** on GitHub, open your repo's **Actions** tab. A red X means
  publishing failed, and your old site stays up. Paste the error into a new chat with the
  debug prompt above.

## Small changes skip the ladder

A typo, a colour or one button doesn't need a plan. Just ask, then say:

> Run the check, commit it and push.

If you're unsure, ask "does this fit in one small change, or does it need a plan?"

## Teach it as you go

**When the AI makes the same mistake twice, add a line to `AGENTS.md`.** This is how the setup
gets better over time. Mine is hundreds of lines by now, and nearly all of them came from
something going wrong once. Just say:

> Add a short rule to `AGENTS.md`: `<always show grams, never ounces>`.

Keep it short, though. The AI reads that whole file in every chat, so a long one costs you
allowance every time. Long procedures belong in a new skill:

> Make a new skill in `.claude/skills/` for `<how I add a new tracker>`, in the same format as
> the others, and add a line for it to the table in `AGENTS.md`.
