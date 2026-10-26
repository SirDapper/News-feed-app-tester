// US combatant commands used as the app's top-level sections.
//
// The country table below is data, not logic: the Unified Command Plan changes
// (Israel moved to CENTCOM in 2021, Greenland to NORTHCOM in 2025), so edit the
// table rather than the code that reads it. Verify against the current plan
// before relying on edge cases.

export type CommandId =
  | "INDOPACOM"
  | "EUCOM"
  | "CENTCOM"
  | "AFRICOM"
  | "SOUTHCOM"
  | "NORTHCOM"
  | "GLOBAL";

export interface Command {
  id: CommandId;
  name: string;
  shortName: string;
  hq: string;
  summary: string;
}

export const COMMANDS: readonly Command[] = [
  {
    id: "INDOPACOM",
    name: "US Indo-Pacific Command",
    shortName: "Indo-Pacific",
    hq: "Camp H. M. Smith, Hawaii",
    summary: "China, Taiwan, the Koreas, Japan, India, Southeast Asia, Oceania",
  },
  {
    id: "EUCOM",
    name: "US European Command",
    shortName: "Europe",
    hq: "Stuttgart, Germany",
    summary: "Europe, Russia, Ukraine, Turkey, the Caucasus",
  },
  {
    id: "CENTCOM",
    name: "US Central Command",
    shortName: "Middle East",
    hq: "Tampa, Florida",
    summary: "Middle East, Egypt, Iran, the Gulf, Central and South Asia",
  },
  {
    id: "AFRICOM",
    name: "US Africa Command",
    shortName: "Africa",
    hq: "Stuttgart, Germany",
    summary: "Africa except Egypt",
  },
  {
    id: "SOUTHCOM",
    name: "US Southern Command",
    shortName: "Latin America",
    hq: "Doral, Florida",
    summary: "Central America, South America, the Caribbean",
  },
  {
    id: "NORTHCOM",
    name: "US Northern Command",
    shortName: "North America",
    hq: "Colorado Springs, Colorado",
    summary: "United States, Canada, Mexico, the Bahamas, Greenland",
  },
  {
    id: "GLOBAL",
    name: "Global and functional",
    shortName: "Global",
    hq: "",
    summary: "Space, cyber, nuclear forces, special operations, logistics, Pentagon policy",
  },
];

export function getCommand(id: CommandId): Command {
  const command = COMMANDS.find((c) => c.id === id);
  if (!command) throw new Error(`Unknown command: ${id}`);
  return command;
}

type RegionalCommandId = Exclude<CommandId, "GLOBAL">;

// ISO 3166-1 alpha-2 codes grouped by command.
const COUNTRIES_BY_COMMAND: Record<RegionalCommandId, string[]> = {
  INDOPACOM: [
    "AQ", "AS", "AU", "BD", "BN", "BT", "CN", "FJ", "FM", "GU", "HK", "ID", "IN",
    "JP", "KH", "KI", "KP", "KR", "LA", "LK", "MH", "MM", "MN", "MO", "MP", "MV",
    "MY", "NP", "NR", "NZ", "PG", "PH", "PW", "SB", "SG", "TH", "TL", "TO", "TV",
    "TW", "VN", "VU", "WS",
  ],
  EUCOM: [
    "AD", "AL", "AM", "AT", "AZ", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE",
    "DK", "EE", "ES", "FI", "FO", "FR", "GB", "GE", "GI", "GR", "HR", "HU", "IE",
    "IS", "IT", "LI", "LT", "LU", "LV", "MC", "MD", "ME", "MK", "MT", "NL", "NO",
    "PL", "PT", "RO", "RS", "RU", "SE", "SI", "SK", "SM", "TR", "UA", "VA", "XK",
  ],
  CENTCOM: [
    "AE", "AF", "BH", "EG", "IL", "IQ", "IR", "JO", "KG", "KW", "KZ", "LB", "OM",
    "PK", "PS", "QA", "SA", "SY", "TJ", "TM", "UZ", "YE",
  ],
  AFRICOM: [
    "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ", "DZ",
    "EH", "ER", "ET", "GA", "GH", "GM", "GN", "GQ", "GW", "KE", "KM", "LR", "LS",
    "LY", "MA", "MG", "ML", "MR", "MU", "MW", "MZ", "NA", "NE", "NG", "RW", "SC",
    "SD", "SL", "SN", "SO", "SS", "ST", "SZ", "TD", "TG", "TN", "TZ", "UG", "ZA",
    "ZM", "ZW",
  ],
  SOUTHCOM: [
    "AG", "AI", "AR", "AW", "BB", "BO", "BR", "BZ", "CL", "CO", "CR", "CU", "CW",
    "DM", "DO", "EC", "FK", "GD", "GF", "GT", "GY", "HN", "HT", "JM", "KN", "KY",
    "LC", "MS", "NI", "PA", "PE", "PY", "SR", "SV", "TT", "UY", "VC", "VE",
  ],
  NORTHCOM: ["BM", "BS", "CA", "GL", "MX", "PM", "PR", "TC", "US", "VG", "VI"],
};

export const COUNTRY_TO_COMMAND: ReadonlyMap<string, RegionalCommandId> = new Map(
  (Object.entries(COUNTRIES_BY_COMMAND) as [RegionalCommandId, string[]][]).flatMap(
    ([command, codes]) => codes.map((code) => [code, command] as const),
  ),
);

export function commandForCountry(code: string): RegionalCommandId | undefined {
  return COUNTRY_TO_COMMAND.get(code.toUpperCase());
}
