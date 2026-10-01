import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ordersApi, reportsApi } from '@/api/endpoints';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card } from '@/components/Section';
import { EmptyState, SkeletonList } from '@/components/StateViews';
import { StatusBadge, statusTone } from '@/components/StatusBadge';
import { TextField } from '@/components/TextField';
import { colors } from '@/components/theme';
import type { Order, Product } from '@/types/domain';
import { formatVnd, getErrorMessage, normalizeList } from '@/utils/format';
import { firstProductImage } from '@/utils/images';
import { useToastStore } from '@/stores/toastStore';

const tabs = [
  { label: 'Tat ca', value: 'ALL' },
  { label: 'Cho seller', value: 'PENDING' },
  { label: 'Cho lay hang', value: 'CONFIRMED' },
  { label: 'Dang giao', value: 'SHIPPED' },
  { label: 'Cho danh gia', value: 'DELIVERED' },
  { label: 'Lich su', value: 'HISTORY' },
];

const timeline = ['Nguoi ban chuan bi', 'Cho lay hang', 'Dang giao', 'Da nhan hang', 'Cho danh gia'];

function firstOrderProduct(order: Order): Product | undefined {
  return order.product || order.products?.[0] || order.items?.[0]?.product;
}

export function OrdersScreen({ role = 'buyer' }: { role?: 'buyer' | 'seller' }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  const [reviewText, setReviewText] = useState('');
  const show = useToastStore((state) => state.show);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(normalizeList<Order>(await ordersApi.list(role)));
    } catch (error) {
      show(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [role, show]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const filtered = useMemo(() => {
    if (tab === 'ALL') return orders;
    if (tab === 'HISTORY') return orders.filter((order) => ['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(order.status));
    return orders.filter((order) => order.status === tab);
  }, [orders, tab]);

  const updateStatus = async (order: Order, status: string) => {
    try {
      await ordersApi.updateStatus(order.id, status);
      await load();
      show('Da cap nhat don hang.', 'success');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  const report = async (order: Order) => {
    try {
      await reportsApi.create({ orderId: order.id, reason: 'Buyer report from mobile order screen' });
      show('Da gui report don hang.', 'success');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  return (
    <AppScreen title={role === 'seller' ? 'Don ban' : 'Orders & Returns'} subtitle="Theo doi trang thai nhu Shopee.">
      <View style={styles.tabs}>
        {tabs.map((item) => (
          <Pressable key={item.value} onPress={() => setTab(item.value)} style={[styles.tab, tab === item.value && styles.activeTab]}>
            <Text style={[styles.tabText, tab === item.value && styles.activeTabText]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      {loading ? <SkeletonList /> : null}
      {!loading && filtered.length === 0 ? <EmptyState title="Chua co don" body="Don hang phu hop se xuat hien tai day." /> : null}
      {filtered.map((order) => {
        const product = firstOrderProduct(order);
        const image = firstProductImage(product);
        return (
          <Card key={order.id}>
            <View style={styles.orderHead}>
              {image ? <Image source={{ uri: image }} style={styles.image} resizeMode="contain" /> : <View style={[styles.image, styles.noImage]} />}
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={styles.title}>{product?.title || 'Don hang REWORE'}</Text>
                <Text style={styles.shop}>{order.seller?.shopName || product?.seller?.shopName || 'REWORE seller'}</Text>
                <Text style={styles.price}>{formatVnd(order.totalAmount || order.total || product?.price)}</Text>
              </View>
            </View>
            <View style={styles.badges}>
              <StatusBadge label={order.status} tone={statusTone(order.status)} />
              <StatusBadge label={order.paymentStatus || 'PAYMENT'} tone={statusTone(order.paymentStatus)} />
            </View>
            <View style={styles.timeline}>
              {timeline.map((step) => (
                <Text key={step} style={styles.timelineItem}>
                  - {step}
                </Text>
              ))}
            </View>
            {role === 'buyer' && order.status === 'SHIPPED' ? (
              <AppButton title="Da nhan duoc hang" onPress={() => updateStatus(order, 'DELIVERED')} />
            ) : null}
            {role === 'seller' && order.status === 'PENDING' ? (
              <AppButton title="Xac nhan don" onPress={() => updateStatus(order, 'CONFIRMED')} />
            ) : null}
            {role === 'seller' && ['CONFIRMED', 'PAID'].includes(order.status) ? (
              <AppButton title="Giao cho van chuyen" onPress={() => updateStatus(order, 'SHIPPED')} />
            ) : null}
            {role === 'buyer' && order.status === 'DELIVERED' ? (
              <View style={{ gap: 8 }}>
                <TextField label="Danh gia shop" value={reviewText} onChangeText={setReviewText} multiline editable={false} placeholder="Review API chua san sang." />
                <AppButton title="Gui danh gia (sap co)" disabled />
              </View>
            ) : null}
            {role === 'buyer' ? <AppButton title="Report don hang" variant="secondary" onPress={() => report(order)} /> : null}
          </Card>
        );
      })}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tab: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
  },
  activeTab: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },
  tabText: {
    color: colors.ink,
    fontWeight: '700',
  },
  activeTabText: {
    color: colors.paper,
  },
  orderHead: {
    flexDirection: 'row',
    gap: 12,
  },
  image: {
    width: 88,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F2E7DB',
  },
  noImage: {
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: {
    color: colors.ink,
    fontWeight: '900',
  },
  shop: {
    color: colors.muted,
  },
  price: {
    color: colors.terracottaDark,
    fontWeight: '900',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeline: {
    gap: 3,
  },
  timelineItem: {
    color: colors.muted,
  },
});
