import { useLocalSearchParams } from 'expo-router';
import { SellerProductFormScreen } from '@/screens/seller/SellerScreens';

export default function SellerProductFormRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <SellerProductFormScreen id={id} />;
}
