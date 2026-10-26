import type { Source } from "@newsapp/core";

// Starting feed list. URLs were not reachable from the build environment, so
// check each one on the first real run; the worker skips feeds that fail.
export const SOURCES: Source[] = [
  {
    id: "dod-releases",
    name: "US Department of Defense",
    url: "https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?ContentType=1&Site=945&max=20",
    kind: "rss",
    trust: "official",
  },
  { id: "un-news", name: "UN News", url: "https://news.un.org/feed/subscribe/en/news/all/rss.xml", kind: "rss", trust: "official" },
  { id: "bbc-world", name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", kind: "rss", trust: "outlet" },
  { id: "al-jazeera", name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", kind: "rss", trust: "outlet" },
  {
    id: "defense-news",
    name: "Defense News",
    url: "https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml",
    kind: "rss",
    trust: "outlet",
  },
  {
    id: "military-times",
    name: "Military Times",
    url: "https://www.militarytimes.com/arc/outboundfeeds/rss/?outputType=xml",
    kind: "rss",
    trust: "outlet",
  },
  { id: "breaking-defense", name: "Breaking Defense", url: "https://breakingdefense.com/feed/", kind: "rss", trust: "outlet" },
  { id: "the-war-zone", name: "The War Zone", url: "https://www.twz.com/feed", kind: "rss", trust: "outlet" },
  { id: "war-on-the-rocks", name: "War on the Rocks", url: "https://warontherocks.com/feed/", kind: "rss", trust: "analysis" },
];
