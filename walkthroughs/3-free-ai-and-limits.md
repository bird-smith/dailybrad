# 3. Free AI: what to use and what to do when it runs out

Checked 2026-10-31. **Free plans change often**, and Google's changed completely in June 2026.
If something here doesn't match what you see, believe what you see.

## The plan

| Order | Tool | Why |
|-------|------|-----|
| **1. Start here** | GitHub Copilot Free | It's inside VS Code and uses your GitHub account. Nothing else to sign up for. |
| **2. When that runs out** | Google Antigravity | Free, and its allowance refreshes weekly. It's a separate editor that works like VS Code. |
| **3. For talking, any time** | Free Claude, ChatGPT or Gemini on the web | Doesn't touch either allowance. Good for brainstorms and outlines. |
| **4. When volume demands it** | Claude Pro | See `4-moving-to-claude-pro.md`. |

**Be ready for the limit.** GitHub describes the free plan as "limited chat and agent usage"
and doesn't publish the size of the allowance. Building a feature uses far more than asking a
question, so you may well hit the limit in your first month. That's expected, not a failure.

Nothing here is locked to one tool. All your rules and plans are ordinary files in your
project, so switching tools loses nothing.

## GitHub Copilot Free

- **Cost:** $0.
- **Includes:** the Chat panel, including the agent that can edit files and run commands, plus
  2,000 inline code suggestions a month. It picks the AI model for you ("auto").
- **Watch your usage:** click the Copilot icon in the bar at the bottom of VS Code. It shows
  the percentage of your monthly allowance used.
- **When it runs out:** chat stops until it resets, at the start of the 1st of the month (UTC).
  VS Code will offer you a paid upgrade. **You don't need to take it.**
- **Skills:** GitHub's plan page suggests some skill features may not be included on Free.
  That's fine. Your prompts say "follow this file", which works in every tool.

**Worth doing (1 minute):** press reports say GitHub trains its AI on Free users' Copilot
chats unless you opt out. Go to https://github.com/settings/copilot/features, look under
**Privacy**, and turn off the setting about using your data for AI model training. The wording
may differ. Your repo is public anyway, but your chats aren't.

## Make the allowance last

In rough order of how much they help:

1. **Hand the heavy steps to Noah.** You outline and write the stubs; he can write, improve and
   build some of the plans on his paid account. See Part 6 of `1-setup.md`.

2. **Do the talking on a free web chat.** Brainstorms and outlines need no agent. Open
   https://claude.ai (or ChatGPT, or Gemini) and paste in the contents of
   `.claude/skills/brainstorm/SKILL.md` or `.claude/skills/outline/SKILL.md`, then describe your
   idea. Paste the finished outline into `docs/outlines/<name>.md` yourself.
3. **A new chat for every step.** Long chats cost much more.
4. **Stick to small plans.** Smaller plans fail less, and failing is what really burns usage.
5. **Name the file.** "Follow `.claude/skills/build-plan/SKILL.md` for `docs/plans/1/1.1-brew-log.md`"
   beats "continue the coffee thing", which sends the AI searching.
6. **Do small edits yourself.** Changing a word in a file needs no AI: click the file, type,
   save.
7. **Note your usage for the first few steps.** After each step, write down the percentage. In
   a week you'll know what a plan really costs you. I can't tell you, as nobody publishes it.

## Google Antigravity, for when Copilot runs out

1. Go to https://antigravity.google and download it.
2. Install it, and sign in with a Google account. When it offers to import your VS Code settings,
   say yes.
3. **File -> Open Folder**, and pick your project folder. It's the same folder, with the same files.
4. Start each chat the same way, but begin with this line, just to be sure:

   > Read `AGENTS.md` first and follow its rules.

Google's plans page promises "a meaningful quota, refreshed weekly" and gives no number. It's
also new, so features may move around. Google's older free tools (Gemini Code Assist and Gemini
CLI with a personal Google login) stopped working in June 2026, so ignore any article
recommending them.

**One tool at a time.** Don't let two AI tools work on the project at once: finish and commit in
one before you open the other.

## Options I'd skip for now

- **OpenAI Codex:** included in ChatGPT Free, but OpenAI lists the IDE extension under paid plans
  and doesn't publish Free limits. It's worth a look if both of the above let you down.
- **"Bring your own key" tools (Cline and others):** the tool is free, but you pay for the AI, or
  juggle free services with changing limits. It's more setup than it's worth while you're learning.
- **Cursor, Windsurf and similar:** fine products, but they add another account and another
  free trial, for little gain here.
