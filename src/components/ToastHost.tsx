import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/components/theme';
import { useToastStore } from '@/stores/toastStore';

export function ToastHost() {
  const { message, type, clear } = useToastStore();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(clear, 3200);
    return () => clearTimeout(timer);
  }, [clear, message]);

  if (!message) {
    return null;
  }

  return (
    <SafeAreaView pointerEvents="none" style={styles.host}>
      <Text style={[styles.toast, type === 'error' && styles.error, type === 'success' && styles.success]}>{message}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  toast: {
    overflow: 'hidden',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.ink,
    color: colors.paper,
    fontWeight: '700',
    textAlign: 'center',
  },
  error: {
    backgroundColor: colors.danger,
  },
  success: {
    backgroundColor: colors.sage,
  },
});
