# Connecting real news

This guide takes about 30 minutes and needs no coding. At the end, a job on
GitHub fetches the news every 15 minutes, Claude writes a short summary of each
story, the stories are saved in your Supabase database, and the website and
phone app show them.

Everything here is free except the AI summaries, which are optional. Supabase,
GitHub Actions (free for public repositories) and Vercel all have free plans
that are enough for this app. If you skip Part 2, stories show the outlet's own
short description instead of a Claude summary, and you can add the key later.

You will create up to two accounts and copy up to four values out of them:

| Value | Where it comes from | Secret? |
| --- | --- | --- |
| `SUPABASE_URL` | Supabase | No |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase | No, it is built into the apps |
| `SUPABASE_SECRET_KEY` | Supabase | **Yes** |
| `ANTHROPIC_API_KEY` (optional, paid) | Anthropic | **Yes** |

**Never paste the two secret keys into a chat, an email, an issue, or a file in
the repository.** They only go into the places this guide names. If one is ever
exposed, delete it where you created it and make a new one.

Keep a private note (a password manager is best) open while you work, so you
have somewhere to hold the values for a few minutes.

---

## Part 1: Create the database (Supabase)

1. Go to <https://supabase.com> and click **Start your project**. Sign in with
   GitHub, which is the quickest.
2. Click **New project**.
   - **Name:** `combatant-news` (anything works).
   - **Database password:** click **Generate a password** and save it in your
     password manager. You will rarely need it, but it cannot be shown again.
   - **Region:** pick the one closest to you, for example *East US*.
   - The free plan is enough to start.
3. Click **Create new project** and wait a minute or two while it sets up.
4. Create the tables. In the left sidebar open **SQL Editor**, then:
   1. Open [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
      on GitHub, click the **Copy raw file** button (two overlapping squares,
      top right of the file), paste it into the SQL Editor and click **Run**.
      You should see *Success. No rows returned*.
   2. Click **+** for a new query and do the same with
      [`supabase/migrations/0002_item_sources.sql`](supabase/migrations/0002_item_sources.sql).
5. Copy the three Supabase values into your private note:
   - Click the **Connect** button at the top of the project page (or open
     **Project Settings > Data API**). Copy the **Project URL**, which looks
     like `https://abcdefgh.supabase.co`. That is `SUPABASE_URL`.
   - Open **Project Settings > API Keys**.
     - The **Publishable key** starts with `sb_publishable_`. That is
       `SUPABASE_PUBLISHABLE_KEY`.
     - Under **Secret keys**, click the eye icon (or **Create new secret key**
       if there is none) and copy the key that starts with `sb_secret_`. That is
       `SUPABASE_SECRET_KEY`.
   - If your project only shows the older **anon** and **service_role** keys,
     use **anon** as the publishable key and **service_role** as the secret key.
     Both kinds work.

## Part 2 (optional, paid): Turn on AI summaries (Anthropic)

Skip this part to keep everything free. The Anthropic API is pay-as-you-go,
with no free plan.

1. Go to <https://console.anthropic.com> and sign up.
2. Open **Billing** (under Settings), add a payment method and buy a small
   amount of credit, for example $10. Then open **Limits** and set a monthly
   spend limit you are comfortable with, so there are no surprises. The app
   uses Claude Haiku, the cheapest model, for summaries.
3. Open **API Keys** and click **Create Key**. Name it `combatant-news`.
4. Copy the key (it starts with `sk-ant-`) into your private note right away.
   It is only shown once. That is `ANTHROPIC_API_KEY`.

## Part 3: Let GitHub fetch the news

The repository has a job called **Fetch news** that runs every 15 minutes. It
needs three of the values, stored as GitHub *secrets*: GitHub keeps them
encrypted and never shows them again, not even to you.

1. Open the repository on GitHub and click **Settings** (top bar, far right).
2. In the left sidebar choose **Secrets and variables > Actions**.
3. Click **New repository secret** once for each of these. The name must
   match exactly; the value is what you copied.
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   - `ANTHROPIC_API_KEY` (only if you did Part 2)
4. Once this change is merged, open the **Actions** tab, click **Fetch news**
   in the left list, then **Run workflow > Run workflow** to start the first
   run instead of waiting 15 minutes. It takes about a minute; a green tick
   means it worked.
5. Check the result in Supabase: **Table Editor > stories** should now have
   rows.

To pause fetching at any time: **Actions > Fetch news > ... (top right) >
Disable workflow**.

## Part 4: See it on the website

The easiest way is to put the website online with Vercel (free for personal
projects):

1. Go to <https://vercel.com>, sign up with GitHub.
2. Click **Add New... > Project** and import `News-feed-app-tester`.
3. Next to **Root Directory** click **Edit** and choose `apps/web`.
4. Open **Environment Variables** and add two (these are not secret):
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
5. Click **Deploy**. When it finishes, Vercel gives you a web address. New
   stories show up within a few minutes of each fetch.

## Optional: run everything on your own computer

If you run the apps locally (`npm run dev:web`, `npm run dev:mobile`), they
read their keys from a file named `.env` in the main folder of the repository:

1. Make a copy of `.env.example` in the same folder and name it `.env`.
2. Open `.env` in a text editor and paste each value after its `=` sign, with
   no spaces or quotes. Save it.

`.env` is listed in `.gitignore`, so git never uploads it. The website and
phone app only need the two non-secret values; the secret ones are only needed
if you run `npm run ingest` yourself.

## If something goes wrong

- **The Fetch news run is red:** click into it and open the **ingest** step.
  `Invalid API key` means a secret was pasted wrong; edit it under
  **Settings > Secrets and variables > Actions**. `relation "stories" does not
  exist` means Part 1 step 4 was skipped.
- **The website still shows "Sample:" stories:** the two environment variables
  are missing in Vercel (or in `.env`). After adding them in Vercel, redeploy
  from the **Deployments** tab.
- **The website shows no stories:** the fetch job has not saved any yet; check
  Part 3 step 5.
