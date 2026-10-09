/**
 * REWORE Mobile – DropCalendarScreen (Lịch Drop & Countdown Room)
 * Redesigned: Hero Card với lookbook gradient, countdown typography lớn,
 * Glassmorphism Remind button, thẻ Drop sạch không border đỏ, badge LIVE NOW
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ChevronRight } from 'lucide-react-native';
import { colors } from '@/components/theme';

// ────────────────────────────────────────────────────────────────────────────
// Types & Data
// ────────────────────────────────────────────────────────────────────────────

interface DropSession {
  id: string;
  title: string;
  shop: string;
  dropAt: number; // timestamp ms
  itemCount: number;
  category: string;
  isNext?: boolean;
  status: 'upcoming' | 'live' | 'ended';
  heroImg: string;
}

const NOW = Date.now();
const SESSIONS: DropSession[] = [
  {
    id: 'd1',
    title: 'Archive Drop #42',
    shop: 'Old Soul Studio',
    dropAt: NOW + 4 * 3600000 + 32 * 60000 + 18000,
    itemCount: 24,
    category: 'Đồ si Nhật',
    isNext: true,
    status: 'upcoming',
    heroImg: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=700&h=400&fit=crop',
  },
  {
    id: 'd2',
    title: 'Y2K Mega Drop',
    shop: 'Archive Denim',
    dropAt: NOW + 8 * 3600000,
    itemCount: 36,
    category: 'Y2K / 2000s',
    status: 'upcoming',
    heroImg: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=340&fit=crop',
  },
  {
    id: 'd3',
    title: 'Cozy Fall Edit',
    shop: 'Cozy Knits VN',
    dropAt: NOW + 24 * 3600000,
    itemCount: 15,
    category: 'Knits & Sweaters',
    status: 'upcoming',
    heroImg: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=340&fit=crop',
  },
  {
    id: 'd4',
    title: 'Vintage Leather Special',
    shop: 'Tiệm Đồ Si Sài Gòn',
    dropAt: NOW - 60000, // đã live
    itemCount: 18,
    category: 'Leather & Jackets',
    status: 'live',
    heroImg: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=340&fit=crop',
  },
  {
    id: 'd5',
    title: 'Minimalist Set Drop',
    shop: 'Silk & Stone',
    dropAt: NOW - 2 * 3600000,
    itemCount: 20,
    category: 'Minimalist',
    status: 'ended',
    heroImg: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=600&h=340&fit=crop',
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Countdown hook
// ────────────────────────────────────────────────────────────────────────────

function useCountdown(targetMs: number) {
  const [ms, setMs] = useState(Math.max(0, targetMs - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setMs(Math.max(0, targetMs - Date.now())), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const totalSec = Math.floor(ms / 1000);
  const hh = Math.floor(totalSec / 3600).toString().padStart(2, '0');
  const mm = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
  const ss = (totalSec % 60).toString().padStart(2, '0');
  return { hh, mm, ss, done: ms === 0 };
}

// ────────────────────────────────────────────────────────────────────────────
// Pulsing live dot
// ────────────────────────────────────────────────────────────────────────────

function LiveDot() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.6, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View style={[styles.liveDotCore, { transform: [{ scale: pulseAnim }] }]} />
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Next Drop Hero Card – Lookbook image + dark gradient + typography countdown
// ────────────────────────────────────────────────────────────────────────────

function NextDropCard({ session }: { session: DropSession }) {
  const { hh, mm, ss, done } = useCountdown(session.dropAt);
  const [reminded, setReminded] = useState(false);

  const handleRemind = () => {
    setReminded(true);
    Alert.alert(
      'Đã đặt nhắc nhở!',
      `Chúng tôi sẽ thông báo 5 phút trước khi ${session.title} mở bán.`,
    );
  };

  return (
    <View style={styles.heroCard}>
      {/* Lookbook background image */}
      <Image source={{ uri: session.heroImg }} style={styles.heroBg} resizeMode="cover" />
      {/* Gradient overlay */}
      <View style={styles.heroOverlay} />

      {/* Content */}
      <View style={styles.heroContent}>
        {/* Badge */}
        <View style={styles.nextDropBadge}>
          <View style={styles.badgeDot} />
          <Text style={styles.nextDropBadgeText}>NEXT DROP</Text>
        </View>

        <Text style={styles.heroTitle}>{session.title}</Text>
        <Text style={styles.heroShop}>{session.shop} · {session.itemCount} món · #{session.category}</Text>

        {done ? (
          <View style={styles.liveNowRow}>
            <LiveDot />
            <Text style={styles.liveNowText}>MỞ BÁN RỒI! Giữ hàng ngay</Text>
          </View>
        ) : (
          <>
            {/* Typography countdown */}
            <View style={styles.countdownTypo}>
              <View style={styles.countdownUnit}>
                <Text style={styles.countdownNum}>{hh}</Text>
                <Text style={styles.countdownLabel}>GIỜ</Text>
              </View>
              <Text style={styles.countdownSep}>:</Text>
              <View style={styles.countdownUnit}>
                <Text style={styles.countdownNum}>{mm}</Text>
                <Text style={styles.countdownLabel}>PHÚT</Text>
              </View>
              <Text style={styles.countdownSep}>:</Text>
              <View style={styles.countdownUnit}>
                <Text style={styles.countdownNum}>{ss}</Text>
                <Text style={styles.countdownLabel}>GIÂY</Text>
              </View>
            </View>

            {/* Glassmorphism Remind button */}
            <TouchableOpacity
              style={[styles.remindBtn, reminded && styles.remindBtnActive]}
              onPress={handleRemind}
              activeOpacity={0.85}
            >
              <Bell color={reminded ? '#2D5927' : '#fff'} size={15} strokeWidth={2} />
              <Text style={[styles.remindBtnText, reminded && styles.remindBtnTextActive]}>
                {reminded ? 'Đã đặt nhắc nhở' : 'Nhắc tôi'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Session card – clean white card, badge LIVE NOW, no red borders
// ────────────────────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: DropSession }) {
  const { hh, mm, ss } = useCountdown(session.dropAt);
  const [reminded, setReminded] = useState(false);

  const isLive = session.status === 'live';
  const isEnded = session.status === 'ended';

  return (
    <View style={styles.sessionCard}>
      {/* Thumbnail */}
      <Image source={{ uri: session.heroImg }} style={styles.sessionThumb} resizeMode="cover" />

      <View style={styles.sessionBody}>
        {/* Status badge */}
        {isLive ? (
          <View style={styles.liveBadgeRow}>
            <LiveDot />
            <Text style={styles.liveBadgeText}>LIVE NOW</Text>
          </View>
        ) : isEnded ? (
          <View style={styles.endedBadge}>
            <Text style={styles.endedBadgeText}>ĐÃ KẾT THÚC</Text>
          </View>
        ) : (
          <View style={styles.upcomingBadge}>
            <Text style={styles.upcomingBadgeText}>SẮP MỞ</Text>
          </View>
        )}

        <Text style={styles.sessionTitle}>{session.title}</Text>
        <Text style={styles.sessionShop}>{session.shop}</Text>
        <Text style={styles.sessionMeta}>{session.itemCount} món · #{session.category}</Text>
      </View>

      <View style={styles.sessionAction}>
        {isEnded ? (
          <Text style={styles.sessionEndedText}>Đã kết thúc</Text>
        ) : isLive ? (
          <TouchableOpacity style={styles.goLiveBtn} activeOpacity={0.85}>
            <Text style={styles.goLiveBtnText}>Tham gia</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.sessionCountdown}>{hh}:{mm}:{ss}</Text>
            <TouchableOpacity
              onPress={() => {
                setReminded(true);
                Alert.alert('Đã đặt nhắc nhở!', `Sẽ nhắc trước ${session.title} 5 phút.`);
              }}
              style={[styles.remindSmall, reminded && styles.remindSmallActive]}
              activeOpacity={0.8}
            >
              <Bell color={reminded ? '#2D5927' : colors.muted} size={12} strokeWidth={2} />
              <Text style={[styles.remindSmallText, reminded && { color: '#2D5927' }]}>
                {reminded ? 'Nhắc rồi' : 'Nhắc tôi'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Screen
// ────────────────────────────────────────────────────────────────────────────

export function DropCalendarScreen() {
  const insets = useSafeAreaInsets();
  const nextDrop = SESSIONS.find((s) => s.isNext);
  const live = SESSIONS.filter((s) => s.status === 'live');
  const upcoming = SESSIONS.filter((s) => s.status === 'upcoming' && !s.isNext);
  const ended = SESSIONS.filter((s) => s.status === 'ended');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Lịch Drop</Text>
          <Text style={styles.headerSub}>Săn hàng đúng giờ, không bỏ lỡ</Text>
        </View>

        {/* Next Drop Hero Card */}
        {nextDrop && <NextDropCard session={nextDrop} />}

        {/* Live sessions */}
        {live.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionLiveRow}>
                <LiveDot />
                <Text style={styles.sectionTitle}>Đang mở bán</Text>
              </View>
            </View>
            {live.map((s) => <SessionCard key={s.id} session={s} />)}
          </View>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sắp mở</Text>
            {upcoming.map((s) => <SessionCard key={s.id} session={s} />)}
          </View>
        )}

        {/* Ended */}
        {ended.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>Đã kết thúc</Text>
            {ended.map((s) => <SessionCard key={s.id} session={s} />)}
          </View>
        )}
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
    backgroundColor: '#FAF8F5',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#2B1810',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 12.5,
    color: colors.muted,
    marginTop: 2,
  },

  // ── Hero Card ──
  heroCard: {
    marginHorizontal: 14,
    borderRadius: 22,
    overflow: 'hidden',
    height: 290,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  heroBg: {
    ...StyleSheet.absoluteFill,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 10, 5, 0.62)',
  },
  heroContent: {
    flex: 1,
    padding: 22,
    justifyContent: 'flex-end',
    gap: 8,
  },
  nextDropBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD79E',
  },
  nextDropBadgeText: {
    color: '#FFD79E',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 28,
  },
  heroShop: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },

  // Countdown typography
  countdownTypo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  countdownUnit: {
    alignItems: 'center',
    minWidth: 50,
  },
  countdownNum: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    fontVariant: ['tabular-nums'],
    lineHeight: 46,
  },
  countdownLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  countdownSep: {
    fontSize: 34,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '900',
    marginBottom: 14,
  },

  // Glassmorphism remind button
  remindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    marginTop: 6,
  },
  remindBtnActive: {
    backgroundColor: '#E8F0DA',
    borderColor: '#B7D5A5',
  },
  remindBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  remindBtnTextActive: {
    color: '#2D5927',
  },

  // Live now row in hero
  liveNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(200,80,60,0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(200,80,60,0.4)',
  },
  liveNowText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.3,
  },

  // Live dot
  liveDotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },

  // ── Section ──
  section: {
    marginTop: 20,
    gap: 10,
    paddingHorizontal: 14,
  },
  sectionHeader: {
    marginBottom: 0,
  },
  sectionLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2B1810',
    letterSpacing: 0.2,
  },

  // ── Session Card ──
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#3A2417',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sessionThumb: {
    width: 80,
    height: 90,
  },
  sessionBody: {
    flex: 1,
    padding: 12,
    gap: 3,
  },
  // Status badges
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  liveBadgeText: {
    color: '#2D7A44',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  endedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0EAE2',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 3,
  },
  endedBadgeText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  upcomingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F0DA',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 3,
  },
  upcomingBadgeText: {
    color: '#3D6B2E',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sessionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2B1810',
    lineHeight: 17,
  },
  sessionShop: {
    fontSize: 10.5,
    color: colors.muted,
  },
  sessionMeta: {
    fontSize: 10,
    color: colors.muted,
  },
  sessionAction: {
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 90,
  },
  sessionCountdown: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2B1810',
    fontVariant: ['tabular-nums'],
  },
  remindSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E4D8CC',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  remindSmallActive: {
    borderColor: '#B7D5A5',
    backgroundColor: '#F0F7EC',
  },
  remindSmallText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.muted,
  },
  goLiveBtn: {
    backgroundColor: '#2B1810',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  goLiveBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  sessionEndedText: {
    fontSize: 11,
    color: colors.muted,
  },
});

export default DropCalendarScreen;
