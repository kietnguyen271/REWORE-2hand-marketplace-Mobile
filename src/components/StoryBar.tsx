/**
 * REWORE Mobile – Story Bar & Story Viewer Component
 * Instagram-style Stories với Progress Bar, Shoppable Sticker, Countdown Sticker
 */
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '@/components/theme';
import { useHoldStore } from '@/stores/holdStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface StoryProduct {
  id: string;
  name: string;
  price: number;
  shop: string;
  img: string;
  condition?: string;
  size?: string;
  posX: number; // 0-1 (relative to screen width)
  posY: number; // 0-1 (relative to screen height)
}

export interface StoryItem {
  id: string;
  img: string;
  duration?: number; // ms, default 5000
  product?: StoryProduct; // Shoppable sticker
  countdownTo?: number; // timestamp ms — Countdown sticker
  dropTitle?: string; // "Drop #42: Kiện đồ si Nhật"
}

export interface Story {
  id: string;
  shopName: string;
  shopHandle: string;
  avatar: string;
  label: string; // "Tonight's Drop", "Y2K Revival"…
  isLive?: boolean;
  unseen?: boolean;
  expiresAt: number; // TTL 24h
  items: StoryItem[];
}

// ────────────────────────────────────────────────────────────────────────────
// Seed data (24 h TTL from now)
// ────────────────────────────────────────────────────────────────────────────

const TTL_24H = Date.now() + 24 * 60 * 60 * 1000;

export const SAMPLE_STORIES: Story[] = [
  {
    id: 's1',
    shopName: 'Old Soul Studio',
    shopHandle: '@oldsoul',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    label: "Tonight's Drop",
    isLive: true,
    unseen: true,
    expiresAt: TTL_24H,
    items: [
      {
        id: 'si1',
        img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=430&h=760&fit=crop',
        duration: 5000,
        product: {
          id: 'p1',
          name: 'Áo Khoác Vintage Nhung',
          price: 280000,
          shop: 'Old Soul Studio',
          img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300&h=300&fit=crop',
          condition: '90%',
          size: 'M',
          posX: 0.55,
          posY: 0.45,
        },
      },
      {
        id: 'si2',
        img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=430&h=760&fit=crop',
        duration: 5000,
      },
    ],
  },
  {
    id: 's2',
    shopName: 'Tiệm Đồ Si Sài Gòn',
    shopHandle: '@saigonji',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    label: 'Live Auctions',
    isLive: true,
    unseen: true,
    expiresAt: TTL_24H,
    items: [
      {
        id: 'si3',
        img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=430&h=760&fit=crop',
        duration: 5000,
        countdownTo: Date.now() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000,
        dropTitle: 'Drop #42: Kiện đồ si Nhật',
      },
    ],
  },
  {
    id: 's3',
    shopName: 'Archive Denim',
    shopHandle: '@archivedenim',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    label: 'Y2K Revival',
    unseen: true,
    expiresAt: TTL_24H,
    items: [
      {
        id: 'si4',
        img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=430&h=760&fit=crop',
        duration: 5000,
        product: {
          id: 'p2',
          name: 'Jeans Ống Rộng 90s',
          price: 350000,
          shop: 'Archive Denim',
          img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300&h=300&fit=crop',
          condition: '85%',
          size: '30',
          posX: 0.3,
          posY: 0.5,
        },
      },
    ],
  },
  {
    id: 's4',
    shopName: 'Cozy Knits VN',
    shopHandle: '@cozyknitsvn',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
    label: 'Cozy Knits',
    unseen: false,
    expiresAt: TTL_24H,
    items: [
      {
        id: 'si5',
        img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=430&h=760&fit=crop',
        duration: 5000,
      },
    ],
  },
  {
    id: 's5',
    shopName: 'Silk & Stone',
    shopHandle: '@silkstone',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop',
    label: 'Minimalist',
    unseen: true,
    expiresAt: TTL_24H,
    items: [
      {
        id: 'si6',
        img: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=430&h=760&fit=crop',
        duration: 5000,
      },
    ],
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Countdown hook
// ────────────────────────────────────────────────────────────────────────────

function useCountdown(targetMs?: number) {
  const [remaining, setRemaining] = useState(
    targetMs ? Math.max(0, targetMs - Date.now()) : 0,
  );
  useEffect(() => {
    if (!targetMs) return;
    const id = setInterval(() => {
      setRemaining(Math.max(0, targetMs - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const total = Math.floor(remaining / 1000);
  const hh = Math.floor(total / 3600).toString().padStart(2, '0');
  const mm = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
  const ss = (total % 60).toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Shoppable Product Tag
// ────────────────────────────────────────────────────────────────────────────

interface ProductTagProps {
  product: StoryProduct;
  onClose: () => void;
}

function ProductTag({ product, onClose }: ProductTagProps) {
  const [expanded, setExpanded] = useState(false);
  const { holdItem, isHeldByMe } = useHoldStore();
  const held = isHeldByMe(product.id);

  const handleHold = () => {
    const result = holdItem({
      id: product.id,
      name: product.name,
      price: product.price,
      shop: product.shop,
      img: product.img,
      size: product.size,
      condition: product.condition,
    });
    // Hiển thị kết quả (không dùng Alert.alert trong story viewer để giữ UX smooth)
    if (result.success) {
      setExpanded(false);
    }
  };

  return (
    <Pressable
      style={[
        styles.productTag,
        { left: product.posX * SCREEN_W - 70, top: product.posY * SCREEN_H },
      ]}
      onPress={() => setExpanded(!expanded)}
    >
      {/* Dot pulse */}
      <View style={styles.tagDot} />

      {expanded && (
        <View style={styles.tagCard}>
          <Image source={{ uri: product.img }} style={styles.tagImg} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.tagName} numberOfLines={1}>{product.name}</Text>
            <Text style={styles.tagMeta}>{product.condition} · Size {product.size}</Text>
            <Text style={styles.tagPrice}>{product.price.toLocaleString('vi-VN')}₫</Text>
          </View>
          <TouchableOpacity
            style={[styles.holdBtn, held && styles.holdBtnHeld]}
            onPress={handleHold}
            activeOpacity={0.8}
          >
            <Text style={styles.holdBtnText}>{held ? 'Đang Giữ' : 'Giữ Hàng'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </Pressable>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Countdown Sticker
// ────────────────────────────────────────────────────────────────────────────

function CountdownSticker({ countdownTo, dropTitle }: { countdownTo: number; dropTitle?: string }) {
  const display = useCountdown(countdownTo);
  return (
    <View style={styles.countdownSticker}>
      <Text style={styles.countdownLabel}>⏰ Mở bán sau</Text>
      <Text style={styles.countdownTime}>{display}</Text>
      {dropTitle ? <Text style={styles.countdownTitle}>{dropTitle}</Text> : null}
      <TouchableOpacity style={styles.remindBtn} activeOpacity={0.8}>
        <Text style={styles.remindBtnText}>🔔 Nhắc tôi</Text>
      </TouchableOpacity>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Story Viewer (Full-screen)
// ────────────────────────────────────────────────────────────────────────────

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const [storyIdx, setStoryIdx] = useState(initialIndex);
  const [slideIdx, setSlideIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressRef = useRef<Animated.CompositeAnimation | null>(null);

  const story = stories[storyIdx];
  const slide = story?.items[slideIdx];

  // ── Auto-advance timer ──
  const startProgress = useCallback(() => {
    progressAnim.setValue(0);
    const dur = slide?.duration ?? 5000;
    progressRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: dur,
      useNativeDriver: false,
    });
    progressRef.current.start(({ finished }) => {
      if (finished) goNext();
    });
  }, [slide, progressAnim]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (paused) {
      progressRef.current?.stop();
    } else {
      startProgress();
    }
    return () => progressRef.current?.stop();
  }, [slideIdx, storyIdx, paused, startProgress]);

  const goNext = () => {
    if (!story) return;
    if (slideIdx < story.items.length - 1) {
      setSlideIdx((i) => i + 1);
    } else if (storyIdx < stories.length - 1) {
      setStoryIdx((i) => i + 1);
      setSlideIdx(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (slideIdx > 0) {
      setSlideIdx((i) => i - 1);
    } else if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
      setSlideIdx(0);
    }
  };

  // ── Pan gesture: swipe down to close, swipe left/right to change story ──
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // let tap handlers work
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10 || Math.abs(g.dx) > 10,
      onPanResponderGrant: () => setPaused(true),
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) {
          onClose();
          return;
        }
        if (g.dx < -60) {
          // swipe left → next story
          setStoryIdx((i) => Math.min(stories.length - 1, i + 1));
          setSlideIdx(0);
        } else if (g.dx > 60) {
          // swipe right → prev story
          setStoryIdx((i) => Math.max(0, i - 1));
          setSlideIdx(0);
        }
        pan.setValue({ x: 0, y: 0 });
        setPaused(false);
      },
    }),
  ).current;

  if (!story || !slide) return null;

  // Touch left/right half to go prev/next
  const handleTap = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX;
    if (x < SCREEN_W * 0.35) {
      goPrev();
    } else {
      goNext();
    }
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <StatusBar hidden />
      <Animated.View
        style={[styles.viewerRoot, { transform: pan.getTranslateTransform() }]}
        {...panResponder.panHandlers}
      >
        {/* Background image */}
        <Image source={{ uri: slide.img }} style={styles.viewerBg} resizeMode="cover" />

        {/* Dark overlay */}
        <View style={styles.viewerOverlay} />

        {/* Progress bars */}
        <View style={styles.progressRow}>
          {story.items.map((_, i) => (
            <View key={i} style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width:
                      i < slideIdx
                        ? '100%'
                        : i === slideIdx
                        ? progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                        : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.viewerHeader}>
          <Image source={{ uri: story.avatar }} style={styles.viewerAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.viewerShopName}>{story.shopName}</Text>
            <Text style={styles.viewerLabel}>{story.label}</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
            <Text style={styles.viewerClose}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tap zones */}
        <Pressable
          style={styles.tapZone}
          onPress={handleTap}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
        />

        {/* Shoppable sticker */}
        {slide.product && <ProductTag product={slide.product} onClose={onClose} />}

        {/* Countdown sticker */}
        {slide.countdownTo && (
          <CountdownSticker countdownTo={slide.countdownTo} dropTitle={slide.dropTitle} />
        )}

        {/* Live pill */}
        {story.isLive && (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Story Bar (Thanh story đầu Feed)
// ────────────────────────────────────────────────────────────────────────────

interface StoryBarProps {
  stories: Story[];
  onAddStory?: () => void;
  isSeller?: boolean;
}

export function StoryBar({ stories, onAddStory, isSeller }: StoryBarProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialIdx, setInitialIdx] = useState(0);

  // Filter out expired stories
  const active = stories.filter((s) => s.expiresAt > Date.now());

  const openStory = (idx: number) => {
    setInitialIdx(idx);
    setViewerOpen(true);
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.storyBar}
        contentContainerStyle={styles.storyBarContent}
      >
        {/* Add story button (seller only, or show dimmed for buyer) */}
        <TouchableOpacity
          onPress={onAddStory}
          style={styles.addStoryBtn}
          activeOpacity={0.8}
        >
          <View style={styles.addStoryCircle}>
            <Text style={styles.addStoryPlus}>＋</Text>
          </View>
          <Text style={styles.storyLabel} numberOfLines={1}>
            Đăng story
          </Text>
        </TouchableOpacity>

        {/* Story avatars */}
        {active.map((story, idx) => (
          <TouchableOpacity
            key={story.id}
            onPress={() => openStory(idx)}
            style={styles.storyItem}
            activeOpacity={0.85}
          >
            {/* Glow ring — gradient border for unseen */}
            <View style={[styles.storyRing, story.unseen ? styles.storyRingUnseen : styles.storyRingSeen]}>
              <Image source={{ uri: story.avatar }} style={styles.storyAvatar} />
              {story.isLive && (
                <View style={styles.liveTagSmall} />
              )}
            </View>
            <Text style={styles.storyLabel} numberOfLines={1}>
              {story.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {viewerOpen && (
        <StoryViewer
          stories={active}
          initialIndex={initialIdx}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Story Bar ──
  storyBar: {
    flexGrow: 0,
    paddingVertical: 10,
  },
  storyBarContent: {
    paddingHorizontal: 14,
    gap: 14,
    alignItems: 'flex-start',
  },
  addStoryBtn: {
    alignItems: 'center',
    width: 68,
    gap: 5,
  },
  addStoryCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.ivory,
    borderWidth: 2,
    borderColor: colors.terracotta,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStoryPlus: {
    fontSize: 26,
    color: colors.terracotta,
    fontWeight: '300',
    lineHeight: 30,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
    gap: 5,
  },
  storyRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRingUnseen: {
    borderWidth: 1.5,
    borderColor: '#D97736',
    // Vintage glow
    shadowColor: '#E7A977',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
  },
  storyRingSeen: {
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  storyAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  liveTagSmall: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E53935',
    borderWidth: 2,
    borderColor: '#fff',
  },
  storyLabel: {
    fontSize: 10,
    color: colors.ink,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 68,
  },

  // ── Story Viewer ──
  viewerRoot: {
    flex: 1,
    backgroundColor: '#000',
    width: SCREEN_W,
    height: SCREEN_H,
  },
  viewerBg: {
    ...StyleSheet.absoluteFill,
    width: SCREEN_W,
    height: SCREEN_H,
  },
  viewerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  progressRow: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 16,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  progressTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  viewerHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 68 : 28,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  viewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  viewerShopName: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  viewerLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
  },
  viewerClose: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '300',
  },
  tapZone: {
    ...StyleSheet.absoluteFill,
    zIndex: 5,
  },
  viewerRoot2: {},

  // ── Live pill ──
  livePill: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 115 : 74,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
    zIndex: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // ── Product Tag ──
  productTag: {
    position: 'absolute',
    zIndex: 20,
    alignItems: 'flex-start',
  },
  tagDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.terracotta,
    shadowColor: colors.terracotta,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  tagCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,252,248,0.96)',
    borderRadius: 14,
    padding: 10,
    marginTop: 6,
    gap: 10,
    width: 250,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  tagImg: {
    width: 50,
    height: 60,
    borderRadius: 8,
  },
  tagName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    maxWidth: 120,
  },
  tagMeta: {
    fontSize: 10,
    color: colors.muted,
  },
  tagPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.terracotta,
  },
  holdBtn: {
    backgroundColor: colors.terracotta,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  holdBtnHeld: {
    backgroundColor: colors.sage,
  },
  holdBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },

  // ── Countdown Sticker ──
  countdownSticker: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(35,26,17,0.88)',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    zIndex: 20,
    gap: 6,
  },
  countdownLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  countdownTime: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  countdownTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  remindBtn: {
    marginTop: 6,
    backgroundColor: colors.terracotta,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 22,
  },
  remindBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
});
