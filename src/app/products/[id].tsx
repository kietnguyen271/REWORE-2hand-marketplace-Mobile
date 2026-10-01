import { useLocalSearchParams } from 'expo-router';
import { ProductDetailScreen } from '@/screens/buyer/ProductDetailScreen';

export default function ProductDetailRoute() {
  const { id, checkout } = useLocalSearchParams<{ id: string; checkout?: string }>();
  return <ProductDetailScreen id={id} checkout={checkout === '1'} />;
}
