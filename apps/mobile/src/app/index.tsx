import { COMMANDS, type CommandId } from '@newsapp/core';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StoryCard } from '@/components/story-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useStories } from '@/hooks/use-stories';

// Commands screen: pick a combatant command, see its stories.
export default function CommandsScreen() {
  const [selected, setSelected] = useState<CommandId>('INDOPACOM');
  const command = COMMANDS.find((c) => c.id === selected)!;
  const { stories, loading, error, refresh } = useStories(selected);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}>
          <ThemedText type="subtitle">Commands</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {COMMANDS.map((c) => (
              <Pressable key={c.id} onPress={() => setSelected(c.id)}>
                <ThemedView
                  type={c.id === selected ? 'backgroundSelected' : 'backgroundElement'}
                  style={styles.chip}>
                  <ThemedText type={c.id === selected ? 'smallBold' : 'small'}>
                    {c.id === 'GLOBAL' ? 'Global' : c.id}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ScrollView>
          <ThemedText type="smallBold">{command.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {command.summary}
          </ThemedText>
          {error ? (
            <ThemedText type="small" themeColor="textSecondary">
              Could not load stories. Pull down to try again.
            </ThemedText>
          ) : stories.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              {loading ? 'Loading…' : 'No stories yet.'}
            </ThemedText>
          ) : (
            stories.map((s) => <StoryCard key={s.id} story={s} />)
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: MaxContentWidth },
  content: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  chips: { gap: Spacing.two },
  chip: { borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
});
