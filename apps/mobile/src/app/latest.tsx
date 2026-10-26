import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StoryCard } from '@/components/story-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useStories } from '@/hooks/use-stories';

export default function LatestScreen() {
  const { stories, loading, error, refresh } = useStories();
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}>
          <ThemedText type="subtitle">Latest</ThemedText>
          {error ? (
            <ThemedText type="small" themeColor="textSecondary">
              Could not load stories. Pull down to try again.
            </ThemedText>
          ) : null}
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
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
});
