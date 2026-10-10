/**
 * REWORE Mobile – HomeScreen (Màn hình Khám Phá Mới)
 * Guest mode: hiển thị content, lock action cần auth → GateModal bottom sheet
 * Design từ UI/17: Curated Stories, Live Auctions, Upcoming Drops, For You
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  ChevronRight,
  Eye,
  Heart,
  Lock,
  Search,
  SlidersHorizontal,
} from 'lucide-react-native';
import { productsApi } from '@/api/endpoints';
import { GateModal } from '@/components/GateModal';
import { colors } from '@/components/theme';
import { useAuthStore } from '@/stores/authStore';
import type { Product } from '@/types/domain';
import { firstProductImage } from '@/utils/images';
import { formatVnd, normalizeList } from '@/utils/format';

const { width: SW } = Dimensions.get('window');

// ─── Data ────────────────────────────────────────────────────────────────────

const STORIES = [
  {
    id: 's1',
    label: "Tonight's Drop",
    ring: '#974226',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=120&fit=crop&crop=center',
  },
  {
    id: 's2',
    label: 'Live Auctions',
    ring: '#ba1a1a',
    img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&h=120&fit=crop&crop=center',
  },
  {
    id: 's3',
    label: 'Y2K Revival',
    ring: '#DBC1B9',
    img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=120&h=120&fit=crop&crop=face',
  },
  {
    id: 's4',
    label: 'Cozy Knits',
    ring: '#DBC1B9',
    img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=120&h=120&fit=crop&crop=center',
  },
  {
    id: 's5',
    label: 'Archive 90s',
    ring: '#DBC1B9',
    img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=120&h=120&fit=crop&crop=center',
  },
];

const LIVE_AUCTIONS = [
  {
    id: 'a1',
    title: 'Saint Laurent Trench',
    price: 4200000,
    watchers: 34,
    timer: '08m 14s',
    img: 'https://images.unsplash.com/photo-1559181567-c3190ca9be23?w=400&h=500&fit=crop&crop=center',
  },
  {
    id: 'a2',
    title: 'Burberry Check Scarf',
    price: 1850000,
    watchers: 19,
    timer: '14m 20s',
    img: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=500&fit=crop&crop=center',
  },
  {
    id: 'a3',
    title: 'Prada Tessuto Bag',
    price: 3100000,
    watchers: 42,
    timer: '21m 05s',
    img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=500&fit=crop&crop=center',
  },
];

const DROPS = [
  {
    id: 'd1',
    title: 'Parisian Tailoring',
    sub: 'Curated 14 Archival Pieces',
    timer: 'Drops in 02:45:10',
    img: 'https://images.unsplash.com/photo-1529139574466-a303027614b2?w=400&h=200&fit=crop&crop=center',
  },
  {
    id: 'd2',
    title: '1990s Italian Knitwear',
    sub: 'Milanese Private Estate',
    timer: 'Drops in 2d 14h',
    img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=200&fit=crop&crop=center',
  },
  {
    id: 'd3',
    title: 'Tokyo Selvedge Denim',
    sub: 'Archival Rare Washes',
    timer: 'Drops in 4d 08h',
    img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=200&fit=crop&crop=center',
  },
];

const FALLBACK_FOR_YOU: Product[] = [
  {
    id: 'fy1',
    title: 'Leather Bomber',
    description: '',
    price: 3400000,
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=380&fit=crop&crop=center'],
    category: 'jackets',
    condition: 'GOOD',
    status: 'AVAILABLE',
    size: 'M',
    brand: 'Old Soul Studio',
    seller: { shopName: 'Old Soul Studio', avatar: '' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fy2',
    title: '1993 Deadstock 501',
    description: '',
    price: 1800000,
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=380&fit=crop&crop=center'],
    category: 'denim',
    condition: 'LIKE_NEW',
    status: 'AVAILABLE',
    size: 'W30 L32',
    brand: 'Maison Rework',
    seller: { shopName: 'Maison Rework', avatar: '' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fy3',
    title: 'Chunky Cardigan',
    description: '',
    price: 2150000,
    images: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=380&fit=crop&crop=center'],
    category: 'vintage',
    condition: 'LIKE_NEW',
    status: 'AVAILABLE',
    size: 'S',
    brand: 'Atelier Nord',
    seller: { shopName: 'Atelier Nord', avatar: '' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fy4',
    title: 'Silk Slip Dress',
    description: '',
    price: 1250000,
    images: ['https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=300&h=380&fit=crop&crop=center'],
    category: 'minimalist',
    condition: 'LIKE_NEW',
    status: 'AVAILABLE',
    size: 'Free',
    brand: 'Silk & Stone',
    seller: { shopName: 'Silk & Stone', avatar: '' },
    createdAt: new Date().toISOString(),
  },
];

// ─── Live dot component ───────────────────────────────────────────────────────

function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.7, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);
  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#ba1a1a',
          opacity: 0.4,
          transform: [{ scale: pulse }],
        }}
      />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ba1a1a' }} />
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isGuest = !user;

  const [forYouProducts, setForYouProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  // Gate modal state
  const [gateVisible, setGateVisible] = useState(false);
  const [gateFeature, setGateFeature] = useState<string | undefined>();

  const openGate = useCallback((featureName?: string) => {
    if (isGuest) {
      setGateFeature(featureName);
      setGateVisible(true);
      return true;
    }
    return false;
  }, [isGuest]);

  const loadForYou = useCallback(async () => {
    try {
      const payload = await productsApi.list({});
      const list = normalizeList<Product>(payload);
      setForYouProducts(list.length > 0 ? list.slice(0, 8) : FALLBACK_FOR_YOU);
    } catch {
      setForYouProducts(FALLBACK_FOR_YOU);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadForYou();
  }, [loadForYou]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadForYou();
  };

  const toggleWishlist = (id: string) => {
    if (openGate('Yêu thích')) return;
    setWishlistIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Sections ──────────────────────────────────────────────────────────────

  const renderCuratedStories = () => (
    <View style={sty.section}>
      <View style={sty.sectionHeader}>
        <Text style={sty.sectionTitle}>Curated Stories</Text>
        <TouchableOpacity style={sty.seeAllBtn} onPress={() => openGate('Stories')} activeOpacity={0.7}>
          <Text style={sty.seeAllText}>See all</Text>
          <ChevronRight size={13} color="#55433D" strokeWidth={2} />
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 14, paddingBottom: 4 }}
      >
        {STORIES.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={sty.storyItem}
            onPress={() => openGate(s.label)}
            activeOpacity={0.8}
          >
            <View style={[sty.storyRingWrap, { borderColor: s.ring }]}>
              <Image source={{ uri: s.img }} style={sty.storyImg} />
            </View>
            <Text style={sty.storyLabel} numberOfLines={1}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderLiveAuctions = () => (
    <View style={sty.section}>
      <View style={sty.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <LiveDot />
          <Text style={sty.sectionTitle}>Live Auctions</Text>
        </View>
        <TouchableOpacity
          style={sty.seeAllBtn}
          onPress={() => {
            if (!openGate('Đấu giá')) router.push('/(tabs)/auctions');
          }}
          activeOpacity={0.7}
        >
          <Text style={sty.seeAllText}>See all</Text>
          <ChevronRight size={13} color="#55433D" strokeWidth={2} />
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 4 }}
      >
        {LIVE_AUCTIONS.map((a) => (
          <View key={a.id} style={sty.auctionCard}>
            <View style={sty.auctionImgWrap}>
              <Image source={{ uri: a.img }} style={sty.auctionImg} resizeMode="cover" />
              {/* LIVE badge */}
              <View style={sty.liveBadge}>
                <View style={sty.liveDot} />
                <Text style={sty.liveBadgeText}>LIVE</Text>
              </View>
              {/* Timer */}
              <View style={sty.timerBadge}>
                <Text style={sty.timerText}>{a.timer}</Text>
              </View>
            </View>
            <View style={sty.auctionBody}>
              <Text style={sty.auctionTitle} numberOfLines={1}>{a.title}</Text>
              <Text style={sty.auctionPrice}>{formatVnd(a.price)}</Text>
              <View style={sty.watcherRow}>
                <Eye size={11} color="#55433D" strokeWidth={2} />
                <Text style={sty.watcherText}>{a.watchers} watchers</Text>
              </View>
            </View>
            <TouchableOpacity
              style={sty.bidBtn}
              activeOpacity={0.85}
              onPress={() => openGate(`Bid – ${a.title}`)}
            >
              <Lock size={12} color="#974226" strokeWidth={2.5} />
              <Text style={sty.bidBtnText}>Bid</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderUpcomingDrops = () => (
    <View style={sty.section}>
      <View style={sty.sectionHeader}>
        <Text style={sty.sectionTitle}>Upcoming Drops</Text>
        <TouchableOpacity
          style={sty.seeAllBtn}
          onPress={() => router.push('/(tabs)/drops')}
          activeOpacity={0.7}
        >
          <Text style={sty.seeAllText}>See all</Text>
          <ChevronRight size={13} color="#55433D" strokeWidth={2} />
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 4 }}
      >
        {DROPS.map((d) => (
          <View key={d.id} style={sty.dropCard}>
            <View style={sty.dropImgWrap}>
              <Image source={{ uri: d.img }} style={sty.dropImg} resizeMode="cover" />
              <View style={sty.dropGradient} />
              <View style={sty.dropTimer}>
                <Text style={sty.dropTimerText}>{d.timer}</Text>
              </View>
            </View>
            <View style={sty.dropBody}>
              <View style={{ flex: 1, overflow: 'hidden' }}>
                <Text style={sty.dropTitle} numberOfLines={1}>{d.title}</Text>
                <Text style={sty.dropSub} numberOfLines={1}>{d.sub}</Text>
              </View>
              <TouchableOpacity
                style={sty.bellBtn}
                onPress={() => openGate('Drop Notifications')}
                activeOpacity={0.8}
              >
                <Bell size={15} color="#974226" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderForYouHeader = () => (
    <View style={sty.section}>
      {renderCuratedStories()}
      {renderLiveAuctions()}
      {renderUpcomingDrops()}

      {/* For You header */}
      <View style={[sty.sectionHeader, { marginTop: 4 }]}>
        <Text style={sty.sectionTitle}>For You</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={sty.filterBtn} onPress={() => openGate('Filters')} activeOpacity={0.8}>
            <SlidersHorizontal size={12} color="#231A11" strokeWidth={2.5} />
            <Text style={sty.filterBtnText}>Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sty.seeAllBtn} activeOpacity={0.7}>
            <Text style={sty.seeAllText}>See all</Text>
            <ChevronRight size={13} color="#55433D" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render For You product grid (2 columns)
  const renderForYou = () => {
    const rows: Product[][] = [];
    for (let i = 0; i < forYouProducts.length; i += 2) {
      rows.push(forYouProducts.slice(i, i + 2));
    }
    return (
      <View style={sty.forYouGrid}>
        {rows.map((row, ri) => (
          <View key={ri} style={sty.gridRow}>
            {row.map((p) => {
              const img = firstProductImage(p);
              const liked = wishlistIds.has(p.id);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={sty.productCard}
                  onPress={() => router.push({ pathname: '/products/[id]', params: { id: p.id } })}
                  activeOpacity={0.9}
                >
                  <View style={sty.productImgWrap}>
                    {img ? (
                      <Image source={{ uri: img }} style={sty.productImg} resizeMode="cover" />
                    ) : (
                      <View style={[sty.productImg, { backgroundColor: '#F2DFD1' }]} />
                    )}
                    {/* Heart */}
                    <TouchableOpacity
                      style={sty.heartBtn}
                      onPress={() => toggleWishlist(p.id)}
                      hitSlop={8}
                    >
                      <Heart
                        size={14}
                        color={liked ? '#ba1a1a' : '#55433D'}
                        fill={liked ? '#ba1a1a' : 'transparent'}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                    {/* Size tag */}
                    {p.size ? (
                      <View style={sty.sizeTag}>
                        <Text style={sty.sizeTagText}>{p.size}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={sty.productBody}>
                    <Text style={sty.productShop} numberOfLines={1}>{p.seller?.shopName || 'REWORE'}</Text>
                    <Text style={sty.productTitle} numberOfLines={1}>{p.title}</Text>
                    <Text style={sty.productPrice}>{formatVnd(p.price)}</Text>
                  </View>
                  <TouchableOpacity
                    style={sty.holdBtn}
                    onPress={() => openGate(`Hold – ${p.title}`)}
                    activeOpacity={0.85}
                  >
                    <Lock size={12} color="#fff" strokeWidth={2.5} />
                    <Text style={sty.holdBtnText}>Hold</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
            {/* If odd row, fill empty space */}
            {row.length === 1 && <View style={[sty.productCard, { opacity: 0 }]} />}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={sty.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.terracotta}
            colors={[colors.terracotta]}
          />
        }
      >
        {/* ── App Bar ── */}
        <View style={[sty.appBar, { paddingTop: insets.top + 6 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={sty.logo}>REWORE.</Text>
            {isGuest && (
              <View style={sty.guestBadge}>
                <Text style={sty.guestBadgeText}>GUEST</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity style={sty.iconBtn} onPress={() => openGate('Tìm kiếm')} activeOpacity={0.8}>
              <Search size={19} color="#231A11" strokeWidth={1.9} />
            </TouchableOpacity>
            {isGuest && (
              <>
                <TouchableOpacity
                  style={sty.loginBtn}
                  activeOpacity={0.8}
                  onPress={() => router.push('/(auth)/login')}
                >
                  <Text style={sty.loginBtnText}>Log in</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={sty.signupBtn}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(auth)/register')}
                >
                  <Text style={sty.signupBtnText}>Sign up</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* ── Guest Banner ── */}
        {isGuest && (
          <TouchableOpacity
            style={sty.guestBanner}
            onPress={() => openGate('Giữ hàng & Đấu giá')}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Lock size={14} color="#974226" strokeWidth={2} />
              <Text style={sty.guestBannerText}>Đăng nhập để giữ hàng, đặt giá & bán</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={sty.guestBannerLink}>Log in</Text>
              <ChevronRight size={13} color="#974226" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Content Sections ── */}
        {renderForYouHeader()}
        {renderForYou()}
      </ScrollView>

      {/* ── Gate Modal ── */}
      <GateModal
        visible={gateVisible}
        featureName={gateFeature}
        onClose={() => setGateVisible(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_W = (SW - 16 * 2 - 10) / 2;

const sty = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF8F5' },

  // App Bar
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#F2DFD1',
  },
  logo: {
    fontSize: 21,
    fontWeight: '800',
    color: '#231A11',
    letterSpacing: 1.5,
  },
  guestBadge: {
    backgroundColor: '#FEEADC',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  guestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#55433D',
    letterSpacing: 0.8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2DFD1',
  },
  loginBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  loginBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#231A11',
  },
  signupBtn: {
    backgroundColor: '#974226',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  signupBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },

  // Guest Banner
  guestBanner: {
    backgroundColor: '#FFF1E8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#FEEADC',
  },
  guestBannerText: {
    fontSize: 12,
    color: '#55433D',
    fontWeight: '500',
  },
  guestBannerLink: {
    fontSize: 12,
    color: '#974226',
    fontWeight: '700',
  },

  // Generic section
  section: { marginTop: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#231A11',
    letterSpacing: -0.1,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  seeAllText: {
    fontSize: 12,
    color: '#55433D',
    fontWeight: '600',
  },

  // Filters button
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF1E8',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#DBC1B9',
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#231A11',
  },

  // Stories
  storyItem: { alignItems: 'center', gap: 5, width: 60 },
  storyRingWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  storyLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#231A11',
    textAlign: 'center',
    width: 58,
  },

  // Live Auctions
  auctionCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0DED4',
    padding: 8,
    shadowColor: '#3A2417',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  auctionImgWrap: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F2DFD1',
    marginBottom: 8,
  },
  auctionImg: { width: '100%', height: '100%' },
  liveBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#ba1a1a',
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  timerBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(35,26,17,0.75)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  timerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF8F5',
  },
  auctionBody: { marginBottom: 6 },
  auctionTitle: { fontSize: 12, fontWeight: '700', color: '#231A11' },
  auctionPrice: { fontSize: 13, fontWeight: '700', color: '#974226', marginTop: 2 },
  watcherRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  watcherText: { fontSize: 10, color: '#55433D' },
  bidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFF1E8',
    borderWidth: 1,
    borderColor: '#DBC1B9',
  },
  bidBtnText: { fontSize: 11.5, fontWeight: '700', color: '#974226' },

  // Upcoming Drops
  dropCard: {
    width: 215,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0DED4',
    padding: 10,
    shadowColor: '#3A2417',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dropImgWrap: {
    width: '100%',
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F2DFD1',
    marginBottom: 8,
  },
  dropImg: { width: '100%', height: '100%' },
  dropGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'transparent',
  },
  dropTimer: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    backgroundColor: 'rgba(255,248,245,0.92)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dropTimerText: { fontSize: 10, fontWeight: '700', color: '#231A11' },
  dropBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  dropTitle: { fontSize: 12, fontWeight: '700', color: '#231A11' },
  dropSub: { fontSize: 10, color: '#55433D', marginTop: 1 },
  bellBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF1E8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // For You Grid
  forYouGrid: { paddingHorizontal: 16, marginTop: 4 },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  productCard: {
    width: CARD_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0DED4',
    padding: 8,
    shadowColor: '#3A2417',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  productImgWrap: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F2DFD1',
    marginBottom: 8,
  },
  productImg: { width: '100%', height: '100%' },
  heartBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,248,245,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(255,248,245,0.92)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  sizeTagText: { fontSize: 9, fontWeight: '700', color: '#231A11', textTransform: 'uppercase' },
  productBody: { marginBottom: 8 },
  productShop: { fontSize: 10, color: '#55433D' },
  productTitle: { fontSize: 12, fontWeight: '700', color: '#231A11', marginTop: 1 },
  productPrice: { fontSize: 13, fontWeight: '700', color: '#974226', marginTop: 2 },
  holdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#974226',
  },
  holdBtnText: { fontSize: 11.5, fontWeight: '700', color: '#fff' },
});
