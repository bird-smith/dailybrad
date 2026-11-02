# Optional: your own web address, from Porkbun

**This costs money, roughly $10-15 US a year** for a `.com` or `.ca`, renewing automatically.
Your site works fine without it, at `yourname.github.io/my-site/`. Buy one when you're sure
you'll keep using the site. Registrars change their screens, so labels may differ slightly.

## Part 1: Buy the domain (5 minutes)

1. Go to https://porkbun.com and search for the name you want.
2. Add it to your cart. Skip any extras: you don't need email or hosting. Check the
   **renewal** price as well as the first year's, as it's sometimes higher.
3. Create an account, turn on two-factor login, and pay.

## Part 2: Prove it's yours to GitHub (5 minutes)

This stops anyone else from pointing their GitHub site at your domain.

1. On GitHub, click your picture at the top right -> **Settings** -> **Pages** on the left
   (these are your *account* settings, not the repo's).
2. Click **Add a domain**, type your domain, and click **Add domain**. GitHub shows you a `TXT`
   record: a name and a value.
3. On Porkbun, go to **Domain Management**, find your domain, and open **DNS**.
4. Add a record: type `TXT`, with the name and value GitHub showed you.
5. Back on GitHub, click **Verify**. It can take a while to work: try again later if it fails.

## Part 3: Point the domain at your site (10 minutes)

1. Still in Porkbun's **DNS**, delete any existing `A`, `ALIAS` or `CNAME` records that came
   with the domain (they point at a Porkbun parking page). Leave anything else alone.
2. Add four `A` records. Leave the host/name box empty, and use these answers, one per record:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
3. Add one `CNAME` record: host `www`, answer `yourname.github.io` (your GitHub username, and
   no repo name).
4. On GitHub, open your **repo's** **Settings** -> **Pages**.
5. Under **Custom domain**, type your domain and click **Save**.
6. When it's available, tick **Enforce HTTPS**. That can take up to 24 hours.

**You should see** your site at your new address. New addresses can take up to a day to work
everywhere, so if it fails at first, try again later.
