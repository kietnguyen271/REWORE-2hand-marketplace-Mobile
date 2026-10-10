import { useState } from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { GateModal } from '@/components/GateModal';
import { colors } from '@/components/theme';
import { hasSellerAccess, useAuthStore } from '@/stores/authStore';
import { Compass, CalendarDays, Gavel, MessageCircle, User as UserIcon } from 'lucide-react-native';

/** Small terracotta lock dot for tabs that require login */
function LockDot() {
  return (
    <View
      style={{
        position: 'absolute',
        top: -3,
        right: -6,
        width: 11,
        height: 11,
        borderRadius: 6,
        backgroundColor: colors.terracotta,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: colors.paper,
      }}
    />
  );
}

export default function TabsLayout() {
  const user = useAuthStore((state) => state.user);
  const isGuest = !user;

  const [gateVisible, setGateVisible] = useState(false);
  const [gateFeature, setGateFeature] = useState<string | undefined>();

  const showGate = (feature: string) => {
    setGateFeature(feature);
    setGateVisible(true);
  };

  return (
    <>
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
        {/* 1 - Home (accessible by guests) */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => <Compass color={color} strokeWidth={focused ? 2.5 : 2} size={24} />,
          }}
        />

        {/* 2 - Lịch Drop (accessible by guests – view only) */}
        <Tabs.Screen
          name="drops"
          options={{
            title: 'Lịch Drop',
            tabBarIcon: ({ color, focused }) => <CalendarDays color={color} strokeWidth={focused ? 2.5 : 2} size={24} />,
          }}
        />

        {/* 3 - Đấu giá (requires auth) */}
        <Tabs.Screen
          name="auctions"
          options={{
            title: 'Đấu giá',
            tabBarIcon: ({ color, focused }) => (
              <View>
                <Gavel color={color} strokeWidth={focused ? 2.5 : 2} size={24} />
                {isGuest && <LockDot />}
              </View>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              if (isGuest) {
                e.preventDefault();
                showGate('Đấu giá');
              }
            },
          }}
        />

        {/* 4 - Tin nhắn (requires auth) */}
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Tin nhắn',
            tabBarIcon: ({ color, focused }) => (
              <View>
                <MessageCircle color={color} strokeWidth={focused ? 2.5 : 2} size={24} />
                {isGuest && <LockDot />}
              </View>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              if (isGuest) {
                e.preventDefault();
                showGate('Tin nhắn');
              }
            },
          }}
        />

        {/* 5 - Cá nhân (requires auth) */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Cá nhân',
            tabBarIcon: ({ color, focused }) => (
              <View>
                <UserIcon color={color} strokeWidth={focused ? 2.5 : 2} size={24} />
                {isGuest && <LockDot />}
              </View>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              if (isGuest) {
                e.preventDefault();
                showGate('Trang cá nhân');
              }
            },
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

      {/* Gate Modal – shown when guest taps a locked tab */}
      <GateModal
        visible={gateVisible}
        featureName={gateFeature}
        onClose={() => setGateVisible(false)}
      />
    </>
  );
}


