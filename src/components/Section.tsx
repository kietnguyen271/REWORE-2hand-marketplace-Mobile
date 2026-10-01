import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/components/theme';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  title: {
    color: colors.ink,
    fontFamily: typography.heading,
    fontSize: 21,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 10,
  },
});
