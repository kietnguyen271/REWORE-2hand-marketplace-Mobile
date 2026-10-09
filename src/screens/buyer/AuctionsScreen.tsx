/**
 * REWORE Mobile – LiveAuctionScreen (Đấu Giá)
 * Redesigned: Header gọn chuẩn, Product card nổi bật 1:1, Giá nền kem sáng,
 * Pill Buttons be ấm cho quick bid, Lịch sử bid với avatar thật + time relative,
 * Tab bar không dùng emoji
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Eye, Flame, Clock } from 'lucide-react-native';
import { colors } from '@/components/theme';
import { formatVnd } from '@/utils/format';

// ────────────────────────────────────────────────────────────────────────────
// Mock Auctions
// ────────────────────────────────────────────────────────────────────────────

interface BidEntry {
  id: string;
  user: string;
  avatar: string;
  amount: number;
  at: string;
}

interface AuctionItem {
  id: string;
  title: string;
  shop: string;
  img: string;
  startPrice: number;
  currentPrice: number;
  minIncrement: number;
  endAt: number;
  status: 'live' | 'upcoming';
  bidHistory: BidEntry[];
  watcherCount: number;
  condition: string;
  size: string;
}

const NOW = Date.now();

const MOCK_AUCTIONS: AuctionItem[] = [
  {
    id: 'a1',
    title: 'Archive Denim Jacket 90s',
    shop: 'Archive Denim',
    img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=500&fit=crop',
    startPrice: 450000,
    currentPrice: 570000,
    minIncrement: 10000,
    endAt: NOW + 3 * 60000 + 22000,
    status: 'live',
    watcherCount: 42,
    condition: '90%',
    size: 'M',
    bidHistory: [
      { id: 'b1', user: '@mai.vintage', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face', amount: 570000, at: 'Vừa xong' },
      { id: 'b2', user: '@hieu_le', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=60&h=60&fit=crop&crop=face', amount: 550000, at: '12 giây trước' },
      { id: 'b3', user: '@trang.n', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face', amount: 500000, at: '45 giây trước' },
      { id: 'b4', user: '@dung_99', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face', amount: 480000, at: '1 phút trước' },
      { id: 'b5', user: '@lan.anh', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=60&h=60&fit=crop&crop=face', amount: 450000, at: '2 phút trước' },
    ],
  },
  {
    id: 'a2',
    title: 'Silk Cami 70s Original',
    shop: 'Silk & Stone',
    img: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=500&h=500&fit=crop',
    startPrice: 200000,
    currentPrice: 320000,
    minIncrement: 10000,
    endAt: NOW + 18 * 60000,
    status: 'live',
    watcherCount: 28,
    condition: '95%',
    size: 'S',
    bidHistory: [
      { id: 'b6', user: '@thao.v', avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=60&h=60&fit=crop&crop=face', amount: 320000, at: '30 giây trước' },
      { id: 'b7', user: '@minh.k', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face', amount: 300000, at: '1 phút trước' },
    ],
  },
  {
    id: 'a3',
    title: 'Wool Tweed Blazer Vintage',
    shop: 'Old Soul Studio',
    img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&h=500&fit=crop',
    startPrice: 380000,
    currentPrice: 380000,
    minIncrement: 10000,
    endAt: NOW + 2 * 3600000,
    status: 'upcoming',
    watcherCount: 15,
    condition: '85%',
    size: 'L',
    bidHistory: [],
  },
  {
    id: 'a4',
    title: 'Y2K Cargo Pants',
    shop: 'Archive Denim',
    img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&h=500&fit=crop',
    startPrice: 150000,
    currentPrice: 150000,
    minIncrement: 10000,
    endAt: NOW + 5 * 3600000,
    status: 'upcoming',
    watcherCount: 8,
    condition: '80%',
    size: '32',
    bidHistory: [],
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Countdown hook
// ────────────────────────────────────────────────────────────────────────────

function useCountdown(endAt: number) {
  const [ms, setMs] = useState(Math.max(0, endAt - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setMs(Math.max(0, endAt - Date.now())), 1000);
    return () => clearInterval(id);
  }, [endAt]);
  const totalSec = Math.floor(ms / 1000);
  const mm = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const ss = (totalSec % 60).toString().padStart(2, '0');
  return { display: `${mm}:${ss}`, seconds: totalSec };
}

// ────────────────────────────────────────────────────────────────────────────
// Price flash animation
// ────────────────────────────────────────────────────────────────────────────

function PriceFlash({ price }: { price: number }) {
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [price]);

  const bgColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(200,100,70,0)', 'rgba(200,100,70,0.12)'],
  });

  return (
    <Animated.View style={[{ borderRadius: 12, paddingVertical: 6, paddingHorizontal: 4 }, { backgroundColor: bgColor }]}>
      <Text style={styles.currentPriceText}>{formatVnd(price)}</Text>
    </Animated.View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Live Auction Room
// ────────────────────────────────────────────────────────────────────────────

function LiveAuctionRoom({ auction: initial }: { auction: AuctionItem }) {
  const [auction, setAuction] = useState(initial);
  const { display: timerDisplay, seconds } = useCountdown(auction.endAt);
  const [bidPlaced, setBidPlaced] = useState(false);
  const endingSoon = seconds <= 30 && seconds > 0;
  const ended = seconds === 0;

  // Simulated WebSocket bids
  useEffect(() => {
    const AVATARS = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=60&h=60&fit=crop&crop=face',
    ];
    const users = ['@nam.v', '@thu.h', '@bao.p', '@linh.x'];
    const scheduleNextBid = () => {
      const delay = 5000 + Math.random() * 7000;
      return setTimeout(() => {
        setAuction((prev) => {
          const increment = [10000, 20000, 30000][Math.floor(Math.random() * 3)];
          const newPrice = prev.currentPrice + increment;
          const newEntry: BidEntry = {
            id: `live-${Date.now()}`,
            user: users[Math.floor(Math.random() * users.length)],
            avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
            amount: newPrice,
            at: 'Vừa xong',
          };
          return {
            ...prev,
            currentPrice: newPrice,
            bidHistory: [newEntry, ...prev.bidHistory].slice(0, 10),
          };
        });
        scheduleNextBid();
      }, delay);
    };
    const t = scheduleNextBid();
    return () => clearTimeout(t);
  }, []);

  const quickBid = (increment: number) => {
    const newPrice = auction.currentPrice + increment;
    const newEntry: BidEntry = {
      id: `you-${Date.now()}`,
      user: '@bạn',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
      amount: newPrice,
      at: 'Vừa xong',
    };
    setAuction((prev) => ({
      ...prev,
      currentPrice: newPrice,
      bidHistory: [newEntry, ...prev.bidHistory].slice(0, 10),
    }));
    setBidPlaced(true);
    setTimeout(() => setBidPlaced(false), 2500);
  };

  return (
    <ScrollView style={styles.roomRoot} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 30 }}>

      {/* ── Product card 1:1 ── */}
      <View style={styles.productCard}>
        <Image source={{ uri: auction.img }} style={styles.productImg} resizeMode="cover" />
        <View style={styles.productInfo}>
          {/* Live badge */}
          <View style={styles.roomLiveBadge}>
            <View style={styles.liveDotSmall} />
            <Text style={styles.roomLiveBadgeText}>ĐANG ĐẤU GIÁ</Text>
          </View>
          <Text style={styles.productTitle}>{auction.title}</Text>
          <Text style={styles.productShop}>{auction.shop}</Text>
          <View style={styles.productMetaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{auction.condition}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>Size {auction.size}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Timer + Watchers ── */}
      <View style={styles.statsRow}>
        <View style={[styles.timerBox, endingSoon && styles.timerBoxUrgent, ended && styles.timerBoxEnded]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            {endingSoon && !ended && <Flame color="#B44135" size={13} strokeWidth={2} />}
            <Text style={[styles.timerLabel, endingSoon && { color: '#B44135' }]}>
              {ended ? 'ĐÃ KẾT THÚC' : endingSoon ? 'CÒN LẠI' : 'CÒN LẠI'}
            </Text>
          </View>
          <Text style={[styles.timerValue, endingSoon && styles.timerValueUrgent]}>
            {ended ? '–' : timerDisplay}
          </Text>
        </View>
        <View style={styles.watcherBox}>
          <Eye color={colors.muted} size={16} strokeWidth={1.8} />
          <Text style={styles.watcherNum}>{auction.watcherCount + Math.floor(Date.now() / 10000) % 5}</Text>
          <Text style={styles.watcherLabel}>đang xem</Text>
        </View>
      </View>

      {/* ── Current price – cream card ── */}
      <View style={styles.priceSectionCard}>
        <Text style={styles.priceLabel}>GIÁ HIỆN TẠI</Text>
        <PriceFlash price={auction.currentPrice} />
        <View style={styles.topBidderRow}>
          {auction.bidHistory[0]?.avatar ? (
            <Image source={{ uri: auction.bidHistory[0].avatar }} style={styles.topBidderAvatar} />
          ) : null}
          <Text style={styles.topBidder}>
            {auction.bidHistory[0]?.user ?? '@—'} đang dẫn đầu
          </Text>
        </View>
      </View>

      {/* ── Quick Bid Pill Buttons ── */}
      {!ended && (
        <View style={styles.quickBidRow}>
          {[10000, 20000, 50000].map((inc) => (
            <TouchableOpacity
              key={inc}
              style={styles.quickBidBtn}
              onPress={() => quickBid(inc)}
              activeOpacity={0.75}
            >
              <Text style={styles.quickBidLabel}>+{formatVnd(inc).replace(' ₫', '').trim()}</Text>
              <Text style={styles.quickBidSub}>₫</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {bidPlaced && (
        <View style={styles.bidSuccessBanner}>
          <Text style={styles.bidSuccessText}>Bạn đang dẫn đầu!</Text>
        </View>
      )}

      {/* ── Bid history ── */}
      <View style={styles.historyCard}>
        <Text style={styles.historyTitle}>Lịch sử trả giá</Text>
        {auction.bidHistory.map((b, i) => (
          <View key={b.id} style={[styles.historyRow, i === 0 && styles.historyRowTop]}>
            <Image source={{ uri: b.avatar }} style={[styles.historyAvatar, i === 0 && styles.historyAvatarTop]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.historyUser, i === 0 && styles.historyUserTop]}>{b.user}</Text>
              <Text style={styles.historyAt}>{b.at}</Text>
            </View>
            <Text style={[styles.historyAmount, i === 0 && styles.historyAmountTop]}>
              {formatVnd(b.amount)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Upcoming Auction Card
// ────────────────────────────────────────────────────────────────────────────

function UpcomingAuctionCard({ auction }: { auction: AuctionItem }) {
  const { display } = useCountdown(auction.endAt);
  return (
    <View style={styles.upcomingCard}>
      <Image source={{ uri: auction.img }} style={styles.upcomingImg} resizeMode="cover" />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.upcomingTitle} numberOfLines={2}>{auction.title}</Text>
        <Text style={styles.upcomingShop}>{auction.shop}</Text>
        <Text style={styles.upcomingPrice}>Giá khởi: {formatVnd(auction.startPrice)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Clock color={colors.terracotta} size={11} strokeWidth={2} />
          <Text style={styles.upcomingTimer}>Mở sau {display}</Text>
        </View>
        <Text style={styles.upcomingMeta}>{auction.watcherCount} người quan tâm</Text>
      </View>
      <TouchableOpacity style={styles.notifyBtn} activeOpacity={0.8}>
        <Text style={styles.notifyBtnText}>🔔</Text>
      </TouchableOpacity>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Screen
// ────────────────────────────────────────────────────────────────────────────

export function LiveAuctionScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming'>('live');
  const [selectedAuction, setSelectedAuction] = useState<AuctionItem | null>(null);

  const live = MOCK_AUCTIONS.filter((a) => a.status === 'live');
  const upcoming = MOCK_AUCTIONS.filter((a) => a.status === 'upcoming');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        {selectedAuction ? (
          <TouchableOpacity
            onPress={() => setSelectedAuction(null)}
            style={styles.backBtn}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <ChevronLeft color="#2B1810" size={24} strokeWidth={2} />
          </TouchableOpacity>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {selectedAuction ? selectedAuction.title : 'Đấu giá'}
          </Text>
          {!selectedAuction && (
            <Text style={styles.headerSub}>Cạnh tranh để sở hữu đồ độc</Text>
          )}
        </View>
        {!selectedAuction && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDotSmall} />
            <Text style={styles.liveIndicatorText}>LIVE</Text>
          </View>
        )}
      </View>

      {selectedAuction ? (
        <LiveAuctionRoom auction={selectedAuction} />
      ) : (
        <>
          {/* ── Tabs (no emoji) ── */}
          <View style={styles.tabRow}>
            {(['live', 'upcoming'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                  {tab === 'live' ? `Đang diễn ra (${live.length})` : `Sắp mở (${upcoming.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={activeTab === 'live' ? live : upcoming}
            keyExtractor={(a) => a.id}
            contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) =>
              activeTab === 'live' ? (
                <TouchableOpacity
                  onPress={() => setSelectedAuction(item)}
                  style={styles.liveListCard}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: item.img }} style={styles.liveListImg} resizeMode="cover" />
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.liveListBadge}>
                      <View style={styles.liveDotSmall} />
                      <Text style={styles.liveListBadgeText}>LIVE</Text>
                    </View>
                    <Text style={styles.liveListTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.liveListShop}>{item.shop}</Text>
                    <Text style={styles.liveListPrice}>{formatVnd(item.currentPrice)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Eye color={colors.muted} size={11} strokeWidth={1.8} />
                      <Text style={styles.liveListWatchers}>{item.watcherCount} đang xem</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <LiveTimerSmall endAt={item.endAt} />
                    <TouchableOpacity
                      style={styles.enterRoomBtn}
                      onPress={() => setSelectedAuction(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.enterRoomText}>Vào phòng</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ) : (
                <UpcomingAuctionCard auction={item} />
              )
            }
          />
        </>
      )}
    </View>
  );
}

export const AuctionsScreen = LiveAuctionScreen;

function LiveTimerSmall({ endAt }: { endAt: number }) {
  const { display, seconds } = useCountdown(endAt);
  return (
    <Text style={[styles.timerSmall, seconds <= 30 && styles.timerSmallUrgent]}>
      {display}
    </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 8,
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0EAE2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2B1810',
    flex: 1,
  },
  headerSub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF0EE',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#F5D0C8',
  },
  liveDotSmall: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#E53935',
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B44135',
    letterSpacing: 0.5,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginVertical: 10,
    backgroundColor: '#EDE8E2',
    borderRadius: 14,
    padding: 3,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  tabBtnTextActive: {
    color: '#2B1810',
    fontWeight: '800',
  },

  // ── Live list card ──
  liveListCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#3A2417',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  liveListImg: {
    width: 76,
    height: 90,
    borderRadius: 12,
  },
  liveListBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFDBD0',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  liveListBadgeText: {
    color: colors.terracotta,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  liveListTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2B1810',
    lineHeight: 17,
  },
  liveListShop: {
    fontSize: 10,
    color: colors.muted,
  },
  liveListPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.terracotta,
  },
  liveListWatchers: {
    fontSize: 10,
    color: colors.muted,
  },
  timerSmall: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2B1810',
    fontVariant: ['tabular-nums'],
  },
  timerSmallUrgent: {
    color: colors.danger,
  },
  enterRoomBtn: {
    backgroundColor: '#2B1810',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  enterRoomText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },

  // ── Upcoming card ──
  upcomingCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  upcomingImg: {
    width: 72,
    height: 86,
    borderRadius: 12,
  },
  upcomingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2B1810',
    lineHeight: 17,
  },
  upcomingShop: {
    fontSize: 10,
    color: colors.muted,
  },
  upcomingPrice: {
    fontSize: 11,
    color: '#2B1810',
    fontWeight: '700',
  },
  upcomingTimer: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.terracotta,
    fontVariant: ['tabular-nums'],
  },
  upcomingMeta: {
    fontSize: 10,
    color: colors.muted,
  },
  notifyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5EFE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifyBtnText: {
    fontSize: 18,
  },

  // ── Auction Room ──
  roomRoot: {
    flex: 1,
  },
  productCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 20,
    shadowColor: '#3A2417',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  productImg: {
    width: 100,
    height: 100,
    borderRadius: 14,
  },
  productInfo: {
    flex: 1,
    gap: 5,
  },
  roomLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFDBD0',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  roomLiveBadgeText: {
    color: colors.terracotta,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2B1810',
    lineHeight: 20,
  },
  productShop: {
    fontSize: 11,
    color: colors.muted,
  },
  productMetaRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  metaPill: {
    backgroundColor: '#F0EAE2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#5A4035',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  timerBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#EAE5DF',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  timerBoxUrgent: {
    borderColor: '#F5D0C8',
    backgroundColor: '#FFF5F4',
  },
  timerBoxEnded: {
    borderColor: '#E4D8CC',
    backgroundColor: '#F5EFE6',
  },
  timerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.8,
  },
  timerValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2B1810',
    fontVariant: ['tabular-nums'],
    lineHeight: 32,
  },
  timerValueUrgent: {
    color: '#B44135',
  },
  watcherBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: '#EAE5DF',
    minWidth: 80,
  },
  watcherNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2B1810',
    lineHeight: 26,
  },
  watcherLabel: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: '600',
  },

  // ── Price card – cream sáng ──
  priceSectionCard: {
    backgroundColor: '#FAF5EE',
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 18,
    padding: 18,
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#E4D8CC',
  },
  priceLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '700',
    letterSpacing: 1,
  },
  currentPriceText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#2B1810',
  },
  topBidderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 2,
  },
  topBidderAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#E4D8CC',
  },
  topBidder: {
    fontSize: 11.5,
    color: colors.muted,
    fontWeight: '600',
  },

  // ── Quick Bid Pill Buttons ──
  quickBidRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  quickBidBtn: {
    flex: 1,
    backgroundColor: '#EDE4D8',
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 0,
    borderWidth: 1,
    borderColor: '#D9CCBE',
    shadowColor: '#3A2417',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quickBidLabel: {
    color: '#2B1810',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  quickBidSub: {
    color: '#2B1810',
    fontWeight: '900',
    fontSize: 14,
  },
  bidSuccessBanner: {
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: '#E8F0DA',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C4D9B0',
  },
  bidSuccessText: {
    color: '#2D5927',
    fontWeight: '900',
    fontSize: 13,
  },

  // ── Bid History ──
  historyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    gap: 0,
    borderWidth: 1,
    borderColor: '#EAE5DF',
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2B1810',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#F5EFE6',
  },
  historyRowTop: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  historyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EAE5DF',
  },
  historyAvatarTop: {
    borderColor: colors.terracotta,
    borderWidth: 2,
  },
  historyUser: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2B1810',
  },
  historyUserTop: {
    color: colors.terracotta,
    fontWeight: '900',
  },
  historyAt: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 1,
  },
  historyAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2B1810',
  },
  historyAmountTop: {
    color: colors.terracotta,
    fontSize: 14,
    fontWeight: '900',
  },
});

export default LiveAuctionScreen;
