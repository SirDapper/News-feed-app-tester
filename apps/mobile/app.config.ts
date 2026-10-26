/// <reference types="node" />
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';
import type { ConfigContext, ExpoConfig } from 'expo/config';

// Passes the Supabase URL and publishable key to the app through `extra`.
// They come from the environment (e.g. EAS environment variables) or from the
// .env file at the repository root that the web app and worker also read.
function rootEnv(projectRoot: string): Record<string, string | undefined> {
  try {
    return parseEnv(readFileSync(path.resolve(projectRoot, '../../.env'), 'utf8'));
  } catch {
    return {};
  }
}

export default ({ config, projectRoot }: ConfigContext): ExpoConfig => {
  const env = { ...rootEnv(projectRoot), ...process.env };
  return {
    ...config,
    name: config.name ?? 'Combatant News',
    slug: config.slug ?? 'combatant-news',
    extra: {
      ...config.extra,
      supabaseUrl: env.SUPABASE_URL ?? '',
      supabasePublishableKey: env.SUPABASE_PUBLISHABLE_KEY ?? '',
    },
  };
};
