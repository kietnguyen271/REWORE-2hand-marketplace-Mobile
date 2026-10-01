import { Text } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card, Section } from '@/components/Section';
import { StatusBadge, statusTone } from '@/components/StatusBadge';
import { colors } from '@/components/theme';
import { hasSellerAccess, useAuthStore } from '@/stores/authStore';
import { hasVerifiedEmail } from '@/utils/format';

export function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  if (!user) {
    return (
      <AppScreen title="Profile">
        <AppButton title="Dang nhap" onPress={() => router.push('/(auth)/login')} />
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Profile" subtitle={user.email}>
      <Card>
        <Text style={{ color: colors.ink, fontWeight: '900', fontSize: 18 }}>{user.fullName || user.name || user.email}</Text>
        <StatusBadge label={hasVerifiedEmail(user) ? 'Email verified' : 'Chua verify email'} tone={hasVerifiedEmail(user) ? 'good' : 'warn'} />
        <StatusBadge label={`Role ${user.role}`} tone={statusTone(user.sellerStatus)} />
        {user.role === 'ADMIN' ? <Text style={{ color: colors.muted }}>Admin dashboard available on web.</Text> : null}
      </Card>
      <Section title="Buyer">
        <AppButton title="Orders & Returns" variant="secondary" onPress={() => router.push('/orders')} />
      </Section>
      <Section title="Seller">
        {hasSellerAccess(user) ? (
          <AppButton title="Mo Seller Studio" onPress={() => router.push('/(tabs)/seller-studio')} />
        ) : (
          <AppButton title="Dang ky Seller" onPress={() => router.push('/seller/application')} disabled={!hasVerifiedEmail(user)} />
        )}
        {!hasVerifiedEmail(user) ? <Text style={{ color: colors.muted }}>Can verify email truoc khi dang ky seller.</Text> : null}
      </Section>
      <AppButton title="Dang xuat" variant="danger" onPress={logout} />
    </AppScreen>
  );
}
