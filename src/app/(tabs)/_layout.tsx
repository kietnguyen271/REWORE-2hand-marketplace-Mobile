import { Redirect, Tabs } from 'expo-router';
import { colors } from '@/components/theme';
import { hasSellerAccess, useAuthStore } from '@/stores/authStore';

export default function TabsLayout() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.terracotta,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
          minHeight: 62,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Shop' }} />
      <Tabs.Screen name="auctions" options={{ title: 'Auctions' }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart' }} />
      <Tabs.Screen name="wishlist" options={{ title: 'Wishlist' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="seller-studio" options={{ title: 'Seller', href: hasSellerAccess(user) ? '/(tabs)/seller-studio' : null }} />
    </Tabs>
  );
}
