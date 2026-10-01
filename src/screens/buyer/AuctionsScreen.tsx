import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { auctionsApi } from '@/api/endpoints';
import { AppScreen } from '@/components/AppScreen';
import { AppButton } from '@/components/AppButton';
import { Card } from '@/components/Section';
import { EmptyState, SkeletonList } from '@/components/StateViews';
import { StatusBadge, statusTone } from '@/components/StatusBadge';
import type { Auction } from '@/types/domain';
import { formatVnd, getErrorMessage, normalizeList } from '@/utils/format';
import { colors } from '@/components/theme';
import { useToastStore } from '@/stores/toastStore';

export function AuctionsScreen() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const show = useToastStore((state) => state.show);

  useEffect(() => {
    auctionsApi
      .list()
      .then((payload) => setAuctions(normalizeList<Auction>(payload)))
      .catch((error) => show(getErrorMessage(error), 'error'))
      .finally(() => setLoading(false));
  }, [show]);

  return (
    <AppScreen title="Auctions" subtitle="Dau gia cac mon premium du dieu kien.">
      {loading ? <SkeletonList /> : null}
      {!loading && auctions.length === 0 ? <EmptyState title="Chua co phien dau gia" body="Cac phien active se hien tai day." /> : null}
      {auctions.map((auction) => (
        <Card key={auction.id}>
          <Text style={{ color: colors.ink, fontWeight: '900' }}>{auction.product?.title || auction.productId || 'Auction item'}</Text>
          <Text style={{ color: colors.terracottaDark, fontWeight: '900' }}>
            Gia hien tai: {formatVnd(auction.currentPrice || auction.startPrice)}
          </Text>
          <Text style={{ color: colors.muted }}>Buoc gia: {formatVnd(auction.minIncrement)}</Text>
          <StatusBadge label={auction.status || 'ACTIVE'} tone={statusTone(auction.status)} />
          {auction.productId ? <AppButton title="Xem san pham" variant="secondary" onPress={() => router.push(`/products/${auction.productId}`)} /> : null}
        </Card>
      ))}
    </AppScreen>
  );
}
