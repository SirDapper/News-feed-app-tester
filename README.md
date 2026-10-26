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

Copy `.env.example` to `.env` and fill in:

- `ANTHROPIC_API_KEY` turns on AI summaries in the worker. `SUMMARY_MODEL` picks the Claude model (default `claude-opus-5-5`; a cheaper model such as `claude-haiku-5-5` works for high volume).
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` let the worker save stories. Create a Supabase project and run `supabase/migrations/0001_init.sql` first.

Without keys, `npm run ingest` prints what it would store.

## Changing which countries belong to which command

Edit the table in `packages/core/src/commands.ts`. It is data, so changes to the Unified Command Plan need no code changes.

## Next steps

1. Connect the web and mobile feeds to Supabase.
2. Cluster items about the same event into one story.
3. Map view with command regions.
4. Push alerts and the social sources (Telegram, Bluesky, Reddit).
