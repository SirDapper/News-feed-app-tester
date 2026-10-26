import { cacheLife } from "next/cache";
import { SAMPLE_STORIES, fetchStories, type CommandId, type Story } from "@newsapp/core";

// Reads stories for the feed from Supabase. Until SUPABASE_URL and
// SUPABASE_PUBLISHABLE_KEY are set it shows the bundled sample stories, so the
// site still runs on a fresh checkout. Results are cached for a few minutes;
// the worker adds stories on a similar schedule.
export async function getStories(command?: CommandId): Promise<Story[]> {
  "use cache";
  cacheLife("minutes");

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    const stories = command
      ? SAMPLE_STORIES.filter((s) => s.commands.includes(command))
      : SAMPLE_STORIES;
    return [...stories].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  try {
    return await fetchStories({ url, key }, command);
  } catch (error) {
    // A database hiccup should show an empty feed, not take the page down.
    console.error(error);
    return [];
  }
}
