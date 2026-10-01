import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { canSeller, isSellerOwner, sellerIdFor, useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import type { Auction, Order, PickedImage, Product, ProductCondition, SellerPermission } from '@/types/domain';
import { appendFile, appendFiles } from '@/utils/images';
import { formatVnd, getErrorMessage, hasVerifiedEmail, normalizeList } from '@/utils/format';
import { OrdersScreen } from '@/screens/buyer/OrdersScreen';

const permissions: SellerPermission[] = ['VIEW_DASHBOARD', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_AUCTIONS'];

export function SellerApplicationScreen() {
  const user = useAuthStore((state) => state.user);
  const show = useToastStore((state) => state.show);
  const [form, setForm] = useState({
    shopName: '',
    legalName: '',
    phone: '',
    pickupAddress: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountHolder: '',
    vietQr: '',
    sellingDescription: '',
    acceptedSellerTerms: false,
  });
  const [front, setFront] = useState<PickedImage | null>(null);
  const [back, setBack] = useState<PickedImage | null>(null);
  const [selfie, setSelfie] = useState<PickedImage | null>(null);

  const update = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    if (!user || !hasVerifiedEmail(user)) {
      show('Can verify email truoc khi dang ky seller.', 'error');
      return;
    }
    if (!form.shopName || !form.legalName || !front || !back || !form.phone || !form.pickupAddress || !form.bankAccountNumber || !form.bankAccountHolder || !form.acceptedSellerTerms) {
      show('Nhap day du thong tin bat buoc va anh CCCD.', 'error');
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, String(value)));
    appendFile(data, 'idCardFrontImage', front);
    appendFile(data, 'idCardBackImage', back);
    appendFile(data, 'selfieImage', selfie);

    try {
      const result = await sellerApi.apply(data);
      if (result && typeof result === 'object' && 'requiresOtp' in result) {
        router.push({ pathname: '/(auth)/verify-otp', params: { email: String((result as { email?: string }).email || user.email) } });
        return;
      }
      show('Da gui ho so seller.', 'success');
      router.back();
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  return (
    <AppScreen title="Dang ky seller" subtitle="Upload anh CCCD bang file uri that tu ImagePicker.">
      <TextField label="Ten shop" value={form.shopName} onChangeText={(value) => update('shopName', value)} />
      <TextField label="Ten phap ly" value={form.legalName} onChangeText={(value) => update('legalName', value)} />
      <TextField label="So dien thoai" value={form.phone} onChangeText={(value) => update('phone', value)} keyboardType="phone-pad" />
      <TextField label="Dia chi lay hang" value={form.pickupAddress} onChangeText={(value) => update('pickupAddress', value)} multiline />
      <ImagePickerField label="CCCD mat truoc" onChange={(images) => setFront(images[0] ?? null)} />
      <ImagePickerField label="CCCD mat sau" onChange={(images) => setBack(images[0] ?? null)} />
      <ImagePickerField label="Selfie neu backend ho tro" onChange={(images) => setSelfie(images[0] ?? null)} />
      <TextField label="Ngan hang" value={form.bankName} onChangeText={(value) => update('bankName', value)} />
      <TextField label="So tai khoan" value={form.bankAccountNumber} onChangeText={(value) => update('bankAccountNumber', value)} />
      <TextField label="Chu tai khoan" value={form.bankAccountHolder} onChangeText={(value) => update('bankAccountHolder', value)} />
      <TextField label="VietQR optional" value={form.vietQr} onChangeText={(value) => update('vietQr', value)} />
      <TextField label="Mo ta hang ban" value={form.sellingDescription} onChangeText={(value) => update('sellingDescription', value)} multiline />
      <Pressable style={styles.checkRow} onPress={() => update('acceptedSellerTerms', !form.acceptedSellerTerms)}>
        <View style={[styles.checkbox, form.acceptedSellerTerms && styles.checked]} />
        <Text style={{ color: colors.ink, flex: 1 }}>Toi dong y dieu khoan seller REWORE.</Text>
      </Pressable>
      <AppButton title="Gui ho so" onPress={submit} />
    </AppScreen>
  );
}

export function SellerStudioScreen() {
  const user = useAuthStore((state) => state.user);
  const show = useToastStore((state) => state.show);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [eligibility, setEligibility] = useState<Record<string, unknown> | null>(null);
  const [subscription, setSubscription] = useState<Record<string, unknown> | null>(null);
  const sellerId = sellerIdFor(user);

  useEffect(() => {
    Promise.allSettled([
      productsApi.list({ sellerId }),
      ordersApi.list('seller'),
      sellerApi.auctionEligibility(),
      sellerApi.subscription(),
    ]).then((results) => {
      const [productResult, orderResult, eligibilityResult, subscriptionResult] = results;
      if (productResult.status === 'fulfilled') setProducts(normalizeList<Product>(productResult.value));
      if (orderResult.status === 'fulfilled') setOrders(normalizeList<Order>(orderResult.value));
      if (eligibilityResult.status === 'fulfilled') setEligibility(eligibilityResult.value as Record<string, unknown>);
      if (subscriptionResult.status === 'fulfilled') setSubscription(subscriptionResult.value as Record<string, unknown>);
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
    <AppScreen title="Seller Studio" subtitle={user.sellerStaffAccess ? 'Staff access' : 'Owner workspace'}>
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
        <Text style={styles.cardTitle}>Premium</Text>
        <StatusBadge label={String(subscription?.status || subscription?.plan || 'Chua dang ky')} tone={statusTone(String(subscription?.status || ''))} />
        {isSellerOwner(user) ? <AppButton title="Dang ky Premium" onPress={() => router.push('/seller/premium')} /> : null}
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Auction eligibility</Text>
        <Text style={styles.muted}>{String(eligibility?.eligible ?? eligibility?.isEligible ?? false) === 'true' ? 'Shop du dieu kien dau gia.' : 'Can premium/du dieu kien de mo dau gia.'}</Text>
      </Card>
      {canSeller(user, 'MANAGE_PRODUCTS') ? <AppButton title="Quan ly san pham" onPress={() => router.push('/seller/products')} /> : null}
      {canSeller(user, 'MANAGE_ORDERS') ? <AppButton title="Quan ly don hang" onPress={() => router.push('/seller/orders')} /> : null}
      {canSeller(user, 'MANAGE_AUCTIONS') ? <AppButton title="Seller Auctions" onPress={() => router.push('/seller/auctions')} /> : null}
      {isSellerOwner(user) ? <AppButton title="Quan ly nhan vien" variant="secondary" onPress={() => router.push('/seller/staff')} /> : null}
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
  const [eligibility, setEligibility] = useState<Record<string, unknown> | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [form, setForm] = useState({ productId: '', startPrice: '', minIncrement: '', startTime: '', endTime: '' });

  const load = useCallback(async () => {
    try {
      const [eligible, auctionPayload] = await Promise.all([sellerApi.auctionEligibility(), auctionsApi.list()]);
      setEligibility(eligible as Record<string, unknown>);
      setAuctions(normalizeList<Auction>(auctionPayload));
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  }, [show]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const eligible = String(eligibility?.eligible ?? eligibility?.isEligible ?? false) === 'true';

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
      {!eligible ? (
        <Card>
          <Text style={styles.cardTitle}>Auction locked</Text>
          <Text style={styles.muted}>Shop can premium hoac du dieu kien truoc khi tao phien dau gia.</Text>
        </Card>
      ) : (
        <Section title="Tao auction">
          {Object.entries(form).map(([key, value]) => (
            <TextField key={key} label={key} value={value} onChangeText={(next) => setForm((current) => ({ ...current, [key]: next }))} />
          ))}
          <AppButton title="Tao auction" onPress={submit} />
        </Section>
      )}
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

export function SellerPremiumScreen() {
  const [subscription, setSubscription] = useState<Record<string, unknown> | null>(null);
  const show = useToastStore((state) => state.show);

  useEffect(() => {
    sellerApi.subscription().then((payload) => setSubscription(payload as Record<string, unknown>)).catch((error) => show(getErrorMessage(error), 'error'));
  }, [show]);

  const request = async () => {
    try {
      await sellerApi.requestSubscription();
      show('Da gui request Premium cho admin duyet.', 'success');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  return (
    <AppScreen title="Seller Premium">
      <Card>
        <Text style={styles.cardTitle}>Current plan</Text>
        <Text style={styles.bigValue}>{String(subscription?.plan || 'Free')}</Text>
        <Text style={styles.muted}>Gia: {formatVnd(typeof subscription?.price === 'number' ? subscription.price : undefined)}</Text>
        <StatusBadge label={String(subscription?.status || 'NONE')} tone={statusTone(String(subscription?.status || ''))} />
      </Card>
      <AppButton title="Dang ky Premium" onPress={request} />
    </AppScreen>
  );
}

export function SellerStaffScreen() {
  const user = useAuthStore((state) => state.user);
  const show = useToastStore((state) => state.show);
  const [staff, setStaff] = useState<Record<string, unknown>[]>([]);
  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState<SellerPermission[]>(['VIEW_DASHBOARD']);

  const load = useCallback(async () => {
    try {
      setStaff(normalizeList<Record<string, unknown>>(await sellerApi.staff()));
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  }, [show]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  if (!isSellerOwner(user)) {
    return (
      <AppScreen title="Nhan vien">
        <EmptyState title="Owner only" body="Staff khong co quyen quan ly nhan vien." />
      </AppScreen>
    );
  }

  const toggle = (permission: SellerPermission) =>
    setSelected((current) => (current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]));

  const invite = async () => {
    if (!email || selected.length === 0) {
      show('Nhap email va chon quyen.', 'error');
      return;
    }
    try {
      await sellerApi.inviteStaff({ email, permissions: selected });
      setEmail('');
      await load();
      show('Da them nhan vien.', 'success');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  const revoke = async (id: string) => {
    try {
      await sellerApi.revokeStaff(id);
      await load();
      show('Da revoke nhan vien.', 'success');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  return (
    <AppScreen title="Quan ly nhan vien">
      <TextField label="Email/Gmail nhan vien" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <View style={styles.permissionGrid}>
        {permissions.map((permission) => (
          <Pressable key={permission} onPress={() => toggle(permission)} style={[styles.permission, selected.includes(permission) && styles.permissionActive]}>
            <Text style={[styles.permissionText, selected.includes(permission) && styles.permissionTextActive]}>{permission}</Text>
          </Pressable>
        ))}
      </View>
      <AppButton title="Cap quyen" onPress={invite} />
      <Section title="Nhan vien active">
        {staff.length === 0 ? <EmptyState title="Chua co nhan vien" /> : null}
        {staff.map((member) => (
          <Card key={String(member.id || member.email)}>
            <Text style={styles.cardTitle}>{String(member.email || 'Staff')}</Text>
            <Text style={styles.muted}>{String(member.status || 'ACTIVE')}</Text>
            <Text style={styles.muted}>{Array.isArray(member.permissions) ? member.permissions.join(', ') : ''}</Text>
            {member.id ? <AppButton title="Revoke" variant="danger" onPress={() => revoke(String(member.id))} /> : null}
          </Card>
        ))}
      </Section>
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
  permissionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permission: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  permissionActive: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },
  permissionText: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 12,
  },
  permissionTextActive: {
    color: colors.paper,
  },
});
