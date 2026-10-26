import { COUNTRY_TO_COMMAND, commandForCountry, type CommandId } from "./commands.ts";

// A first-pass geotagger that matches country names, demonyms and a few
// flashpoint place names in text. It is deliberately simple; the worker can
// replace it with GDELT locations or an LLM extraction pass later.

const EXTRA_ALIASES: Record<string, string[]> = {
  US: ["United States", "U.S.", "USA", "Pentagon", "Washington"],
  GB: ["Britain", "British", "UK", "U.K."],
  RU: ["Russian", "Kremlin", "Moscow"],
  UA: ["Ukrainian", "Kyiv", "Kharkiv", "Odesa", "Donbas", "Crimea", "Zaporizhzhia"],
  CN: ["Chinese", "Beijing", "PLA"],
  TW: ["Taiwanese", "Taipei", "Taiwan Strait"],
  KP: ["North Korea", "North Korean", "Pyongyang"],
  KR: ["South Korea", "South Korean", "Seoul"],
  JP: ["Japanese", "Tokyo", "Okinawa"],
  PH: ["Philippine", "Filipino", "Manila"],
  IN: ["Indian", "New Delhi"],
  PK: ["Pakistani", "Islamabad"],
  IR: ["Iranian", "Tehran", "IRGC"],
  IL: ["Israeli", "IDF", "Jerusalem", "Tel Aviv"],
  PS: ["Gaza", "West Bank", "Palestinian", "Hamas"],
  LB: ["Lebanese", "Beirut", "Hezbollah"],
  YE: ["Yemeni", "Houthi", "Houthis", "Sanaa"],
  SY: ["Syrian", "Damascus"],
  IQ: ["Iraqi", "Baghdad"],
  SA: ["Saudi", "Riyadh"],
  SD: ["Sudanese", "Khartoum", "Darfur"],
  SO: ["Somali", "Mogadishu", "al-Shabaab"],
  VE: ["Venezuelan", "Caracas"],
  MX: ["Mexican", "Mexico City"],
  CO: ["Colombian", "Bogota"],
  CU: ["Cuban", "Havana", "Guantanamo"],
  GL: ["Greenlandic", "Nuuk"],
  // Countries whose display name never appears in prose in that form.
  HK: ["Hong Kong"],
  MO: ["Macao", "Macau"],
  MM: ["Myanmar", "Burma", "Burmese", "Naypyidaw", "Tatmadaw"],
  CD: ["DR Congo", "DRC", "Democratic Republic of the Congo", "Kinshasa", "Goma", "M23"],
  CG: ["Republic of the Congo", "Brazzaville"],
  CI: ["Ivory Coast", "Cote d'Ivoire", "Côte d'Ivoire", "Abidjan"],
  // Ambiguous names (see AMBIGUOUS_NAMES): matched only through these aliases.
  GE: ["Georgian", "Tbilisi", "Abkhazia", "South Ossetia"],
  JO: ["Jordanian", "Amman"],
  TD: ["Chadian", "N'Djamena"],
  NE: ["Nigerien", "Niamey"],
  ML: ["Malian", "Bamako"],
  GN: ["Guinean", "Conakry"],
  JE: ["Bailiwick of Jersey"],
  TR: ["Turkey", "Turkish", "Ankara", "Istanbul", "Erdogan"],
};

// Display names that are also ordinary words, US states or common first names.
// Matching them verbatim misfiles stories ("a Georgia court", "Jordan scored
// 30 points"), so these countries are matched only through their aliases above.
const AMBIGUOUS_NAMES = new Set(["GE", "JO", "TD", "NE", "ML", "GN", "JE", "TR"]);

/**
 * Turns a CLDR region name into the forms that appear in prose, or returns
 * none when the name is too ambiguous to match on its own.
 * "Myanmar (Burma)" -> ["Myanmar", "Burma"], "Hong Kong SAR China" -> ["Hong Kong"].
 */
function prosePlaceNames(code: string, name: string): string[] {
  if (AMBIGUOUS_NAMES.has(code)) return [];
  const names = new Set<string>();
  // "Congo - Kinshasa" and "Congo - Brazzaville" both shorten to "Congo", so
  // they are matched only through their aliases.
  if (name.includes(" - ")) return [];
  for (const part of name.split(/\s*\(([^)]*)\)\s*/).filter(Boolean)) {
    const cleaned = part
      .replace(/\s+SAR China$/, "")
      .replace(/[‘’]/g, "'")
      .trim();
    if (cleaned.length > 3) names.add(cleaned);
  }
  return [...names];
}

const GLOBAL_TOPICS = [
  "space force",
  "spacecom",
  "satellite",
  "anti-satellite",
  "cyberattack",
  "cyber attack",
  "cybercom",
  "ransomware",
  "nuclear arsenal",
  "nuclear deterrent",
  "icbm",
  "stratcom",
  "socom",
  "transcom",
  "defense budget",
  "pentagon budget",
  "ndaa",
];

interface Matcher {
  code: string;
  pattern: RegExp;
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMatchers(): Matcher[] {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const matchers: Matcher[] = [];
  for (const code of COUNTRY_TO_COMMAND.keys()) {
    const terms = new Set<string>(EXTRA_ALIASES[code] ?? []);
    const name = names.of(code);
    if (name && name !== code) for (const n of prosePlaceNames(code, name)) terms.add(n);
    for (const term of terms) {
      // Case-sensitive so "US" and "PLA" don't match ordinary words.
      matchers.push({ code, pattern: new RegExp(`(?<![\\w.])${escape(term)}(?!\\w)`, "g") });
    }
  }
  return matchers;
}

let matchers: Matcher[] | undefined;

/** Country codes mentioned in the text, most-mentioned first. */
export function extractCountries(text: string): string[] {
  matchers ??= buildMatchers();
  const normalized = text.replace(/[‘’]/g, "'");
  const counts = new Map<string, number>();
  for (const { code, pattern } of matchers) {
    const hits = normalized.match(pattern)?.length ?? 0;
    if (hits) counts.set(code, (counts.get(code) ?? 0) + hits);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([code]) => code);
}

export function isGlobalTopic(text: string): boolean {
  const lower = text.toLowerCase();
  return GLOBAL_TOPICS.some((t) => lower.includes(t));
}

export interface CommandAssignment {
  primary: CommandId;
  commands: CommandId[];
  countries: string[];
}

/**
 * Files a story under every command whose countries it mentions. The primary
 * command (used for the map pin) is the one holding the most-mentioned
 * country other than the US, since most stories here mention the US.
 *
 * `commands` is empty when the text names no place and no global topic; the
 * caller treats that as off-topic.
 */
export function assignCommands(text: string): CommandAssignment {
  const countries = extractCountries(text);
  const commands: CommandId[] = [];

  const foreign = countries.find((c) => c !== "US");
  const primaryByCountry = foreign ? commandForCountry(foreign) : undefined;
  if (primaryByCountry) commands.push(primaryByCountry);

  for (const code of countries) {
    const command = commandForCountry(code);
    if (command && !commands.includes(command)) commands.push(command);
  }
  if (isGlobalTopic(text) && !commands.includes("GLOBAL")) commands.push("GLOBAL");

  return { primary: commands[0] ?? "GLOBAL", commands, countries };
}
