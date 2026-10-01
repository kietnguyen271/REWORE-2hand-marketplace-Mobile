import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { wishlistApi } from '@/api/endpoints';
import { AppScreen } from '@/components/AppScreen';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState, SkeletonList } from '@/components/StateViews';
import type { Product, WishlistItem } from '@/types/domain';
import { getErrorMessage, normalizeList } from '@/utils/format';
import { useToastStore } from '@/stores/toastStore';

export function WishlistScreen() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const show = useToastStore((state) => state.show);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(normalizeList<WishlistItem>(await wishlistApi.list()));
    } catch (error) {
      show(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const remove = async (product: Product) => {
    try {
      await wishlistApi.remove(product.id);
      await load();
      show('Da bo khoi wishlist.', 'success');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  return (
    <AppScreen title="Wishlist" subtitle="Nhung mon ban dang de mat.">
      {loading ? <SkeletonList /> : null}
      {!loading && items.length === 0 ? <EmptyState title="Wishlist trong" body="Luu san pham yeu thich tu trang chi tiet." /> : null}
      {items.map((item) =>
        item.product ? (
          <ProductCard
            key={item.productId}
            product={item.product}
            onAddCart={remove}
            onBuyNow={(product) => router.push(`/products/${product.id}`)}
          />
        ) : null,
      )}
    </AppScreen>
  );
}
