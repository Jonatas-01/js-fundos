# J&S Fundos

A shared savings tracker for two people with separate bank accounts.

You each log a deposit after moving money in your own bank. The app keeps the
combined total, who put in what and when, a growth chart, and progress toward a
goal you set together — so neither of you has to open a banking app and do
mental arithmetic.

It is a **shared ledger, not a bank integration.** Its accuracy depends on both
of you logging transfers.
z1XIFKqBqbkIBFJu
## Setup

### 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**. Any region near
   you; the free tier is enough.
2. Open **SQL Editor** → paste the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → **Run**.
   This creates the tables, the row-level security policies, and seeds the single
   fund row.
3. Open **Project Settings → API** and copy the **Project URL** and the
   **anon / public** key.

### 2. Point the app at it

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the
two values you just copied. Leave `NEXT_PUBLIC_SITE_URL` as
`http://localhost:3000` for now.

### 3. Run it

```bash
npm run dev
```

Open <http://localhost:3000>, enter your email, and click the link Supabase
sends you.

### 4. Lock it to the two of you

Once **both** of you have signed in once, go to
**Supabase → Authentication → Providers → Email** and turn off
**"Allow new users to sign up"**. That is the whole access-control story: the
RLS policies let any signed-up account read the fund, so sign-up is the gate.

### 5. Deploy

1. Push this folder to a GitHub repo.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the three environment variables in Vercel, with `NEXT_PUBLIC_SITE_URL`
   set to your real URL (e.g. `https://house-fund.vercel.app`).
4. In **Supabase → Authentication → URL Configuration**, set the **Site URL** to
   that same URL and add `https://your-app.vercel.app/auth/callback` to
   **Redirect URLs** — otherwise magic links bounce back to localhost.

## How it works

| Piece | Where |
| --- | --- |
| Schema, RLS policies, seed | `supabase/migrations/0001_init.sql` |
| Money parsing & formatting | `lib/money.ts` — the only place cents convert |
| All writes | `app/actions.ts` (server actions) |
| Dashboard data loading | `app/page.tsx` |
| Session refresh | `proxy.ts` |

**Money is stored as integer cents**, never floats. Amounts are parsed and
displayed using the fund's locale, so `1.234,56` and `1,234.56` both work
depending on the format you pick in Settings.

**Each of you can edit or delete only your own deposits.** The UI hides the
controls on the other person's rows; the RLS policies are what actually enforce
it.

**Deposits can be back-dated.** The date field defaults to today but accepts any
past date, so forgetting to log a transfer for a few days doesn't distort the
chart. Future dates are rejected.

## Not included (yet)

- **Withdrawals.** If you take money out, there is no way to record it — you'd
  have to edit or delete a deposit, which loses history. Add this the first time
  it happens.
- **Edit history.** An edited amount overwrites the old one with no audit trail.
- **Reconciliation.** Nothing checks the app's total against your real accounts.
  Worth comparing by hand once a month.
