import type { CommandId } from "./commands.ts";
import type { Story, TrustTier } from "./types.ts";

// Reads the story feed from Supabase's REST API with plain fetch, so the web
// app, the mobile app and tests share one query and neither app needs the
// Supabase client library (which needs polyfills on React Native).

export interface FeedConfig {
  /** The project URL, e.g. https://abcd1234.supabase.co */
  url: string;
  /** The publishable (or legacy anon) key. Safe to ship in the apps: row level security makes the tables read-only. */
  key: string;
}

export const FEED_LIMIT = 50;

const SELECT = [
  "id",
  "title",
  "summary",
  "primary_command",
  "countries",
  "severity",
  "updated_at",
  "story_commands(command_id)",
  "items(url,source_id,sources(name,trust))",
].join(",");

interface StoryRow {
  id: string;
  title: string;
  summary: string;
  primary_command: CommandId;
  countries: string[] | null;
  severity: number;
  updated_at: string;
  story_commands: { command_id: CommandId }[] | null;
  items: { url: string; source_id: string; sources: { name: string; trust: TrustTier } | null }[] | null;
}

export function feedRequestUrl(config: FeedConfig, command?: CommandId): string {
  const params = new URLSearchParams();
  // `cmd` is a second, inner-joined copy of story_commands used only to filter
  // by command; the plain story_commands embed still lists every command a
  // story is filed under.
  params.set("select", command ? `${SELECT},cmd:story_commands!inner(command_id)` : SELECT);
  if (command) params.set("cmd.command_id", `eq.${command}`);
  params.set("order", "updated_at.desc");
  params.set("limit", String(FEED_LIMIT));
  return `${config.url.replace(/\/+$/, "")}/rest/v1/stories?${params}`;
}

export function rowToStory(row: StoryRow): Story {
  const commands = (row.story_commands ?? []).map((c) => c.command_id);
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    primaryCommand: row.primary_command,
    commands: commands.length > 0 ? commands : [row.primary_command],
    countries: row.countries ?? [],
    severity: Math.min(5, Math.max(1, row.severity)) as Story["severity"],
    updatedAt: new Date(row.updated_at).toISOString(),
    sources: (row.items ?? []).map((i) => ({
      name: i.sources?.name ?? i.source_id,
      url: i.url,
      trust: i.sources?.trust ?? "outlet",
    })),
  };
}

/** Newest stories first, optionally only those filed under one command. */
export async function fetchStories(config: FeedConfig, command?: CommandId): Promise<Story[]> {
  const headers: Record<string, string> = { apikey: config.key };
  // Legacy anon keys are JWTs and go in Authorization too; the newer
  // sb_publishable_ keys are not JWTs and must only be sent as apikey.
  if (config.key.startsWith("eyJ")) headers.authorization = `Bearer ${config.key}`;

  const res = await fetch(feedRequestUrl(config, command), { headers });
  if (!res.ok) throw new Error(`Supabase feed: HTTP ${res.status} ${await res.text()}`);
  const rows = (await res.json()) as StoryRow[];
  return rows.map(rowToStory);
}
