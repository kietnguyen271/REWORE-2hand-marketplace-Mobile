import { Redirect, Tabs } from 'expo-router';
import { colors } from '@/components/theme';
import { hasSellerAccess, useAuthStore } from '@/stores/authStore';
import { Compass, CalendarDays, Gavel, MessageCircle, User as UserIcon } from 'lucide-react-native';

export default function TabsLayout() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2B1810',
        tabBarInactiveTintColor: '#A8A29E',
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          minHeight: 66,
          paddingTop: 6,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      {/* 1 - Khám phá (home) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ color, focused }) => <Compass color={color} strokeWidth={focused ? 2.5 : 2} size={24} />,
        }}
      />

      {/* 2 - Lịch Drop → auctions screen repurposed */}
      <Tabs.Screen
        name="drops"
        options={{
          title: 'Lịch Drop',
          tabBarIcon: ({ color, focused }) => <CalendarDays color={color} strokeWidth={focused ? 2.5 : 2} size={24} />,
        }}
      />

      {/* 3 - Đấu giá */}
      <Tabs.Screen
        name="auctions"
        options={{
          title: 'Đấu giá',
          tabBarIcon: ({ color, focused }) => <Gavel color={color} strokeWidth={focused ? 2.5 : 2} size={24} />,
        }}
      />

      {/* 4 - Tin nhắn (was cart) */}
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Tin nhắn',
          tabBarIcon: ({ color, focused }) => <MessageCircle color={color} strokeWidth={focused ? 2.5 : 2} size={24} />,
        }}
      />

      {/* 5 - Cá nhân */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, focused }) => <UserIcon color={color} strokeWidth={focused ? 2.5 : 2} size={24} />,
        }}
      />

      {/* Hidden tabs */}
      <Tabs.Screen name="wishlist" options={{ href: null }} />
      <Tabs.Screen
        name="seller-studio"
        options={{
          title: 'Seller',
          href: hasSellerAccess(user) ? '/(tabs)/seller-studio' : null,
        }}
      />
    </Tabs>
  );
}
