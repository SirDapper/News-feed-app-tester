import { TRUST_LABELS, getCommand, type Story } from '@newsapp/core';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export function StoryCard({ story }: { story: Story }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary">
        {getCommand(story.primaryCommand).shortName} · Severity {story.severity}/5
      </ThemedText>
      <ThemedText type="smallBold" style={styles.title}>
        {story.title}
      </ThemedText>
      <ThemedText type="small">{story.summary}</ThemedText>
      <View style={styles.sources}>
        {story.sources.map((s) => (
          <Pressable key={s.url + s.name} onPress={() => Linking.openURL(s.url)}>
            <ThemedText type="small" themeColor="textSecondary">
              {s.name} ({TRUST_LABELS[s.trust]})
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: Spacing.three, gap: Spacing.one },
  title: { fontSize: 16, lineHeight: 22 },
  sources: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
});
