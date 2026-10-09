/**
 * REWORE Mobile – ProfileScreen
 * Thiết kế chuẩn xác theo mockup:
 * - Header giấy kraft với tên, avatar, tag REWORE giấy rách
 * - Thẻ Uy tín với vòng tròn điểm, các chỉ số bên phải
 * - Thẻ Đang giữ hàng
 * - Thẻ Hoạt động đấu giá
 * - Menu điều hướng
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  ImageBackground,
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
  Heart,
  History,
  Settings,
  Gavel,
  MessageSquare,
  Bell,
  PackageCheck,
  CalendarX2,
  Star,
  ChevronRight,
  Clock,
} from 'lucide-react-native';
import { colors } from '@/components/theme';
import { useAuthStore } from '@/stores/authStore';
import { useHoldStore } from '@/stores/holdStore';
import { formatVnd } from '@/utils/format';

// ────────────────────────────────────────────────────────────────────────────
// SVG-style circular progress (using Animated + SVG-like technique in RN)
// ────────────────────────────────────────────────────────────────────────────

function CircularScore({ score, total = 100, size = 96 }: { score: number; total?: number; size?: number }) {
  const progress = Math.min(1, score / total);
  const RADIUS = size / 2 - 4;
  const CIRCUM = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUM * (1 - progress);

  const animVal = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animVal, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Vòng nền */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 6,
          borderColor: '#DDE2D5',
        }}
      />
      {/* Vòng process (giả lập bằng 4 viền) */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 6,
          borderColor: 'transparent',
          borderTopColor: '#366946',
          borderRightColor: score >= 25 ? '#366946' : 'transparent',
          borderBottomColor: score >= 50 ? '#366946' : 'transparent',
          borderLeftColor: score >= 75 ? '#366946' : 'transparent',
          transform: [{ rotate: `-45deg` }],
        }}
      />
      {/* Điểm số */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={[styles.scoreNum, { fontSize: size * 0.3 }]}>{score}</Text>
        <Text style={[styles.scoreTotal, { fontSize: size * 0.16 }]}>/{total}</Text>
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Held Item countdown hook
// ────────────────────────────────────────────────────────────────────────────

function useItemCountdown(expiresAt: number) {
  const [remaining, setRemaining] = useState(Math.max(0, expiresAt - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, expiresAt - Date.now())), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const totalSec = Math.floor(remaining / 1000);
  const mm = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const ss = (totalSec % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Held Item Card
// ────────────────────────────────────────────────────────────────────────────

function HeldItemCard({ item, onMessage, onCancel }: {
  item: { id: string; name: string; price: number; shop: string; img: string; size?: string; condition?: string; expiresAt: number };
  onMessage: () => void;
  onCancel: () => void;
}) {
  const countdown = useItemCountdown(item.expiresAt);
  return (
    <View style={styles.heldItemContent}>
      <View style={styles.heldItemRow}>
        {item.img ? (
          <Image source={{ uri: item.img }} style={styles.heldItemImg} resizeMode="cover" />
        ) : (
          <View style={[styles.heldItemImg, { backgroundColor: colors.line }]} />
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.heldItemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.heldItemShop}>{item.shop}</Text>
          <Text style={styles.heldItemMeta}>
            {formatVnd(item.price).replace(' ₫', 'đ')} • {item.size ? `Size ${item.size}` : ''} • {item.condition ? `${item.condition}` : ''}
          </Text>
          <View style={styles.heldTimerRow}>
            <Clock color="#A84C32" size={13} strokeWidth={2.5} />
            <Text style={styles.heldTimer}>{countdown} còn lại</Text>
          </View>
        </View>
        <ChevronRight color={colors.muted} size={18} />
      </View>

      {/* Action buttons */}
      <View style={styles.heldActions}>
        <TouchableOpacity style={styles.msgBtn} onPress={onMessage} activeOpacity={0.85}>
          <MessageSquare color="#fff" size={15} strokeWidth={2} />
          <Text style={styles.msgBtnText}>Nhắn tin cho shop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.85}>
          <Text style={styles.cancelBtnText}>Hủy giữ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Menu row
// ────────────────────────────────────────────────────────────────────────────

function MenuRow({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.menuIconWrap}>{icon}</View>
      <Text style={styles.menuLabel}>{label}</Text>
      <ChevronRight color={colors.ink} size={18} strokeWidth={2} />
    </TouchableOpacity>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Screen
// ────────────────────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { reputationScore, heldItems, releaseHold, setPinnedItemId } = useHoldStore();

  if (!user) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 20, alignItems: 'center' }]}>
        <Text style={styles.emptyTitle}>Bạn chưa đăng nhập</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.loginBtnText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = user.fullName || user.name || 'Đạt Thành';
  const handle = '@datthanh.rewore';

  const handleRelease = (id: string, name: string) => {
    Alert.alert('Hủy giữ hàng', `Bạn có chắc muốn hủy giữ "${name}"?`, [
      { text: 'Thôi', style: 'cancel' },
      { text: 'Hủy giữ', style: 'destructive', onPress: () => releaseHold(id) },
    ]);
  };

  const handleMessage = (shopName: string, itemId?: string) => {
    if (itemId) setPinnedItemId(itemId);
    router.push('/(tabs)/cart');
  };

  const reputationLabel = 'Rất uy tín';
  const repBadgeColor = '#366946'; // Green color

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Header Banner (Brown Kraft Paper Texture) ── */}
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1603513492128-ba7bfaf8d745?w=800&q=80' }}
          style={[styles.headerBanner, { paddingTop: insets.top + 10 }]}
          imageStyle={{ opacity: 0.8 }}
        >
          {/* Overlay to darken slightly if needed */}
          <View style={styles.headerOverlay} />

          <View style={styles.headerTop}>
            <View style={{ width: 60 }} /> {/* Spacer */}
            <Text style={styles.handleText}>{handle}</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }} onPress={() => Alert.alert('Cài đặt')}>
                <Settings color="#EADCC7" size={20} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }} onPress={() => Alert.alert('Thông báo')}>
                <View style={{ position: 'relative' }}>
                  <Bell color="#EADCC7" size={20} strokeWidth={2} />
                  <View style={styles.notificationDot} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileRow}>
            {/* Left side: Avatar + Info */}
            <View style={styles.profileInfoArea}>
              <View style={styles.avatarWrap}>
                <Image source={{ uri: user.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop' }} style={styles.avatarImg} />
              </View>
              <View style={styles.nameWrap}>
                <Text style={styles.displayName}>{displayName}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>Người mua</Text>
                </View>
              </View>
            </View>

            {/* Right side: REWORE tag image */}
            {/* The tag from our mockup uses the generated transparent tag */}
            <Image
              source={{ uri: 'https://i.imgur.com/2U54z2K.png' }} // placeholder, using text instead as fallback, but let's try to mimic the tag
              style={{ width: 0, height: 0 }} // Hidden for now, we build it via UI to match exactly if image is not right, but wait, I can just use a local styled view that looks like it.
            />
            <View style={styles.tagMockup}>
              <Text style={styles.tagTitle}>REWORE</Text>
              <View style={styles.tagDivider} />
              <Text style={styles.tagSub}>Secondhand</Text>
              <Text style={styles.tagScript}>Vintage Fashion</Text>
            </View>
          </View>

          {/* Torn paper overlay effect at bottom */}
          <View style={styles.tornPaperWrap}>
            <Image
              source={{ uri: 'https://i.imgur.com/2U54z2K.png' }}
              style={styles.tornPaperImg}
              resizeMode="cover"
            />
          </View>
        </ImageBackground>

        {/* Mảng màu nền chung cho phần body, vì giấy kraft chỉ ở trên */}
        <View style={styles.bodyBg}>

          {/* ── Reputation Card ── */}
          <View style={styles.repCard}>
            <View style={styles.repRow}>
              {/* Left: circular score */}
              <View style={styles.repLeft}>
                <CircularScore score={reputationScore} size={84} />
                <View style={styles.repLabelWrap}>
                  <Text style={styles.repCrown}>👑</Text>
                  <Text style={[styles.repLabel, { color: repBadgeColor }]}>{reputationLabel}</Text>
                </View>
                <Text style={styles.repSub}>Cộng đồng tin tưởng</Text>

                <TouchableOpacity style={styles.repLinkBtn}>
                  <Text style={styles.repLink}>Xem cách tính điểm →</Text>
                  <View style={styles.dottedLine} />
                </TouchableOpacity>
              </View>

              {/* Right: stats */}
              <View style={styles.repRight}>
                <View style={styles.statRow}>
                  <PackageCheck color="#736456" size={16} strokeWidth={2} />
                  <View style={styles.statTexts}>
                    <Text style={styles.statValue}>156</Text>
                    <Text style={styles.statLabel}>Giao dịch thành công</Text>
                  </View>
                </View>

                <View style={styles.statRow}>
                  <CalendarX2 color="#736456" size={16} strokeWidth={2} />
                  <View style={styles.statTexts}>
                    <Text style={styles.statValue}>2</Text>
                    <Text style={styles.statLabel}>Lần quá hạn giữ hàng</Text>
                  </View>
                </View>

                <View style={styles.statRow}>
                  <Gavel color="#736456" size={16} strokeWidth={2} />
                  <View style={styles.statTexts}>
                    <Text style={styles.statValue}>12</Text>
                    <Text style={styles.statLabel}>Lần thắng đấu giá</Text>
                  </View>
                </View>

                <View style={styles.statRow}>
                  <Star color="#736456" size={16} strokeWidth={2} />
                  <View style={styles.statTexts}>
                    <Text style={styles.statValue}>48</Text>
                    <Text style={styles.statLabel}>Đánh giá từ shop</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ── Đang Giữ Hàng ── */}
          <View style={styles.heldSection}>
            <View style={styles.heldHeader}>
              <Text style={styles.heldTitle}>ĐANG GIỮ HÀNG ({heldItems.length})</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>Xem tất cả →</Text>
              </TouchableOpacity>
            </View>

            {heldItems.length > 0 ? (
              <HeldItemCard
                key={heldItems[0].id}
                item={heldItems[0]}
                onMessage={() => handleMessage(heldItems[0].shop, heldItems[0].id)}
                onCancel={() => handleRelease(heldItems[0].id, heldItems[0].name)}
              />
            ) : (
              <View style={{ padding: 14 }}>
                <Text style={{ textAlign: 'center', color: colors.muted }}>Chưa giữ món nào.</Text>
              </View>
            )}
          </View>

          {/* ── Hoạt động đấu giá ── */}
          <View style={styles.auctionCard}>
            <View style={styles.auctionLeft}>
              <View style={styles.auctionIconWrap}>
                <Gavel color="#4F3422" size={20} strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.auctionTitle}>Hoạt động đấu giá</Text>
                <Text style={styles.auctionSub}>4 phiên tham gia • 1 thắng</Text>
              </View>
            </View>
            <View style={styles.auctionRight}>
              <TouchableOpacity style={styles.historyBtn} activeOpacity={0.8}>
                <Text style={styles.historyBtnText}>Xem lịch sử →</Text>
              </TouchableOpacity>
              <View style={styles.auctionThumbWrap}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=120&h=120&fit=crop' }} style={styles.auctionThumbImg} />
                <View style={styles.miniCrownWrap}>
                  <Text style={styles.miniCrown}>👑</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Menu điều hướng ── */}
          <View style={styles.menuCard}>
            <MenuRow icon={<Heart color="#3A2417" size={20} strokeWidth={1.5} />} label="Danh sách yêu thích" onPress={() => router.push('/(tabs)/wishlist')} />
            <View style={styles.menuDivider} />
            <MenuRow icon={<History color="#3A2417" size={20} strokeWidth={1.5} />} label="Lịch sử giao dịch" onPress={() => router.push('/orders')} />
            <View style={styles.menuDivider} />
            <MenuRow icon={<Settings color="#3A2417" size={20} strokeWidth={1.5} />} label="Cài đặt & Hỗ trợ" onPress={() => Alert.alert('Cài đặt')} />
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF8F5', // Nền màu kem toàn màn hình
  },
  bodyBg: {
    backgroundColor: '#FAF8F5',
    flex: 1,
  },

  // ── Header Banner ──
  headerBanner: {
    backgroundColor: '#4A3320', // Fallback color
    paddingBottom: 45, // Để chừa chỗ cho giấy rách + thẻ uy tín đè lên
    position: 'relative',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(58, 36, 23, 0.6)', // Phủ một lớp màu nâu mờ để nổi bật chữ
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
    zIndex: 10,
  },
  handleText: {
    color: '#F4EAE0',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    width: 60,
    justifyContent: 'flex-end',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53935',
    borderWidth: 1.5,
    borderColor: '#4A3320',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  profileInfoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  nameWrap: {
    gap: 4,
  },
  displayName: {
    color: '#F9F5F0',
    fontSize: 19,
    fontWeight: '800',
  },
  roleBadge: {
    backgroundColor: '#F5EFE6',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#4F3422',
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Tag Mockup ──
  tagMockup: {
    backgroundColor: '#EBDDC9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 2,
    alignItems: 'center',
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 2, height: 3 },
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  tagTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4F3422',
    fontFamily: 'serif',
    letterSpacing: 1.5,
  },
  tagDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#A89987',
    marginVertical: 4,
  },
  tagSub: {
    fontSize: 9,
    color: '#736456',
    fontFamily: 'serif',
    fontStyle: 'italic',
  },
  tagScript: {
    fontSize: 11,
    color: '#4F3422',
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontWeight: '700',
  },

  // ── Torn Paper ──
  tornPaperWrap: {
    position: 'absolute',
    bottom: -15, // Kéo xuống để nối với nền
    left: 0,
    right: 0,
    height: 40,
    zIndex: 5,
  },
  tornPaperImg: {
    width: '100%',
    height: '100%',
    tintColor: '#FAF8F5', // Đổi màu giấy rách thành màu kem nền
  },

  // ── Reputation Card ──
  repCard: {
    backgroundColor: '#FFFdfa', // Trắng hơi kem
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: -25, // Kéo lên đè lên giấy rách
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderWidth: 1.5,
    borderColor: '#E8DCCB',
    shadowColor: '#3A2417',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    zIndex: 10,
  },
  repRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repLeft: {
    alignItems: 'center',
    width: 130, // Cố định chiều rộng bên trái
    borderRightWidth: 1,
    borderRightColor: '#F0EAE2',
    paddingRight: 10,
  },
  scoreNum: {
    fontWeight: '900',
    color: '#2B1810',
  },
  scoreTotal: {
    color: '#736456',
    fontWeight: '600',
  },
  repLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  repCrown: {
    fontSize: 14,
  },
  repLabel: {
    fontSize: 14,
    fontWeight: '900',
  },
  repSub: {
    fontSize: 10,
    color: '#736456',
    marginTop: 2,
    fontWeight: '500',
  },
  repLinkBtn: {
    marginTop: 12,
  },
  repLink: {
    fontSize: 10,
    color: '#736456',
    fontWeight: '600',
  },
  dottedLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#A89987',
    borderStyle: 'dashed',
    marginTop: 1,
  },
  repRight: {
    flex: 1,
    paddingLeft: 16,
    gap: 12, // Khoảng cách giữa các dòng
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statTexts: {
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2B1810',
    lineHeight: 18,
  },
  statLabel: {
    fontSize: 11,
    color: '#736456',
    lineHeight: 14,
    fontWeight: '500',
  },

  // ── Đang Giữ Hàng ──
  heldSection: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#F7EFE5', // Màu nền hơi nâu nhạt của thẻ Đang Giữ Hàng
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8DCCB',
    padding: 14,
  },
  heldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heldTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#3A2417',
    letterSpacing: 0.3,
  },
  seeAll: {
    fontSize: 11,
    color: '#5C4A3D',
    fontWeight: '600',
  },
  heldItemContent: {
    backgroundColor: '#FFFdfa', // Trắng hơi kem cho phần content bên trong
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFE7DE',
  },
  heldItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heldItemImg: {
    width: 60,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F5EFE6',
  },
  heldItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2B1810',
  },
  heldItemShop: {
    fontSize: 11,
    color: '#736456',
    marginTop: 1,
  },
  heldItemMeta: {
    fontSize: 11,
    color: '#5C4A3D',
    marginTop: 4,
  },
  heldTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  heldTimer: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#A84C32', // Màu đỏ nâu
  },
  heldActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  msgBtn: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: '#4F3422', // Nền nâu đậm
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  msgBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1E5D5', // Nền kem đậm
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8DCCB',
  },
  cancelBtnText: {
    color: '#4F3422',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Hoạt động đấu giá ──
  auctionCard: {
    backgroundColor: '#F7EFE5',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E8DCCB',
  },
  auctionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  auctionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EBDDC9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  auctionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2B1810',
  },
  auctionSub: {
    fontSize: 11,
    color: '#736456',
    marginTop: 2,
  },
  auctionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyBtn: {
    backgroundColor: '#EBDDC9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  historyBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F3422',
  },
  auctionThumbWrap: {
    position: 'relative',
  },
  auctionThumbImg: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  miniCrownWrap: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 1,
  },
  miniCrown: {
    fontSize: 10,
  },

  // ── Menu ──
  menuCard: {
    backgroundColor: '#FFFdfa',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E8DCCB',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  menuIconWrap: {
    width: 24,
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#2B1810',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0EAE2',
  },

  // Others
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 10,
  },
  loginBtn: {
    backgroundColor: colors.terracotta,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
});
