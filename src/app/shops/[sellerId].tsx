import { useLocalSearchParams } from 'expo-router';
import { PublicShopScreen } from '@/screens/buyer/PublicShopScreen';

export default function PublicShopRoute() {
  const { sellerId } = useLocalSearchParams<{ sellerId: string }>();
  return <PublicShopScreen sellerId={sellerId} />;
}
