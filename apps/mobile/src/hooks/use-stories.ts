import { SAMPLE_STORIES, fetchStories, type CommandId, type Story } from '@newsapp/core';
import Constants from 'expo-constants';
import { useCallback, useEffect, useRef, useState } from 'react';

const url: string = Constants.expoConfig?.extra?.supabaseUrl ?? '';
const key: string = Constants.expoConfig?.extra?.supabasePublishableKey ?? '';

function sampleStories(command?: CommandId): Story[] {
  const stories = command
    ? SAMPLE_STORIES.filter((s) => s.commands.includes(command))
    : SAMPLE_STORIES;
  return [...stories].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Stories from Supabase, newest first, optionally for one command. Shows the
 * sample stories until the Supabase keys are set (see app.config.ts).
 */
export function useStories(command?: CommandId) {
  const connected = Boolean(url && key);
  const [stories, setStories] = useState<Story[]>(() => (connected ? [] : sampleStories(command)));
  const [loading, setLoading] = useState(connected);
  const [error, setError] = useState<string | null>(null);
  // Switching commands quickly can leave an older request still running; only
  // the latest one may update the screen.
  const latest = useRef(0);

  const load = useCallback(async () => {
    if (!connected) {
      setStories(sampleStories(command));
      return;
    }
    const request = ++latest.current;
    setLoading(true);
    try {
      const fresh = await fetchStories({ url, key }, command);
      if (request !== latest.current) return;
      setStories(fresh);
      setError(null);
    } catch (e) {
      if (request !== latest.current) return;
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [connected, command]);

  useEffect(() => {
    load();
  }, [load]);

  return { stories, loading, error, refresh: load };
}
