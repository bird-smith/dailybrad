---
name: click-by-click
description: Give numbered click-by-click steps when the owner must do something by hand, such as making an account, changing a setting or copying a key.
---

# Steps he does by hand

Dashboards change often. **Check the provider's current docs instead of trusting memory**,
and if unsure of a label say so ("may be called X or Y"). Do everything you can yourself
first. If any step involves a paid plan, card details or a trial that becomes a charge, stop
and ask first.

## Format

```markdown
### Set up <thing> (about N minutes)

1. Go to <exact URL>.
2. Click **<exact button text>**. You should see <what appears>.
3. In the **<field name>** box, type `<value>`.

**When you're done:** tell me "<short phrase>", and I'll <what happens next>.
```

One click or typed value per step. Say what he should see wherever it's easy to go wrong.
Under about 10 steps per batch; then wait.

## Keys and secrets

**Never ask him to paste a secret into chat.** Tell him which line of `.env` to fill in. To
check a value, ask a yes/no question ("does it start with `sb_publishable_`?").

- **Public, safe in the site:** the Supabase project URL and **publishable** key.
- **Secret, never in the site, the repo or chat:** the Supabase **secret** key, the database
  password, any other service's API key.

Add every new variable name to `.env.example`, without its value. Afterwards, check from your
side where you can rather than taking "done" on faith.
