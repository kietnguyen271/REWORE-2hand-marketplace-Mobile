import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { productsApi, usersApi } from '@/api/endpoints';
import { AppScreen } from '@/components/AppScreen';
import { ProductCard } from '@/components/ProductCard';
import { Card } from '@/components/Section';
import { EmptyState, SkeletonList } from '@/components/StateViews';
import { StatusBadge } from '@/components/StatusBadge';
import { colors, typography } from '@/components/theme';
import type { Product, SellerProfile, User } from '@/types/domain';
import { getErrorMessage, normalizeList } from '@/utils/format';
import { useToastStore } from '@/stores/toastStore';

export function PublicShopScreen({ sellerId }: { sellerId: string }) {
  const [seller, setSeller] = useState<(User & { sellerProfile?: SellerProfile }) | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [tab, setTab] = useState<'products' | 'ratings' | 'info'>('products');
  const [loading, setLoading] = useState(true);
  const show = useToastStore((state) => state.show);

  useEffect(() => {
    Promise.all([usersApi.detail(sellerId), productsApi.list({ sellerId })])
      .then(([user, productPayload]) => {
        setSeller(user as User & { sellerProfile?: SellerProfile });
        setProducts(normalizeList<Product>(productPayload));
      })
      .catch((error) => show(getErrorMessage(error), 'error'))
      .finally(() => setLoading(false));
  }, [sellerId, show]);

  const profile = seller?.sellerProfile;

  return (
    <AppScreen title={profile?.shopName || seller?.name || 'REWORE Shop'} subtitle={profile?.pickupArea || 'Public shop'}>
      <Card>
        <View style={styles.header}>
          {profile?.avatar ? <Image source={{ uri: profile.avatar }} style={styles.avatar} /> : <View style={styles.avatar} />}
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.shopName}>{profile?.shopName || seller?.fullName || seller?.email}</Text>
            <StatusBadge label={profile?.verified ? 'Verified seller' : 'Seller'} tone={profile?.verified ? 'good' : 'neutral'} />
            <Text style={styles.meta}>Diem seller: {profile?.sellerScore ?? 'Dang cap nhat'}</Text>
          </View>
        </View>
      </Card>
      <View style={styles.tabs}>
        {[
          ['products', 'San pham'],
          ['ratings', 'Rating & comments'],
          ['info', 'Thong tin'],
        ].map(([value, label]) => (
          <Pressable key={value} onPress={() => setTab(value as typeof tab)} style={[styles.tab, tab === value && styles.activeTab]}>
            <Text style={[styles.tabText, tab === value && styles.activeTabText]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {loading ? <SkeletonList /> : null}
      {!loading && tab === 'products' && products.length === 0 ? <EmptyState title="Shop chua co san pham" /> : null}
      {tab === 'products' ? products.map((product) => <ProductCard key={product.id} product={product} />) : null}
      {tab === 'ratings' ? <EmptyState title="Chua co rating" body="Danh gia shop se hien sau khi buyer nhan hang thanh cong." /> : null}
      {tab === 'info' ? (
        <Card>
          <Text style={styles.meta}>Email: {seller?.email}</Text>
          <Text style={styles.meta}>Khu vuc pickup: {profile?.pickupArea || 'Dang cap nhat'}</Text>
        </Card>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#E9D9CA',
  },
  shopName: {
    color: colors.ink,
    fontFamily: typography.heading,
    fontSize: 23,
  },
  meta: {
    color: colors.muted,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  activeTab: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },
  tabText: {
    color: colors.ink,
    fontWeight: '700',
    textAlign: 'center',
  },
  activeTabText: {
    color: colors.paper,
  },
});
