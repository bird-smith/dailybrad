# Optional: GitHub issues and a project board

**Skip this to begin with.** `docs/TOC.md` already shows what's done and what's next, and it
costs nothing to keep up. I run one GitHub issue per plan and a board on my bigger project, with
a lot of plans in flight. For one person building a few trackers, it's mostly extra work and
extra AI usage.

It becomes worth it when you want to jot down bugs and ideas from your phone, away from the
computer. Your repo is public, so issues are public too. Keep private things out of them.

## Set it up (about 10 minutes)

1. Open a terminal in VS Code (**Terminal -> New Terminal**) and install GitHub's command-line tool:
   - **Windows:** `winget install GitHub.cli`
   - **Mac:** see https://cli.github.com
2. Close and reopen VS Code, then run `gh auth login` and accept the suggested answers.
3. On GitHub, click your picture at the top right -> **Your projects** -> **New project**. Choose
   the **Board** layout, name it, and create it.
4. Tell the AI:

   > Add a rule to `AGENTS.md`: every plan gets one GitHub issue, in plain language, added to my
   > project board called `<name>`, with its number in the plan's title and on its `docs/TOC.md`
   > line. When a plan is built, close the issue. Update the skills that create and finish plans
   > to match. Do this for new plans only.

## On your phone

Install the GitHub app. Jot a bug or idea as a new issue while you're making coffee. Then later:

> Read issue `#12` and tell me whether it needs a plan or is a small fix.
