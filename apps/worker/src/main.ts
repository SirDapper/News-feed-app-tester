import { assignCommands, type Item, type Source } from "@newsapp/core";
import { SOURCES } from "./sources.ts";
import { fetchSource } from "./fetch.ts";
import { summarize } from "./summarize.ts";
import { hasDatabase, knownUrls, saveStory } from "./store.ts";

// One ingestion pass: fetch every source, skip stored items, file each new item
// under its commands, summarize it, and save it. Run on a schedule (every 10
// minutes is a reasonable start). Without database or API keys it runs as a
// dry run and prints what it would store.

const sources = new Map<string, Source>(SOURCES.map((s) => [s.id, s]));
const canSummarize = Boolean(process.env.ANTHROPIC_API_KEY);

const results = await Promise.allSettled(SOURCES.map(fetchSource));
const items: Item[] = [];
results.forEach((result, i) => {
  if (result.status === "fulfilled") items.push(...result.value);
  else console.warn(`skipped ${SOURCES[i].id}: ${result.reason}`);
});

const seen = await knownUrls(items.map((i) => i.url));
const fresh = items.filter((i) => !seen.has(i.url));
console.log(`${items.length} items fetched, ${fresh.length} new`);

for (const item of fresh) {
  const assignment = assignCommands(`${item.title}. ${item.summary}`);
  if (assignment.countries.length === 0 && assignment.primary === "GLOBAL") {
    // No place or global topic found; most of these are off-topic.
    continue;
  }
  const summary = canSummarize ? await summarize([item], sources) : null;

  if (hasDatabase()) {
    await saveStory({ item, assignment, summary });
  } else {
    console.log(`[${assignment.commands.join(", ")}] ${item.title}`);
  }
}
