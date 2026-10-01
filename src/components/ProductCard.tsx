import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '@/components/AppButton';
import { StatusBadge, statusTone } from '@/components/StatusBadge';
import { colors } from '@/components/theme';
import type { Product } from '@/types/domain';
import { formatVnd } from '@/utils/format';
import { firstProductImage } from '@/utils/images';

type Props = {
  product: Product;
  onAddCart?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
};

export function ProductCard({ product, onAddCart, onBuyNow }: Props) {
  const status = product.status || product.availability || 'AVAILABLE';
  const shopName = product.shop?.shopName || product.seller?.shopName || 'REWORE seller';
  const image = firstProductImage(product);

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/products/${product.id}`)}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={[styles.image, styles.noImage]}>
          <Text style={styles.noImageText}>Khong co anh</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.shop}>{shopName}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[product.brand, product.size, product.condition].filter(Boolean).join(' / ') || 'Hang tuyen chon'}
        </Text>
        <View style={styles.row}>
          <Text style={styles.price}>{formatVnd(product.price)}</Text>
          <StatusBadge label={status} tone={statusTone(status)} />
        </View>
        <View style={styles.actions}>
          <AppButton title="Them gio" variant="secondary" onPress={() => onAddCart?.(product)} style={styles.action} />
          <AppButton title="Mua ngay" onPress={() => onBuyNow?.(product)} style={styles.action} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 1.1,
    backgroundColor: '#F2E7DB',
  },
  noImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    color: colors.muted,
    fontWeight: '700',
  },
  body: {
    padding: 12,
    gap: 8,
  },
  shop: {
    color: colors.terracotta,
    fontWeight: '800',
    fontSize: 12,
  },
  title: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 21,
  },
  meta: {
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  price: {
    color: colors.terracottaDark,
    fontWeight: '900',
    fontSize: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
  },
});
