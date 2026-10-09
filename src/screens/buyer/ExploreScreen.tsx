/**
 * REWORE Mobile – ExploreScreen (Màn hình Khám Phá)
 * Instagram-style feed: Story Bar, Pill Filters, Action Bar (Like/Comment/Share/Bookmark/Hold)
 * Curators với real avatar images, Shoppable tag overlay
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, MessageCircle, Send, Bookmark, Search } from 'lucide-react-native';
import { productsApi, wishlistApi } from '@/api/endpoints';
import { StoryBar, SAMPLE_STORIES } from '@/components/StoryBar';
import { colors } from '@/components/theme';
import { useHoldStore } from '@/stores/holdStore';
import { useToastStore } from '@/stores/toastStore';
import type { Product } from '@/types/domain';
import { firstProductImage } from '@/utils/images';
import { formatVnd, getErrorMessage, normalizeList } from '@/utils/format';

const { width: SCREEN_W } = Dimensions.get('window');

// ────────────────────────────────────────────────────────────────────────────
// Pill filters
// ────────────────────────────────────────────────────────────────────────────

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'vintage', label: 'Vintage' },
  { key: 'y2k', label: 'Y2K' },
  { key: 'minimalist', label: 'Minimalist' },
  { key: 'streetwear', label: 'Streetwear' },
  { key: 'tops', label: 'Tops' },
  { key: 'jackets', label: 'Jackets' },
  { key: 'denim', label: 'Denim' },
];

// ────────────────────────────────────────────────────────────────────────────
// Curators – real lookbook images
// ────────────────────────────────────────────────────────────────────────────

const CURATORS = [
  {
    id: 'c1',
    name: 'Old Soul Studio',
    handle: '@oldsoul.vintage',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',
  },
  {
    id: 'c2',
    name: 'Archive Denim',
    handle: '@archivedenim',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop&crop=face',
  },
  {
    id: 'c3',
    name: 'Silk & Stone',
    handle: '@silkstone',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
  },
  {
    id: 'c4',
    name: 'Cozy Knits VN',
    handle: '@cozyknitsvn',
    avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=120&h=120&fit=crop&crop=face',
  },
];

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'p-fb-1',
    title: 'Áo khoác Denim Patchwork 90s',
    description: 'Chất denim dày dặn, phối mảng phong cách Nhật Bản',
    price: 450000,
    images: ['https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=500&h=650&fit=crop'],
    category: 'denim',
    condition: 'GOOD',
    status: 'AVAILABLE',
    size: 'M',
    brand: 'Vintage Archive',
    seller: {
      shopName: 'Tiệm Đồ Si Sài Gòn',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-fb-2',
    title: 'Áo Blazer Dạ Tweed Vintage Nhật',
    description: 'Blazer dáng thụng form unisex, họa tiết xương cá cổ điển',
    price: 380000,
    images: ['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&h=650&fit=crop'],
    category: 'jackets',
    condition: 'LIKE_NEW',
    status: 'AVAILABLE',
    size: 'L',
    brand: 'Archive Tokyo',
    seller: {
      shopName: 'Old Soul Studio',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-fb-3',
    title: 'Jeans Ống Rộng Phong Cách Y2K',
    description: 'Quần bò wash loang xước gấu phong cách retro thập niên 2000',
    price: 350000,
    images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=650&fit=crop'],
    category: 'y2k',
    condition: 'GOOD',
    status: 'AVAILABLE',
    size: '30',
    brand: 'Archive Denim',
    seller: {
      shopName: 'Archive Denim',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop&crop=face',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-fb-4',
    title: 'Áo Len Dệt Kim Cozy Cable-Knit',
    description: 'Áo len vặn thừng len cừu giữ ấm cực tốt, màu kem sữa',
    price: 290000,
    images: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&h=650&fit=crop'],
    category: 'vintage',
    condition: 'LIKE_NEW',
    status: 'AVAILABLE',
    size: 'Free',
    brand: 'Cozy Knits',
    seller: {
      shopName: 'Cozy Knits VN',
      avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=80&h=80&fit=crop&crop=face',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-fb-5',
    title: 'Áo Sơ Mi Lụa Cát Minimalist',
    description: 'Form suông rũ mềm mại, tone be tối giản dễ phối đồ',
    price: 260000,
    images: ['https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=500&h=650&fit=crop'],
    category: 'minimalist',
    condition: 'LIKE_NEW',
    status: 'AVAILABLE',
    size: 'S',
    brand: 'Silk & Stone',
    seller: {
      shopName: 'Silk & Stone',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-fb-6',
    title: 'Áo Khoác Bomber Nhung Tăm Streetwear',
    description: 'Chất nhung tăm dày dặn thêu logo sau lưng cực chất',
    price: 420000,
    images: ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&h=650&fit=crop'],
    category: 'streetwear',
    condition: 'GOOD',
    status: 'AVAILABLE',
    size: 'XL',
    brand: 'Retro Vibe',
    seller: {
      shopName: 'Old Soul Studio',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face',
    },
    createdAt: new Date().toISOString(),
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Product Card – Instagram style
// ────────────────────────────────────────────────────────────────────────────

interface FeedCardProps {
  product: Product;
  wishlisted: boolean;
  bookmarked: boolean;
  onToggleWishlist: () => void;
  onToggleBookmark: () => void;
  onHold: () => void;
}

function FeedCard({ product, wishlisted, bookmarked, onToggleWishlist, onToggleBookmark, onHold }: FeedCardProps) {
  const { isHeldByMe, isHeldByOther, getRemainingSeconds } = useHoldStore();
  const heldByMe = isHeldByMe(product.id);
  const heldByOther = isHeldByOther(product.id);
  const image = firstProductImage(product);
  const canHold = !heldByMe && !heldByOther && product.status !== 'SOLD';

  const avatar =
    product.seller?.avatar ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face';

  const handleShare = async () => {
    try {
      await Share.share({ message: `Xem ${product.title} tại REWORE – ${formatVnd(product.price)}` });
    } catch {}
  };

  const conditionLabel =
    product.condition === 'LIKE_NEW' ? 'Like New'
    : product.condition === 'GOOD' ? 'Good'
    : product.condition === 'FAIR' ? 'Fair'
    : product.condition ?? '';

  return (
    <View style={styles.card}>
      {/* ── Card Header: Avatar + Shop + Follow ── */}
      <View style={styles.cardHeader}>
        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}
          onPress={() => router.push({ pathname: '/products/[id]', params: { id: product.id } })}
        >
          <Image source={{ uri: avatar }} style={styles.cardAvatar} />
          <View>
            <Text style={styles.cardShopName}>
              {product.seller?.shopName || 'REWORE Shop'}
            </Text>
            <Text style={styles.cardHandle}>
              @{(product.seller?.shopName || 'shop').toLowerCase().replace(/\s+/g, '.')}
            </Text>
          </View>
        </Pressable>
        <TouchableOpacity style={styles.followPill} activeOpacity={0.8}>
          <Text style={styles.followPillText}>Follow</Text>
        </TouchableOpacity>
      </View>

      {/* ── Media 4:5 tràn viền ── */}
      <Pressable
        onPress={() => router.push({ pathname: '/products/[id]', params: { id: product.id } })}
        style={styles.cardImgWrap}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.cardImg} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
            <Text style={{ color: colors.muted, fontSize: 10 }}>No image</Text>
          </View>
        )}

        {/* Shoppable tag */}
        <View style={styles.shoppableTag}>
          <View style={styles.shoppableDot} />
          <Text style={styles.shoppableText} numberOfLines={1}>
            {product.title.split(' ').slice(0, 3).join(' ')} • {formatVnd(product.price)}
          </Text>
        </View>

        {/* Status badge overlay */}
        {!canHold && (
          <View style={styles.statusBadgeOverlay}>
            <Text style={styles.statusBadgeText}>
              {heldByMe
                ? `GIỮ HÀNG · ${formatCountdown(getRemainingSeconds(product.id))}`
                : heldByOther
                ? 'LOCKED'
                : 'ĐÃ BÁN'}
            </Text>
          </View>
        )}
      </Pressable>

      {/* ── Action Bar ── */}
      <View style={styles.actionBar}>
        {/* Left: Like, Comment, Share */}
        <View style={styles.actionLeft}>
          <TouchableOpacity onPress={onToggleWishlist} activeOpacity={0.7} hitSlop={8}>
            <Heart
              color={wishlisted ? '#E53935' : colors.ink}
              fill={wishlisted ? '#E53935' : 'transparent'}
              size={26}
              strokeWidth={1.8}
            />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} hitSlop={8}>
            <MessageCircle color={colors.ink} size={25} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} activeOpacity={0.7} hitSlop={8}>
            <Send color={colors.ink} size={24} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {/* Right: Bookmark + Hold */}
        <View style={styles.actionRight}>
          <TouchableOpacity onPress={onToggleBookmark} activeOpacity={0.7} hitSlop={8}>
            <Bookmark
              color={bookmarked ? colors.ink : colors.ink}
              fill={bookmarked ? colors.ink : 'transparent'}
              size={24}
              strokeWidth={1.8}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onHold}
            disabled={!canHold}
            style={[styles.holdActionBtn, !canHold && styles.holdActionBtnDisabled]}
          >
            <Text style={[styles.holdActionText, !canHold && styles.holdActionTextDisabled]}>
              {heldByMe ? 'Đang giữ' : heldByOther ? 'Xếp hàng' : 'Giữ hàng'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Body Info ── */}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>
          <Text style={styles.cardShopNameInline}>
            {product.seller?.shopName || 'REWORE Shop'}{' '}
          </Text>
          {product.title}
        </Text>
        <Text style={styles.cardPrice}>{formatVnd(product.price)}</Text>
        <View style={styles.cardMeta}>
          {conditionLabel ? <Text style={styles.metaChip}>{conditionLabel}</Text> : null}
          {product.size ? <Text style={styles.metaChip}>Size {product.size}</Text> : null}
        </View>
      </View>
    </View>
  );
}

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Main Screen
// ────────────────────────────────────────────────────────────────────────────

export function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const show = useToastStore((s) => s.show);
  const { holdItem, joinWaitlist } = useHoldStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('');
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const [followedCurators, setFollowedCurators] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (activeFilter) params.category = activeFilter;
      const payload = await productsApi.list(params);
      const list = normalizeList<Product>(payload);
      if (list.length > 0) {
        setProducts(list);
      } else {
        const filtered = activeFilter
          ? FALLBACK_PRODUCTS.filter((p) => p.category?.toLowerCase() === activeFilter.toLowerCase())
          : FALLBACK_PRODUCTS;
        setProducts(filtered);
      }
    } catch {
      const filtered = activeFilter
        ? FALLBACK_PRODUCTS.filter((p) => p.category?.toLowerCase() === activeFilter.toLowerCase())
        : FALLBACK_PRODUCTS;
      setProducts(filtered);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const toggleWishlist = async (product: Product) => {
    const id = product.id;
    const was = wishlistIds.has(id);
    setWishlistIds((prev) => {
      const next = new Set(prev);
      was ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      if (was) {
        await wishlistApi.remove(id);
      } else {
        await wishlistApi.add(id);
        show('Đã thêm vào yêu thích ♥', 'success');
      }
    } catch {
      setWishlistIds((prev) => {
        const next = new Set(prev);
        was ? next.add(id) : next.delete(id);
        return next;
      });
    }
  };

  const toggleBookmark = (productId: string) => {
    setBookmarkIds((prev) => {
      const next = new Set(prev);
      next.has(productId) ? next.delete(productId) : next.add(productId);
      return next;
    });
  };

  const handleHold = (product: Product) => {
    const image = firstProductImage(product);
    const result = holdItem({
      id: product.id,
      name: product.title,
      price: product.price,
      shop: product.seller?.shopName || 'REWORE Shop',
      img: image || '',
      size: product.size,
      condition: product.condition,
    });

    if (result.success) {
      show(result.message, 'success');
    } else if (result.reason === 'HELD_BY_OTHER') {
      Alert.alert('Có người đang giữ', result.message, [
        { text: 'Xếp hàng đợi', onPress: () => joinWaitlist(product.id, product.title, product.seller?.shopName || '') },
        { text: 'Thôi', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Không thể giữ hàng', result.message);
    }
  };

  const toggleFollow = (id: string) => {
    setFollowedCurators((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Render ──

  const renderHeader = () => (
    <View>
      {/* App bar */}
      <View style={[styles.appBar, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.appBarLogo}>REWORE</Text>
        <TouchableOpacity style={styles.searchBtn} activeOpacity={0.7}>
          <Search color={colors.ink} size={22} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* Story Bar */}
      <StoryBar
        stories={SAMPLE_STORIES}
        isSeller={false}
        onAddStory={() => show('Tính năng đăng story sẽ ra mắt sớm!', 'success')}
      />

      {/* Divider */}
      <View style={styles.divider} />

      {/* Pill Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillBar}
        contentContainerStyle={styles.pillBarContent}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setActiveFilter(f.key)}
            style={[styles.pill, activeFilter === f.key && styles.pillActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, activeFilter === f.key && styles.pillTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Curators to Follow – real avatar images */}
      <View style={styles.curatorsSection}>
        <Text style={styles.sectionLabel}>Curators to Follow</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10 }}
          contentContainerStyle={{ paddingHorizontal: 14, gap: 10 }}
        >
          {CURATORS.map((c) => {
            const following = followedCurators.has(c.id);
            return (
              <View key={c.id} style={styles.curatorCard}>
                <Image source={{ uri: c.avatar }} style={styles.curatorAvatar} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.curatorName} numberOfLines={1}>{c.name}</Text>
                  <Text style={styles.curatorHandle}>{c.handle}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggleFollow(c.id)}
                  style={[styles.followBtn, following && styles.followBtnActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>
                    {following ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* For You header */}
      <View style={styles.forYouHeader}>
        <Text style={styles.sectionLabel}>For You</Text>
        <Text style={styles.forYouSub}>{products.length} món đợi bạn khám phá</Text>
      </View>
    </View>
  );

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <FeedCard
        product={item}
        wishlisted={wishlistIds.has(item.id)}
        bookmarked={bookmarkIds.has(item.id)}
        onToggleWishlist={() => toggleWishlist(item)}
        onToggleBookmark={() => toggleBookmark(item.id)}
        onHold={() => handleHold(item)}
      />
    ),
    [wishlistIds, bookmarkIds],
  );

  if (loading && products.length === 0) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={[styles.appBar, { paddingTop: insets.top + 6 }]}>
          <Text style={styles.appBarLogo}>REWORE</Text>
        </View>
        <View style={styles.loadingWrap}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={styles.skeletonCard} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={1}
        ListHeaderComponent={renderHeader}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.terracotta]}
            tintColor={colors.terracotta}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🛍️</Text>
            <Text style={styles.emptyTitle}>Chưa có sản phẩm</Text>
            <Text style={styles.emptySub}>Thử đổi bộ lọc hoặc kiểm tra lại backend.</Text>
          </View>
        }
      />
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },

  // ── App Bar ──
  appBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FAF8F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBarLogo: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: 3,
  },
  searchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EAE2',
  },

  divider: {
    height: 1,
    backgroundColor: '#EAE5DF',
  },

  // ── Pill Filters ──
  pillBar: {
    flexGrow: 0,
    marginTop: 10,
  },
  pillBarContent: {
    paddingHorizontal: 14,
    gap: 8,
    paddingBottom: 4,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F0EAE2',
    borderWidth: 1,
    borderColor: '#E4D8CC',
  },
  pillActive: {
    backgroundColor: '#2B1810',
    borderColor: '#2B1810',
  },
  pillText: {
    fontSize: 12.5,
    color: colors.muted,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  // ── Curators ──
  curatorsSection: {
    marginTop: 18,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    paddingHorizontal: 14,
    letterSpacing: 0.2,
  },
  curatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    width: 215,
    shadowColor: '#3A2417',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  curatorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: '#EAE5DF',
  },
  curatorName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
  },
  curatorHandle: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 1,
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#2B1810',
  },
  followBtnActive: {
    backgroundColor: '#2B1810',
  },
  followBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2B1810',
  },
  followBtnTextActive: {
    color: '#fff',
  },

  // ── For You Header ──
  forYouHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: 20,
    marginBottom: 6,
  },
  forYouSub: {
    fontSize: 11,
    color: colors.muted,
  },

  listContent: {
    paddingBottom: 40,
  },

  // ── Product Card (Instagram style) ──
  card: {
    width: '100%',
    backgroundColor: '#FAF8F5',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DF',
    paddingBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cardAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#EAE5DF',
  },
  cardShopName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  cardHandle: {
    fontSize: 10.5,
    color: colors.muted,
    marginTop: 1,
  },
  followPill: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 7,
  },
  followPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },

  // ── Image ──
  cardImgWrap: {
    width: '100%',
    aspectRatio: 4 / 5,
    position: 'relative',
    overflow: 'hidden',
  },
  cardImg: {
    width: '100%',
    height: '100%',
  },
  cardImgPlaceholder: {
    backgroundColor: '#EAE5DF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Shoppable tag
  shoppableTag: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '75%',
  },
  shoppableDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  shoppableText: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusBadgeOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ── Action Bar ──
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  holdActionBtn: {
    backgroundColor: '#2B1810',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
  },
  holdActionBtnDisabled: {
    backgroundColor: '#E4D8CC',
  },
  holdActionText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  holdActionTextDisabled: {
    color: colors.muted,
  },

  // ── Card Body ──
  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 3,
  },
  cardTitle: {
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
  },
  cardShopNameInline: {
    fontWeight: '800',
  },
  cardPrice: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#2B1810',
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  metaChip: {
    fontSize: 10.5,
    color: colors.muted,
    backgroundColor: '#F0EAE2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '600',
  },

  // ── Loading Skeleton ──
  loadingWrap: {
    padding: 14,
    gap: 16,
  },
  skeletonCard: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: '#E4D8CC',
    borderRadius: 4,
    opacity: 0.5,
  },

  // ── Empty state ──
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
