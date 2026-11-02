# 4. Moving to Claude Pro, when you're ready

**This costs money, so it's your call.** Nothing in this project needs it. As of 2026-10-31, Pro
is $20 a month, or $17 a month billed yearly ($200 up front). Check https://claude.com/pricing.
The free Claude plan doesn't include Claude Code, the part that edits your project.

## When it's worth it

Consider it when **any** of these has been true for a couple of months:

- You run out of free allowance on both tools with plans still waiting.
- You're spending more time fixing the AI's mistakes than deciding what you want.
- The site has grown, and the free tools keep losing track of how it fits together.

Try one month, billed monthly, before you commit to a year. Pro has usage limits of its own, but
expect far more room and stronger models.

## The switch (about 5 minutes)

Your project is already set up for this: `CLAUDE.md` loads your `AGENTS.md`, and your skills
are in the folder Claude Code looks in.

1. Go to https://claude.com/pricing and sign up for **Pro**.
2. In VS Code, click the **Extensions** icon on the left (or press Ctrl+Shift+X, Cmd+Shift+X on a
   Mac).
3. Search for `Claude Code`, and click **Install** on the one by Anthropic.
4. Open your project folder if it isn't already open.
5. Click **Claude Code** in the bar at the bottom right of VS Code (or the spark icon at the top
   right of an open file).
6. Click **Sign in** and approve it in your browser.
7. Send this as your first message:

   > What are this project's rules about pushing to main? Answer in one sentence, then tell me
   > which skills you can see.

   It should describe the rule from `AGENTS.md` and list your skills, like `outline` and
   `build-plan`. If it can't, type `/context` and look under **Memory files** for your files.
8. Say:

   > I've moved to Claude Pro. In `AGENTS.md`, replace the "Keep AI usage low" section with a
   > shorter note that I'm on Pro, and commit it.

## What changes in your daily work

- **Shorter prompts.** Type `/outline`, `/write-plan docs/plans/1/1.2-new-brew.md` or
  `/build-plan ...`. Claude can also pick the right skill on its own when your request fits.
- **Same workflow, same files, same roadmap.** Keep starting a new chat for each step.
- **Permissions.** The mode shown under the prompt box controls how often it asks you first.
  Start on **Manual**, and loosen it once you trust what you're seeing. Your project's
  `.claude/settings.json` already stops it from opening your `.env` secrets file.
- **Copilot can stay.** Its free plan costs nothing. Its inline suggestions don't get in the way,
  and you can turn them off from the Copilot icon at the bottom of VS Code.

## Later, once you've got the hang of it

Things I use on my own project that aren't worth setting up yet:

- **Hooks:** for example, a sound when Claude finishes, so you can go and do something else.
- **Helper agents:** Claude hands long, noisy jobs to a helper, which saves your usage.
- **More tests:** tests that drive a real browser through your main screens.
