# Optional: a database, so your phone and computer share data

**You may not need this.** To begin with, the site saves to the browser on each device, with a
backup button. It's simple, private and needs no account. The catch: your phone's log and your
computer's log are separate, and clearing your browser's data erases them unless you've made a
backup.

Add a database when you find you actually want the same data on two devices.

## What you'd use: Supabase

It's what my own project uses. The free plan allows 2 active projects with 500 MB each, far
more than a coffee log will ever need.

**The catch:** a free project goes to sleep after a week of no use. If you log coffee every day,
that won't happen. If it does, you can wake it up from the Supabase dashboard.

## Why this one needs care

Your site's code is public. Without a lock on the database, anyone could read your entries. So
the plan must include the database's own access rules, and proof that they work.
`.claude/skills/database-change/SKILL.md` tells the AI to do both. If it ever suggests skipping
this "for now", say no.

## Set it up (about 10 minutes)

Labels may have moved a little.

1. Go to https://supabase.com and click **Start your project**. Sign in with GitHub.
2. Click **New project**. Name it, and choose the region closest to you.
3. For the database password, use **Generate a password** and save it in a password manager. It's
   a **secret**: it never goes in chat or the repo.
4. Make sure you're on the **Free** plan, then create the project.
5. In a new chat in VS Code, say:

   > I've created a Supabase project. Follow `.claude/skills/outline/SKILL.md` and outline moving
   > my data to it. I'm the only user, so I want to sign in with an email and password, with
   > new sign-ups turned off. Existing entries should come across from my backup file.

From there it's the normal workflow: outline, stubs, write, improve, build. The AI gives you
click-by-click steps for the remaining dashboard parts.

## Keys: which is which

| Thing | Kind | Where it goes |
|-------|------|---------------|
| Project URL | Public | `.env` and GitHub Actions variables |
| **Publishable** key | Public, made for browsers | `.env` and GitHub Actions variables |
| **Secret** key | Secret, full access | Nowhere. This site doesn't need it. |
| Database password | Secret | Your password manager |
