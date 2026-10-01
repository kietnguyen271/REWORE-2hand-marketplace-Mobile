import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { cartApi, ordersApi } from '@/api/endpoints';
import { AddressForm, isValidAddress } from '@/components/AddressForm';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card, Section } from '@/components/Section';
import { EmptyState, SkeletonList } from '@/components/StateViews';
import { colors } from '@/components/theme';
import type { Address, CartItem } from '@/types/domain';
import { formatVnd, getErrorMessage, normalizeList } from '@/utils/format';
import { firstProductImage } from '@/utils/images';
import { useToastStore } from '@/stores/toastStore';

const blankAddress: Address = {
  receiverName: '',
  phone: '',
  province: '',
  district: '',
  ward: '',
  detailAddress: '',
  note: '',
};

export function CartScreen() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<Address>(blankAddress);
  const show = useToastStore((state) => state.show);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(normalizeList<CartItem>(await cartApi.list()));
    } catch (error) {
      show(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + (item.product?.price ?? 0), 0),
    [items],
  );

  const remove = async (productId: string) => {
    try {
      await cartApi.remove(productId);
      await load();
      show('Da xoa san pham khoi gio.', 'success');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  const checkout = async () => {
    if (!items.length) {
      show('Gio hang dang trong.', 'error');
      return;
    }
    if (!isValidAddress(address)) {
      show('Nhap day du dia chi nhan hang.', 'error');
      return;
    }

    try {
      await ordersApi.create({ productIds: items.map((item) => item.productId), address });
      show('Dat hang thanh cong.', 'success');
      router.replace('/orders');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  return (
    <AppScreen title="Gio hang" subtitle="Checkout nhieu san pham voi dia chi giao hang day du.">
      {loading ? <SkeletonList /> : null}
      {!loading && items.length === 0 ? <EmptyState title="Gio hang trong" body="Them san pham tu Shop de checkout." /> : null}
      {items.map((item) => {
        const product = item.product;
        const image = firstProductImage(product);
        return (
          <Card key={item.productId}>
            <View style={styles.item}>
              {image ? <Image source={{ uri: image }} style={styles.image} resizeMode="contain" /> : <View style={[styles.image, styles.noImage]} />}
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={styles.title}>{product?.title || item.productId}</Text>
                <Text style={styles.price}>{formatVnd(product?.price)}</Text>
                <AppButton title="Xoa" variant="danger" onPress={() => remove(item.productId)} />
              </View>
            </View>
          </Card>
        );
      })}
      {items.length ? (
        <Section title="Dia chi giao hang">
          <AddressForm onChange={setAddress} />
          <Text style={styles.total}>Tong tam tinh: {formatVnd(total)}</Text>
          <AppButton title="Checkout" onPress={checkout} />
        </Section>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: 12,
  },
  image: {
    width: 96,
    height: 112,
    borderRadius: 8,
    backgroundColor: '#F2E7DB',
  },
  noImage: {
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: {
    color: colors.ink,
    fontWeight: '800',
  },
  price: {
    color: colors.terracottaDark,
    fontWeight: '900',
  },
  total: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 17,
  },
});
