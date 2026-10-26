import { SAMPLE_STORIES, type CommandId, type Story } from "@newsapp/core";

// Reads stories for the feed. Uses the bundled sample stories until the
// Supabase queries are wired up (the next step after the worker runs).
export async function getStories(command?: CommandId): Promise<Story[]> {
  const stories = command
    ? SAMPLE_STORIES.filter((s) => s.commands.includes(command))
    : SAMPLE_STORIES;
  return [...stories].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
