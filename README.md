# Combatant News

World military and sociopolitical news, organized by US combatant command, for web, iOS and Android.

Plan: https://claude.ai/artifact/2fMbqcge9RKzY4krYoL4Hg

## Layout

| Path | What it is |
| --- | --- |
| `packages/core` | Shared TypeScript: the combatant commands, the country-to-command table, the geotagger, and shared types |
| `apps/worker` | Ingestion job: fetches feeds, files each item under its commands, summarizes with Claude, saves to Supabase |
| `apps/web` | Next.js website |
| `apps/mobile` | Expo app for iOS and Android |
| `supabase/migrations` | Database schema |

## Getting started

Requires Node 22 or later.

```bash
npm install
npm test            # core tests
npm run dev:web     # http://localhost:3000
npm run dev:mobile  # Expo dev server; scan the QR code with Expo Go
npm run ingest      # one worker pass (dry run without keys)
```

The web and mobile apps show sample stories until the database is connected.

## Configuration

**Step-by-step setup for the database, AI summaries and the website: [SETUP.md](SETUP.md).**

All keys go in one `.env` file at the repository root (copy `.env.example`); the web app, mobile app and worker all read it.

- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` let the web and mobile apps read stories. The publishable key is public; row level security makes the tables read-only to it.
- `SUPABASE_SECRET_KEY` lets the worker save stories. Run the files in `supabase/migrations` in order first.
- `ANTHROPIC_API_KEY` turns on AI summaries in the worker. `SUMMARY_MODEL` picks the Claude model (`claude-haiku-5-5` in `.env.example` and the scheduled job; a stronger model gives better summaries at higher cost).

Without keys, `npm run ingest` prints what it would store.

The worker runs every 15 minutes on GitHub Actions (`.github/workflows/ingest.yml`), with its keys stored as repository secrets.

## Changing which countries belong to which command

Edit the table in `packages/core/src/commands.ts`. It is data, so changes to the Unified Command Plan need no code changes.

## Next steps

1. Cluster items about the same event into one story.
2. Map view with command regions.
3. Push alerts and the social sources (Telegram, Bluesky, Reddit).
