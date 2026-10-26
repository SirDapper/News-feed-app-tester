import { assignCommands, type Item, type Source } from "@newsapp/core";
import { SOURCES } from "./sources.ts";
import { fetchSource } from "./fetch.ts";
import { summarize } from "./summarize.ts";
import { hasDatabase, knownUrls, saveSources, saveStory } from "./store.ts";

// One ingestion pass: fetch every source, skip stored items, file each new item
// under its commands, summarize it, and save it. Run on a schedule (every 10
// minutes is a reasonable start). Without database or API keys it runs as a
// dry run and prints what it would store.

const sources = new Map<string, Source>(SOURCES.map((s) => [s.id, s]));
const canSummarize = Boolean(process.env.ANTHROPIC_API_KEY);

await saveSources(SOURCES);

const results = await Promise.allSettled(SOURCES.map(fetchSource));
const items: Item[] = [];
results.forEach((result, i) => {
  if (result.status === "fulfilled") items.push(...result.value);
  else console.warn(`skipped ${SOURCES[i].id}: ${result.reason}`);
});

const seen = await knownUrls(items.map((i) => i.url));
const batch = new Set<string>();
const fresh = items.filter((i) => {
  // Feeds syndicate each other, so the same URL can arrive twice in one pass.
  if (seen.has(i.url) || batch.has(i.url)) return false;
  batch.add(i.url);
  return true;
});
console.log(`${items.length} items fetched, ${fresh.length} new`);

let stored = 0;
let failed = 0;

for (const item of fresh) {
  const assignment = assignCommands(`${item.title}. ${item.summary}`);
  if (assignment.commands.length === 0) {
    // No place and no global topic found; most of these are off-topic.
    continue;
  }

  // One bad item (a duplicate URL, a transient API error) must not end the
  // pass and lose every item after it.
  try {
    const summary = canSummarize ? await summarize([item], sources) : null;
    if (hasDatabase()) {
      await saveStory({ item, assignment, summary });
    } else {
      console.log(`[${assignment.commands.join(", ")}] ${item.title}`);
    }
    stored += 1;
  } catch (error) {
    failed += 1;
    console.warn(`skipped ${item.url}: ${error}`);
  }
}

console.log(`${stored} stored, ${failed} failed`);
