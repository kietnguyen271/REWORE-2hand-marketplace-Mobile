import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { cartApi, ordersApi, productsApi, reportsApi, wishlistApi } from '@/api/endpoints';
import { AddressForm, isValidAddress } from '@/components/AddressForm';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { Card, Section } from '@/components/Section';
import { LoadingState } from '@/components/StateViews';
import { StatusBadge, statusTone } from '@/components/StatusBadge';
import { TextField } from '@/components/TextField';
import { colors } from '@/components/theme';
import type { Address, Product } from '@/types/domain';
import { formatVnd, getErrorMessage } from '@/utils/format';
import { productImages } from '@/utils/images';
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

export function ProductDetailScreen({ id, checkout }: { id: string; checkout?: boolean }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<Address>(blankAddress);
  const [reportReason, setReportReason] = useState('');
  const show = useToastStore((state) => state.show);

  useEffect(() => {
    let mounted = true;
    productsApi
      .detail(id)
      .then((payload) => mounted && setProduct(payload))
      .catch((error) => show(getErrorMessage(error), 'error'))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id, show]);

  const addCart = async () => {
    try {
      await cartApi.add(id);
      show('Da them vao gio hang.', 'success');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  const addWishlist = async () => {
    try {
      await wishlistApi.add(id);
      show('Da luu vao wishlist.', 'success');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  const orderNow = async () => {
    if (!isValidAddress(address)) {
      show('Nhap day du dia chi nhan hang.', 'error');
      return;
    }

    try {
      await ordersApi.create({ productId: id, address });
      show('Dat hang thanh cong.', 'success');
      router.replace('/orders');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  const report = async () => {
    if (!reportReason.trim()) {
      show('Nhap ly do report.', 'error');
      return;
    }

    try {
      await reportsApi.create({ productId: id, reason: reportReason });
      setReportReason('');
      show('Da gui report.', 'success');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <LoadingState />
      </AppScreen>
    );
  }

  if (!product) {
    return (
      <AppScreen title="Khong tim thay">
        <AppButton title="Quay lai shop" onPress={() => router.back()} />
      </AppScreen>
    );
  }

  const images = productImages(product);
  const sellerId = product.sellerId || product.seller?.id || product.seller?.userId;

  return (
    <AppScreen title={product.title} subtitle={product.seller?.shopName || product.shop?.shopName || 'REWORE seller'}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
        {images.length ? (
          images.map((uri) => <Image key={uri} source={{ uri }} resizeMode="contain" style={styles.galleryImage} />)
        ) : (
          <View style={[styles.galleryImage, styles.noImage]}>
            <Text style={{ color: colors.muted }}>Khong co anh</Text>
          </View>
        )}
      </ScrollView>
      <Card>
        <Text style={styles.price}>{formatVnd(product.price)}</Text>
        <StatusBadge label={product.status || product.availability || 'AVAILABLE'} tone={statusTone(product.status || product.availability)} />
        <Text style={styles.description}>{product.description || 'Nguoi ban chua them mo ta.'}</Text>
        <Text style={styles.meta}>{[product.brand, product.size, product.condition, product.color].filter(Boolean).join(' / ')}</Text>
      </Card>
      <View style={styles.actions}>
        <AppButton title="Them gio" variant="secondary" onPress={addCart} style={{ flex: 1 }} />
        <AppButton title="Wishlist" variant="secondary" onPress={addWishlist} style={{ flex: 1 }} />
      </View>
      {sellerId ? <AppButton title="Xem shop" variant="secondary" onPress={() => router.push(`/shops/${sellerId}`)} /> : null}
      <Section title={checkout ? 'Dia chi giao hang' : 'Mua ngay'}>
        <AddressForm onChange={setAddress} />
        <AppButton title="Dat hang" onPress={orderNow} />
      </Section>
      <Section title="Report">
        <TextField label="Ly do" value={reportReason} onChangeText={setReportReason} multiline />
        <AppButton title="Gui report" variant="secondary" onPress={report} />
      </Section>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  gallery: {
    gap: 10,
  },
  galleryImage: {
    width: 260,
    height: 260,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  noImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  price: {
    color: colors.terracottaDark,
    fontWeight: '900',
    fontSize: 24,
  },
  description: {
    color: colors.ink,
    lineHeight: 21,
  },
  meta: {
    color: colors.muted,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});
