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
};

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
    if (name && name !== code) terms.add(name);
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
  const counts = new Map<string, number>();
  for (const { code, pattern } of matchers) {
    const hits = text.match(pattern)?.length ?? 0;
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
 */
export function assignCommands(text: string): CommandAssignment {
  const countries = extractCountries(text);
  const commands: CommandId[] = [];
  for (const code of countries) {
    const command = commandForCountry(code);
    if (command && !commands.includes(command)) commands.push(command);
  }
  if (isGlobalTopic(text)) commands.push("GLOBAL");

  const foreign = countries.find((c) => c !== "US");
  const primary: CommandId =
    (foreign && commandForCountry(foreign)) || commands[0] || "GLOBAL";
  if (!commands.includes(primary)) commands.unshift(primary);
  return { primary, commands, countries };
}
