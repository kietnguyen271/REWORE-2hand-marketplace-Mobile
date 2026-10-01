import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/components/theme';

type Props = {
  label?: string;
  tone?: 'good' | 'warn' | 'bad' | 'neutral';
};

const dotColor = {
  good: colors.sage,
  warn: colors.gold,
  bad: colors.danger,
  neutral: colors.muted,
};

export function StatusBadge({ label = 'Dang cap nhat', tone = 'neutral' }: Props) {
  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: dotColor[tone] }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function statusTone(status?: string): Props['tone'] {
  if (!status) return 'neutral';
  if (['AVAILABLE', 'APPROVED', 'ACTIVE', 'DELIVERED', 'COMPLETED', 'PAID'].includes(status)) return 'good';
  if (['PENDING', 'CONFIRMED', 'SHIPPED', 'RESERVED'].includes(status)) return 'warn';
  if (['SOLD', 'CANCELLED', 'REJECTED', 'INACTIVE'].includes(status)) return 'bad';
  return 'neutral';
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  label: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
});
