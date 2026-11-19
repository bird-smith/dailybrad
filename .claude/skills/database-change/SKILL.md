---
name: database-change
description: Add or change database tables and access rules in Supabase. Use for any plan that stores data in the database rather than the browser.
---

# Database changes (Supabase)

**The browser can't be trusted. This site's code is public and anyone can open it, so the
database's own access rules are the only real wall.** Checks in the site are a convenience.

1. **Every change is a numbered SQL file in the repo:**
   `supabase/migrations/<number>-<name>.sql`. Never edit one that's already been run: write a
   new one. No click-only table changes.
2. **Every table is locked in the same file that creates it:**

   ```sql
   alter table brews enable row level security;
   create policy "own brews only" on brews
     for all to authenticated
     using (user_id = auth.uid())
     with check (user_id = auth.uid());
   ```

   No policy means nobody can do it, which is the safe default. Nothing for signed-out
   visitors, unless he says so in plain words.
3. **Run it with `npm run migrate`:** it runs files not run yet, each all-or-nothing, and
   records them in `private.migrations_run`. `npm run migrate -- --list` shows what's
   waiting. It refuses files that drop tables or columns, delete rows or truncate: ask the
   owner first, then rerun with `--allow-destructive`. It needs `SUPABASE_DB_URL` (a
   **secret** key) in `.env`. If that's missing on this computer, fall back to
   click-by-click steps to paste the file into the Supabase **SQL Editor**, click **Run**,
   then record it by running `npm run migrate -- --record-only` once a key is available.
   Plans that say "hand batch A: run the migration in SQL Editor" mean this step.
4. **Prove the wall:** before calling it done, try reading the table while signed out, with
   the public key, and show that nothing comes back.
5. **Keys:** the site uses only the project URL and the **publishable** key, in `.env` and in
   the GitHub Actions variables that the publish step reads. `SUPABASE_DB_URL` is used only
   by `npm run migrate` on this computer: never give it a `VITE_` name, never put it in
   GitHub, never read or print it.
6. **Limits:** free projects pause after a week of no use: tell him how to restore one. Keep
   an Export button on the site as his own backup.
