import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Item } from "@newsapp/core";
import type { CommandAssignment } from "@newsapp/core";

export interface StoryDraft {
  item: Item;
  assignment: CommandAssignment;
  summary: string | null;
}

let client: SupabaseClient | undefined;

function db(): SupabaseClient | undefined {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return undefined;
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function hasDatabase(): boolean {
  return db() !== undefined;
}

/** URLs already stored, so the worker skips them. */
export async function knownUrls(urls: string[]): Promise<Set<string>> {
  const supabase = db();
  if (!supabase || urls.length === 0) return new Set();
  const { data, error } = await supabase.from("items").select("url").in("url", urls);
  if (error) throw error;
  return new Set(data.map((r) => r.url as string));
}

/**
 * Saves one item as its own story. Clustering several items into one story
 * is the next step in the pipeline and will replace this one-to-one mapping.
 */
export async function saveStory({ item, assignment, summary }: StoryDraft): Promise<void> {
  const supabase = db();
  if (!supabase) return;

  const { data: story, error: storyError } = await supabase
    .from("stories")
    .insert({
      title: item.title,
      summary: summary ?? item.summary,
      ai_summary: summary !== null,
      primary_command: assignment.primary,
      countries: assignment.countries,
      updated_at: item.publishedAt,
    })
    .select("id")
    .single();
  if (storyError) throw storyError;

  const { error: itemError } = await supabase.from("items").insert({
    story_id: story.id,
    source_id: item.sourceId,
    url: item.url,
    title: item.title,
    excerpt: item.summary,
    published_at: item.publishedAt,
  });
  if (itemError) throw itemError;

  const { error: commandError } = await supabase.from("story_commands").insert(
    assignment.commands.map((command) => ({
      story_id: story.id,
      command_id: command,
      is_primary: command === assignment.primary,
    })),
  );
  if (commandError) throw commandError;
}
