import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/components/theme';

export function LoadingState({ label = 'Dang tai du lieu...' }: { label?: string }) {
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.terracotta} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.state}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.text}>{body}</Text> : null}
    </View>
  );
}

export function SkeletonList() {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonLine} />
          <View style={[styles.skeletonLine, styles.shortLine]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 16,
  },
  text: {
    color: colors.muted,
    textAlign: 'center',
  },
  skeletonWrap: {
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    gap: 10,
  },
  skeletonImage: {
    height: 145,
    borderRadius: 8,
    backgroundColor: '#EFE4D9',
  },
  skeletonLine: {
    height: 14,
    borderRadius: 999,
    backgroundColor: '#EFE4D9',
  },
  shortLine: {
    width: '55%',
  },
});
