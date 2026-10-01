import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { productsApi, cartApi } from '@/api/endpoints';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { ProductCard } from '@/components/ProductCard';
import { SkeletonList, EmptyState } from '@/components/StateViews';
import { TextField } from '@/components/TextField';
import type { Product } from '@/types/domain';
import { compactParams, getErrorMessage, normalizeList } from '@/utils/format';
import { useToastStore } from '@/stores/toastStore';

export function ShopScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [status, setStatus] = useState('');
  const show = useToastStore((state) => state.show);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await productsApi.list(compactParams({ search, category, size, status }));
      setProducts(normalizeList<Product>(payload));
    } catch (error) {
      show(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [category, search, show, size, status]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const addCart = async (product: Product) => {
    try {
      await cartApi.add(product.id);
      show('Da them vao gio hang.', 'success');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  return (
    <AppScreen title="Shop" subtitle="Do 2hand tu cac seller REWORE." action={<AppButton title="Orders" variant="secondary" onPress={() => router.push('/orders')} />}>
      <TextField label="Tim kiem" value={search} onChangeText={setSearch} returnKeyType="search" onSubmitEditing={load} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextField label="Category" value={category} onChangeText={setCategory} style={{ minWidth: 0 }} />
        <TextField label="Size" value={size} onChangeText={setSize} style={{ minWidth: 0 }} />
      </View>
      <TextField label="Status" value={status} onChangeText={setStatus} placeholder="AVAILABLE, SOLD..." />
      <AppButton title="Loc san pham" variant="secondary" onPress={load} />
      {loading ? <SkeletonList /> : null}
      {!loading && products.length === 0 ? <EmptyState title="Chua co san pham" body="Thu doi bo loc hoac kiem tra API backend." /> : null}
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddCart={addCart}
          onBuyNow={() => router.push({ pathname: '/products/[id]', params: { id: product.id, checkout: '1' } })}
        />
      ))}
    </AppScreen>
  );
}
