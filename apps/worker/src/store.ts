import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CommandAssignment, Item, Source } from "@newsapp/core";

export interface StoryDraft {
  item: Item;
  assignment: CommandAssignment;
  summary: string | null;
}

let client: SupabaseClient | undefined;

function db(): SupabaseClient | undefined {
  const url = process.env.SUPABASE_URL;
  // SUPABASE_SERVICE_ROLE_KEY is the older name for the same secret key.
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return undefined;
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function hasDatabase(): boolean {
  return db() !== undefined;
}

/** Keeps the sources table in step with the feed list, so items can reference it. */
export async function saveSources(sources: Source[]): Promise<void> {
  const supabase = db();
  if (!supabase) return;
  const { error } = await supabase
    .from("sources")
    .upsert(sources.map(({ id, name, url, trust }) => ({ id, name, url, trust })));
  if (error) throw error;
}

// `.in()` goes into the query string, which has a length limit, so ask in
// batches rather than putting every URL of every feed into one request.
const URL_LOOKUP_CHUNK = 50;

/** URLs already stored, so the worker skips them. */
export async function knownUrls(urls: string[]): Promise<Set<string>> {
  const supabase = db();
  if (!supabase || urls.length === 0) return new Set();

  const known = new Set<string>();
  for (let i = 0; i < urls.length; i += URL_LOOKUP_CHUNK) {
    const chunk = urls.slice(i, i + URL_LOOKUP_CHUNK);
    const { data, error } = await supabase.from("items").select("url").in("url", chunk);
    if (error) throw error;
    for (const row of data) known.add(row.url as string);
  }
  return known;
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

  // These three inserts are not one transaction, so if a later one fails
  // (a duplicate URL, a dropped connection) remove the story row rather than
  // leave a story the apps would render with no sources. Deleting it cascades
  // to items and story_commands.
  try {
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
  } catch (error) {
    await supabase.from("stories").delete().eq("id", story.id);
    throw error;
  }
}
