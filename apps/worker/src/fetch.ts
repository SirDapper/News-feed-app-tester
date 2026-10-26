import { XMLParser } from "fast-xml-parser";
import type { Item, Source } from "@newsapp/core";

const parser = new XMLParser({ ignoreAttributes: false });
const MAX_AGE_MS = 72 * 60 * 60 * 1000;

function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "#text" in value) return String(value["#text"]);
  return "";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** Fetches one RSS or Atom feed and returns items from the last 72 hours. */
export async function fetchSource(source: Source): Promise<Item[]> {
  const res = await fetch(source.url, {
    headers: { "user-agent": "combatant-news/0.1 (+https://github.com/SirDapper/News-feed-app-tester)" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`${source.id}: HTTP ${res.status}`);
  const doc = parser.parse(await res.text());

  const rssItems = asArray(doc?.rss?.channel?.item);
  const atomEntries = asArray(doc?.feed?.entry);
  const now = Date.now();

  const items: Item[] = [
    ...rssItems.map((i: Record<string, unknown>) => ({
      url: text(i.link),
      title: text(i.title),
      summary: stripHtml(text(i.description)),
      published: text(i.pubDate),
    })),
    ...atomEntries.map((e: Record<string, unknown>) => ({
      url: text((asArray(e.link as object)[0] as Record<string, unknown>)?.["@_href"]),
      title: text(e.title),
      summary: stripHtml(text(e.summary ?? e.content)),
      published: text(e.updated ?? e.published),
    })),
  ]
    .filter((i) => i.url && i.title)
    .map((i) => {
      const date = new Date(i.published);
      return {
        sourceId: source.id,
        url: i.url,
        title: stripHtml(i.title),
        summary: i.summary.slice(0, 1000),
        publishedAt: Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString(),
      };
    })
    .filter((i) => now - Date.parse(i.publishedAt) < MAX_AGE_MS);

  return items;
}
