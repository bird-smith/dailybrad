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
3. **He runs the file:** give him click-by-click steps to paste it into the Supabase
   dashboard's **SQL Editor** and click **Run**. Say what it should report.
4. **Prove the wall:** before calling it done, try reading the table while signed out, with
   the public key, and show that nothing comes back.
5. **Keys:** the site uses only the project URL and the **publishable** key, in `.env` and in
   the GitHub Actions variables that the publish step reads. The secret key never appears.
6. **Limits:** free projects pause after a week of no use: tell him how to restore one. Keep
   an Export button on the site as his own backup.
