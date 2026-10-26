import type { CommandId } from "./commands.ts";

export type TrustTier = "official" | "outlet" | "analysis" | "social";

export const TRUST_LABELS: Record<TrustTier, string> = {
  official: "Official",
  outlet: "Reputable outlet",
  analysis: "Analysis",
  social: "Unverified social",
};

export interface Source {
  id: string;
  name: string;
  url: string;
  kind: "rss";
  trust: TrustTier;
}

/** One raw article or post as fetched from a source. */
export interface Item {
  sourceId: string;
  url: string;
  title: string;
  summary: string;
  publishedAt: string;
}

/** A cluster of items about the same event, as shown in the app. */
export interface Story {
  id: string;
  title: string;
  summary: string;
  primaryCommand: CommandId;
  commands: CommandId[];
  countries: string[];
  severity: 1 | 2 | 3 | 4 | 5;
  updatedAt: string;
  sources: { name: string; url: string; trust: TrustTier }[];
}
