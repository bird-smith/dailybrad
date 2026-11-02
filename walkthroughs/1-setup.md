# 1. Get set up

By the end, your site is live on the internet and you've changed it by asking an AI. Everything
here is free. If a screen doesn't match these steps, look for the closest label: these services
change their screens often. Steps checked 2026-10-31.

## Part 1: Your site, live (10 minutes, all in your browser)

1. Go to https://github.com/signup and create a free account. Your username will be part of your
   site's address, so pick one you like.
2. Go to https://github.com/settings/emails and tick **Keep my email addresses private**. Your
   repo is public, and this keeps your real email address out of it. On that page, **copy the
   address ending in `@users.noreply.github.com`**. You'll need it in Part 3.
3. Go to https://github.com/noahval/site-starter and click the green **Use this template** button,
   then **Create a new repository**.
4. Under **Repository name**, type `my-site`. It's part of your site's address, and you can use
   another name if you like.
5. Leave it **Public**, and click **Create repository**.
6. In your new repo, click **Settings** (top row), then **Pages** (left side).
7. Under **Build and deployment**, set **Source** to **GitHub Actions**.
8. Click **Actions** (top row), click **Publish site** on the left, then click **Run workflow**,
   and **Run workflow** again in the box that opens. If you see a red X from an earlier run, ignore
   it: that one ran before Pages was switched on.
9. Wait about 2 minutes for a green tick.
10. Open `https://YOUR-USERNAME.github.io/my-site/`.

**You should see** a plain page titled "My Site", saying it works. That's a real website. Open it
on your phone too.

## Part 2: Install three programs (15 minutes)

Install each one, accepting the suggested options. You don't need an account for any of them.

1. **VS Code,** where you'll work: https://code.visualstudio.com
2. **Git,** which saves each version of your project: https://git-scm.com/downloads
3. **Node.js,** which runs your site on your computer: https://nodejs.org. Choose the **LTS**
   version.

If VS Code was already open, close and reopen it, so it notices the new programs.

## Part 3: Get your project onto your computer (10 minutes)

1. Open VS Code, and click **Terminal -> New Terminal** in the top menu. A panel opens at the bottom.
2. Paste this, with your own name, and press Enter:

   ```
   git config --global user.name "Your Name"
   ```

3. Paste this, using the `@users.noreply.github.com` address from Part 1, and press Enter:

   ```
   git config --global user.email "your-noreply-address"
   ```

4. Click **Source Control** on the left (the icon like a branching line), then **Clone Repository**,
   then **Clone from GitHub**. Approve the sign-in in your browser.
5. Choose `my-site`. Pick a place for it, like your Documents folder. Click **Open** when asked.
6. If asked whether you trust the folder, say yes.
7. Open a terminal again, in this new window. Paste this and press Enter:

   ```
   npm install
   ```

   It takes a minute or so.
8. Paste this and press Enter:

   ```
   npm run dev
   ```

9. Hold Ctrl (Cmd on a Mac) and click the `http://localhost:5173` link it shows.

**You should see** the same page, running on your own computer. Only you can see this copy, and it
updates as files change. To stop it, click in the terminal and press Ctrl+C.

**On Windows, if `npm` gives a red error about "running scripts is disabled":** paste this, press
Enter, then try again. It lets your own user account run the scripts that npm needs.

```
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

**If `npm` or `git` is "not recognized":** close VS Code completely and reopen it. If that doesn't
help, restart your computer.

## Part 4: Switch on the AI (5 minutes)

1. Look at the bar along the bottom of VS Code. Hover over the Copilot icon, and select **Use AI
   Features**. (Or click the person icon at the bottom left, and sign in with GitHub to use Copilot.)
2. Sign in with your GitHub account. If you don't have a Copilot plan, this signs you up for the
   **free** plan. Don't enter a card: if you're asked for one, you're on the wrong screen.
3. Press **Ctrl+Alt+I** (**Ctrl+Cmd+I** on a Mac) to open the **Chat** panel.
4. Click **+** to start a new chat. Check the small selectors in the box where you type:
   - **Agent:** `Agent` (this lets it edit files and run commands)
   - **Language model:** `Auto`
   - **Permissions:** `Manual permissions` (it asks before doing anything risky)

   If you're offered a choice of where it runs, choose **Copilot**.

Now do the opt-out in `3-free-ai-and-limits.md`, under "Worth doing". It takes a minute.

## Part 5: Your first change (5 minutes)

This tests the whole chain: the AI reads your rules, changes your site, and publishes it.

1. Paste this into the chat, with your own title:

   > Read `AGENTS.md`. Then tell me in one sentence what this project is. Then change the title
   > on the home page to `<Sam's Corner>`, run the check, commit it and push.

2. It should describe a personal site with a coffee tracker. **If it doesn't, stop here:** it
   hasn't read your rules. Look in the Chat panel for a mention of `AGENTS.md`, and check that you
   opened the `my-site` folder and not a folder around it.
3. It will ask to run some commands, like `npm run check`, `git commit` and `git push`. Read each
   one, and allow it.
4. Wait 2 minutes, then refresh your site's address. If your browser still shows the old title,
   refresh again.

**You should see** your new title on the live site, on your phone too.

That's the whole loop. From here on, you work this way, just with more planning up front.

## Part 6, optional: Let Noah help (2 minutes)

**The offer:** you set the vision, and Noah can do some of the heavy lifting.

- **You do the light part:** brainstorm, outline and plan stubs. This is where you decide what
  you want, it's the part that should be yours anyway, and it uses very little free allowance.
- **Noah can do the heavy part:** writing, improving and building plans uses the most AI by far.
  He can run some of those on his paid Claude account, so your free allowance lasts longer.
- **It stays your site.** He brings the questions that need a decision back to you.

He's also happy to take a look when you're stuck.

Noah's GitHub username is `noahval`. Because your repo is public, he can already read your code
and plans: to get his opinion, just send him your repo's link. To let him **change things**
directly, invite him. You can do this now, or the day you need it.

1. On GitHub, open your `my-site` repo and click **Settings** (top row).
2. On the left, under **Access**, click **Collaborators**. GitHub may ask for your password.
3. Click **Add people**.
4. Type `noahval`, choose him from the list, and confirm.
5. Text Noah to say the invitation is on its way. He has to accept it before he has access.

**What this gives him:** he can change your project's files and publish your site, from his own
computer. **What it doesn't:** he can't see your computer, your coffee entries in your browser, your
`.env` file, or your accounts.

**After he has changed something,** get his changes before you carry on. In VS Code, click **Source
Control** on the left, then **Sync Changes** (if it isn't showing, click the **...** menu at the top
of that panel, then **Pull**). Or tell the AI to do it, in plain words: "pull the latest changes".

**To end his access,** go back to the same **Collaborators** page and remove him. He can be added
again whenever you like.

## What's next

Read [the workflow](2-the-workflow.md). Your first real prompt is in step 2 of it: the AI asks about
your coffee setup, and fills in the draft outline.

## Prefer a zip instead?

Download it from https://github.com/noahval/site-starter/releases/latest/download/site-starter.zip

Use this in place of Part 1 steps 3-5 and Part 3 steps 4-6. Do Part 2 first, then Part 3 steps 1-3.

1. Unzip it somewhere like your Documents folder, into a folder named `my-site`.
2. In VS Code, click **File -> Open Folder**, and choose `my-site`.
3. Click **Source Control** on the left, then **Initialize Repository**. Type `Starter kit` in the
   message box, and click **Commit**. If asked to stage all your changes, say **Yes**.
4. Click **Publish Branch**, and choose **public repository**.
5. On GitHub, open your new repo, then do Part 1 steps 6-10.
6. Carry on from Part 3 step 7.
