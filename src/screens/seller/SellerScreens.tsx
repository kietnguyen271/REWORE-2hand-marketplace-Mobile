import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { auctionsApi, ordersApi, productsApi, sellerApi } from '@/api/endpoints';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card, Section } from '@/components/Section';
import { EmptyState, SkeletonList } from '@/components/StateViews';
import { StatusBadge, statusTone } from '@/components/StatusBadge';
import { TextField } from '@/components/TextField';
import { ImagePickerField } from '@/components/ImagePickerField';
import { colors } from '@/components/theme';
import { sellerIdFor, useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import type { Auction, Order, PickedImage, Product, ProductCondition } from '@/types/domain';
import { appendFiles } from '@/utils/images';
import { formatVnd, getErrorMessage, normalizeList } from '@/utils/format';
import { OrdersScreen } from '@/screens/buyer/OrdersScreen';

export function SellerStudioScreen() {
  const user = useAuthStore((state) => state.user);
  const show = useToastStore((state) => state.show);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [platformFees, setPlatformFees] = useState<{ rate?: number; total?: number; pendingPayout?: number } | null>(null);
  const sellerId = sellerIdFor(user);

  useEffect(() => {
    Promise.allSettled([
      productsApi.list({ sellerId }),
      ordersApi.list('seller'),
      sellerApi.stats(),
    ]).then((results) => {
      const [productResult, orderResult, statsResult] = results;
      if (productResult.status === 'fulfilled') setProducts(normalizeList<Product>(productResult.value));
      if (orderResult.status === 'fulfilled') setOrders(normalizeList<Order>(orderResult.value));
      if (statsResult.status === 'fulfilled') {
        const payload = statsResult.value as { data?: { platformFees?: { rate?: number; total?: number }; payout?: { pending?: number } } };
        setPlatformFees(payload.data?.platformFees ? { ...payload.data.platformFees, pendingPayout: payload.data.payout?.pending } : null);
      }
      results.filter((result) => result.status === 'rejected').forEach((result) => show(getErrorMessage(result.reason), 'error'));
    });
  }, [sellerId, show]);

  if (!user) {
    return (
      <AppScreen title="Seller Studio">
        <AppButton title="Dang nhap" onPress={() => router.push('/(auth)/login')} />
      </AppScreen>
    );
  }

  const activeProducts = products.filter((product) => product.status === 'AVAILABLE').length;
  const sold = products.filter((product) => product.status === 'SOLD').length;
  const pendingOrders = orders.filter((order) => order.status === 'PENDING').length;
  const revenue = orders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);

  return (
    <AppScreen title="Seller Studio" subtitle="Quan ly shop">
      <View style={styles.stats}>
        <Stat label="Products" value={products.length} />
        <Stat label="Active" value={activeProducts} />
        <Stat label="Sold" value={sold} />
        <Stat label="Pending" value={pendingOrders} />
      </View>
      <Card>
        <Text style={styles.bigValue}>{formatVnd(revenue)}</Text>
        <Text style={styles.muted}>Revenue tam tinh tu API orders seller.</Text>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Phi san</Text>
        <Text style={styles.muted}>San tru {platformFees?.rate ?? 5}% gia hang cua don hoan tat vao tien thanh toan cho ban.</Text>
        <Text style={styles.bigValue}>{formatVnd(platformFees?.total ?? 0)}</Text>
        <Text style={styles.muted}>Cho san chuyen khoan: {formatVnd(platformFees?.pendingPayout ?? 0)}</Text>
      </Card>
      <AppButton title="Quan ly san pham" onPress={() => router.push('/seller/products')} />
      <AppButton title="Quan ly don hang" onPress={() => router.push('/seller/orders')} />
      <AppButton title="Seller Auctions" onPress={() => router.push('/seller/auctions')} />
    </AppScreen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function SellerProductsScreen() {
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const show = useToastStore((state) => state.show);
  const sellerId = sellerIdFor(user);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(normalizeList<Product>(await productsApi.list({ sellerId })));
    } catch (error) {
      show(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [sellerId, show]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const remove = async (product: Product) => {
    try {
      await productsApi.remove(product.id);
      await load();
      show('Da xoa san pham.', 'success');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  return (
    <AppScreen title="Seller Products" action={<AppButton title="Them" onPress={() => router.push('/seller/product-form')} />}>
      {loading ? <SkeletonList /> : null}
      {!loading && products.length === 0 ? <EmptyState title="Chua co san pham" /> : null}
      {products.map((product) => (
        <Card key={product.id}>
          <Text style={styles.cardTitle}>{product.title}</Text>
          <Text style={styles.bigValue}>{formatVnd(product.price)}</Text>
          <StatusBadge label={product.status || 'AVAILABLE'} tone={statusTone(product.status)} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <AppButton title="Sua" variant="secondary" onPress={() => router.push({ pathname: '/seller/product-form', params: { id: product.id } })} style={{ flex: 1 }} />
            <AppButton title="Xoa" variant="danger" onPress={() => remove(product)} style={{ flex: 1 }} />
          </View>
        </Card>
      ))}
    </AppScreen>
  );
}

export function SellerProductFormScreen({ id }: { id?: string }) {
  const show = useToastStore((state) => state.show);
  const [images, setImages] = useState<PickedImage[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'GOOD' as ProductCondition,
    brand: '',
    size: '',
    color: '',
    tags: '',
  });

  useEffect(() => {
    if (!id) return;
    productsApi
      .detail(id)
      .then((product) =>
        setForm({
          title: product.title || '',
          description: product.description || '',
          price: String(product.price || ''),
          category: product.category || '',
          condition: (product.condition as ProductCondition) || 'GOOD',
          brand: product.brand || '',
          size: product.size || '',
          color: product.color || '',
          tags: Array.isArray(product.tags) ? product.tags.join(', ') : String(product.tags || ''),
        }),
      )
      .catch((error) => show(getErrorMessage(error), 'error'));
  }, [id, show]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!form.title || !form.description || !form.price || !form.category) {
      show('Nhap title, description, price va category.', 'error');
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    appendFiles(data, 'productImages', images);

    try {
      if (id) {
        await productsApi.update(id, data);
      } else {
        await productsApi.create(data);
      }
      show(id ? 'Da cap nhat san pham.' : 'Da tao san pham.', 'success');
      router.replace('/seller/products');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  return (
    <AppScreen title={id ? 'Sua san pham' : 'Them san pham'}>
      <TextField label="Title" value={form.title} onChangeText={(value) => update('title', value)} />
      <TextField label="Description" value={form.description} onChangeText={(value) => update('description', value)} multiline />
      <TextField label="Price" value={form.price} onChangeText={(value) => update('price', value)} keyboardType="numeric" />
      <TextField label="Category" value={form.category} onChangeText={(value) => update('category', value)} />
      <TextField label="Condition" value={form.condition} onChangeText={(value) => update('condition', value)} placeholder="NEW / LIKE_NEW / GOOD / FAIR / POOR" />
      <TextField label="Brand optional" value={form.brand} onChangeText={(value) => update('brand', value)} />
      <TextField label="Size optional" value={form.size} onChangeText={(value) => update('size', value)} />
      <TextField label="Color optional" value={form.color} onChangeText={(value) => update('color', value)} />
      <TextField label="Tags optional" value={form.tags} onChangeText={(value) => update('tags', value)} />
      <ImagePickerField label="Anh san pham" multiple onChange={setImages} />
      <AppButton title={id ? 'Luu thay doi' : 'Dang san pham'} onPress={submit} />
    </AppScreen>
  );
}

export function SellerOrdersScreen() {
  return <OrdersScreen role="seller" />;
}

export function SellerAuctionsScreen() {
  const show = useToastStore((state) => state.show);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [form, setForm] = useState({ productId: '', startPrice: '', minIncrement: '', startTime: '', endTime: '' });

  const load = useCallback(async () => {
    try {
      const auctionPayload = await auctionsApi.list();
      setAuctions(normalizeList<Auction>(auctionPayload));
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  }, [show]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const submit = async () => {
    if (!form.productId || !form.startPrice || !form.minIncrement || !form.startTime || !form.endTime) {
      show('Nhap day du thong tin auction.', 'error');
      return;
    }
    try {
      await auctionsApi.create(form);
      setForm({ productId: '', startPrice: '', minIncrement: '', startTime: '', endTime: '' });
      await load();
      show('Da tao auction.', 'success');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  return (
    <AppScreen title="Seller Auctions">
      <Section title="Tao auction">
          {Object.entries(form).map(([key, value]) => (
            <TextField key={key} label={key} value={value} onChangeText={(next) => setForm((current) => ({ ...current, [key]: next }))} />
          ))}
          <AppButton title="Tao auction" onPress={submit} />
      </Section>
      {auctions.map((auction) => (
        <Card key={auction.id}>
          <Text style={styles.cardTitle}>{auction.product?.title || auction.productId}</Text>
          <Text style={styles.bigValue}>{formatVnd(auction.currentPrice || auction.startPrice)}</Text>
          <StatusBadge label={auction.status || 'ACTIVE'} tone={statusTone(auction.status)} />
        </Card>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  checked: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stat: {
    minWidth: '47%',
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 4,
  },
  statValue: {
    color: colors.terracottaDark,
    fontWeight: '900',
    fontSize: 24,
  },
  bigValue: {
    color: colors.terracottaDark,
    fontWeight: '900',
    fontSize: 22,
  },
  muted: {
    color: colors.muted,
  },
  cardTitle: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 16,
  },
});
