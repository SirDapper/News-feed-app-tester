import type { Story } from "./types.ts";

// Placeholder stories so the web and mobile apps render before the database
// is connected. Clearly fictional; replace with real data from Supabase.
export const SAMPLE_STORIES: Story[] = [
  {
    id: "sample-1",
    title: "Sample: naval exercise announced near the Philippines",
    summary:
      "Placeholder story. Once the worker runs, this list fills with real reporting grouped by command.",
    primaryCommand: "INDOPACOM",
    commands: ["INDOPACOM"],
    countries: ["PH"],
    severity: 2,
    updatedAt: "2026-10-26T12:00:00Z",
    sources: [{ name: "Example source", url: "https://example.com", trust: "official" }],
  },
  {
    id: "sample-2",
    title: "Sample: NATO defense ministers meet in Brussels",
    summary: "Placeholder story for the EUCOM section.",
    primaryCommand: "EUCOM",
    commands: ["EUCOM"],
    countries: ["BE"],
    severity: 1,
    updatedAt: "2026-10-26T11:00:00Z",
    sources: [{ name: "Example source", url: "https://example.com", trust: "outlet" }],
  },
  {
    id: "sample-3",
    title: "Sample: Red Sea shipping update",
    summary: "Placeholder story filed under two commands.",
    primaryCommand: "CENTCOM",
    commands: ["CENTCOM", "AFRICOM"],
    countries: ["YE", "DJ"],
    severity: 3,
    updatedAt: "2026-10-26T10:00:00Z",
    sources: [{ name: "Example source", url: "https://example.com", trust: "outlet" }],
  },
];
