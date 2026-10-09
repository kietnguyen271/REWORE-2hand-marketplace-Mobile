/**
 * REWORE Mobile – ChatScreen (Hệ thống Tin nhắn & Tự Động Hóa Chốt Đơn)
 * Redesigned: Order Pin trắng kem sạch, Chat bubbles chuẩn iMessage,
 * Avatar shop chỉ hiện 1 lần mỗi cụm, Quick Action Pills vector icon,
 * Send button active khi có text
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, QrCode, CheckCircle, Send, ChevronLeft, X } from 'lucide-react-native';
import { colors } from '@/components/theme';
import { useAuthStore } from '@/stores/authStore';
import { useHoldStore } from '@/stores/holdStore';
import { formatVnd } from '@/utils/format';

const { width: SCREEN_W } = Dimensions.get('window');

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  sender: 'user' | 'shop' | 'system';
  text: string;
  time: string;
  isOrderCard?: boolean;
  isAddressCard?: boolean;
  isQrCard?: boolean;
  isConfirmedCard?: boolean;
}

interface Conversation {
  id: string;
  shopName: string;
  shopAvatar: string;
  verified: boolean;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  hasActiveHold: boolean;
}

const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-saigonji',
    shopName: 'Tiệm Đồ Si Sài Gòn',
    shopAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face',
    verified: true,
    lastMessage: 'Shop đã giữ áo khoác Denim Patchwork cho bạn rồi nhé!',
    lastTime: 'Vừa xong',
    unreadCount: 1,
    hasActiveHold: true,
  },
  {
    id: 'conv-oldsoul',
    shopName: 'Old Soul Studio',
    shopAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',
    verified: true,
    lastMessage: 'Đơn hàng Blazer dạ của bạn đã được giao cho shipper.',
    lastTime: '2 giờ trước',
    unreadCount: 0,
    hasActiveHold: false,
  },
  {
    id: 'conv-archive',
    shopName: 'Archive Denim',
    shopAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=face',
    verified: false,
    lastMessage: 'Hẹn bạn phiên Drop Y2K tối nay lúc 20:00!',
    lastTime: 'Hôm qua',
    unreadCount: 0,
    hasActiveHold: false,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Countdown Hook for Order Pin
// ────────────────────────────────────────────────────────────────────────────

function useOrderCountdown(expiresAt: number) {
  const [secondsRemaining, setSecondsRemaining] = useState(
    Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsRemaining(diff);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const mm = Math.floor(secondsRemaining / 60).toString().padStart(2, '0');
  const ss = (secondsRemaining % 60).toString().padStart(2, '0');
  return { display: `${mm}:${ss}`, isUrgent: secondsRemaining < 180, isExpired: secondsRemaining <= 0 };
}

// ────────────────────────────────────────────────────────────────────────────
// Main Chat Screen
// ────────────────────────────────────────────────────────────────────────────

export function ChatScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { heldItems, releaseHold, pinnedItemId, setPinnedItemId } = useHoldStore();

  const [activeConv, setActiveConv] = useState<Conversation | null>(SAMPLE_CONVERSATIONS[0]);
  const [inputText, setInputText] = useState('');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const activeHeldItem = heldItems.find((i) => i.id === pinnedItemId) || heldItems[0];
  const { display: countdownDisplay, isUrgent, isExpired } = useOrderCountdown(
    activeHeldItem ? activeHeldItem.expiresAt : Date.now(),
  );

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'system',
      text: 'Bạn đã bấm giữ Áo khoác Denim Patchwork! Đơn hàng được khóa tạm thời 15 phút.',
      time: '14:36',
    },
    {
      id: 'm2',
      sender: 'shop',
      text: 'Chào bạn Đạt Thành! Shop đã thấy bạn giữ chiếc áo Denim Patchwork size M cực hiếm này. Bạn có muốn shop gửi thêm ảnh chi tiết chất vải không ạ?',
      time: '14:37',
    },
  ]);

  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages.length]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      time: timeStr,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    setTimeout(() => {
      const replyMsg: Message = {
        id: `shop-${Date.now()}`,
        sender: 'shop',
        text: 'Dạ shop đã nhận thông tin! Shop đang chuẩn bị gói hàng cẩn thận cho bạn nhé ạ 📦✨',
        time: timeStr,
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 1500);
  };

  const handleSendAddress = () => {
    const addressMsg =
      'ĐỊA CHỈ NHẬN HÀNG CỦA TÔI:\n' +
      '• Người nhận: Đạt Thành\n' +
      '• SĐT: 0987 654 321\n' +
      '• Địa chỉ: 123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM\n' +
      '• Ghi chú: Giao giờ hành chính nhé!';
    sendMessage(addressMsg);
  };

  const handleShowQr = () => {
    setQrModalVisible(true);
  };

  const handleConfirmOrder = () => {
    Alert.alert(
      'Xác nhận chốt đơn',
      'Bạn và chủ shop đồng ý chốt đơn? Đơn sẽ lưu vào Lịch sử giao dịch và cộng +2 điểm uy tín.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Chốt đơn ngay',
          style: 'default',
          onPress: () => {
            setOrderConfirmed(true);
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            setMessages((prev) => [
              ...prev,
              {
                id: `confirm-${Date.now()}`,
                sender: 'system',
                text: 'CHÚC MỪNG! Đơn hàng đã được xác nhận chốt thành công. Điểm uy tín của bạn +2 điểm!',
                time: timeStr,
                isConfirmedCard: true,
              },
            ]);
            if (activeHeldItem) {
              releaseHold(activeHeldItem.id);
            }
          },
        },
      ],
    );
  };

  // ── Conversation List ──
  if (!activeConv) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.convHeader}>
          <Text style={styles.convHeaderTitle}>Tin nhắn</Text>
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeText}>3 cuộc hội thoại</Text>
          </View>
        </View>

        <FlatList
          data={SAMPLE_CONVERSATIONS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.convItem}
              onPress={() => setActiveConv(item)}
              activeOpacity={0.85}
            >
              <View style={styles.convAvatarWrap}>
                <Image source={{ uri: item.shopAvatar }} style={styles.convAvatar} />
                {item.unreadCount > 0 && <View style={styles.onlineDotBadge} />}
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.convShopName}>{item.shopName}</Text>
                  {item.verified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓</Text>
                    </View>
                  )}
                  {item.hasActiveHold && (
                    <View style={styles.holdTagBadge}>
                      <Text style={styles.holdTagText}>Đang giữ hàng</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.convLastMsg, item.unreadCount > 0 && styles.convLastMsgUnread]} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={styles.convTime}>{item.lastTime}</Text>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadCircle}>
                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // ── Chat View ──
  // Helper: should show avatar? (first message of each shop-message cluster)
  const shouldShowAvatar = (index: number) => {
    const item = messages[index];
    if (item.sender !== 'shop') return false;
    const next = messages[index + 1];
    return !next || next.sender !== 'shop';
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />

        {/* ── Chat Header ── */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setActiveConv(null)}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <ChevronLeft color="#2B1810" size={22} strokeWidth={2} />
          </TouchableOpacity>

          <Image source={{ uri: activeConv.shopAvatar }} style={styles.headerAvatar} />

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={styles.headerShopName} numberOfLines={1}>
                {activeConv.shopName}
              </Text>
              {activeConv.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Đang hoạt động</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => Alert.alert('Thông tin shop', activeConv.shopName)}
          >
            <Text style={styles.shopBtnText}>Cửa hàng</Text>
          </TouchableOpacity>
        </View>

        {/* ── Order Pin Banner (White Cream) ── */}
        {activeHeldItem && !orderConfirmed && (
          <View style={styles.orderPinBanner}>
            <Image source={{ uri: activeHeldItem.img }} style={styles.orderPinImg} />

            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={styles.pinLockBadge}>
                  <Text style={styles.pinLockText}>KHÓA TẠM THỜI</Text>
                </View>
                <Text style={[styles.pinTimer, isUrgent && styles.pinTimerUrgent]}>
                  ⏳ {countdownDisplay} còn lại
                </Text>
              </View>

              <Text style={styles.pinTitle} numberOfLines={1}>
                {activeHeldItem.name}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.pinPrice}>{formatVnd(activeHeldItem.price)}</Text>
                {activeHeldItem.size && (
                  <Text style={styles.pinSpecs}>Size {activeHeldItem.size}</Text>
                )}
                {activeHeldItem.condition && (
                  <Text style={styles.pinSpecs}>{activeHeldItem.condition}</Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.pinActionRelease}
              onPress={() => {
                Alert.alert('Hủy giữ hàng', `Bạn có muốn hủy giữ ${activeHeldItem.name}?`, [
                  { text: 'Không', style: 'cancel' },
                  { text: 'Hủy giữ', style: 'destructive', onPress: () => releaseHold(activeHeldItem.id) },
                ]);
              }}
            >
              <X color={colors.muted} size={16} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Messages List ── */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            if (item.sender === 'system') {
              return (
                <View style={[styles.systemBubble, item.isConfirmedCard && styles.confirmedBubble]}>
                  <Text style={[styles.systemText, item.isConfirmedCard && styles.confirmedText]}>
                    {item.text}
                  </Text>
                </View>
              );
            }

            const isMe = item.sender === 'user';
            const showAvatar = shouldShowAvatar(index);

            return (
              <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowShop]}>
                {!isMe && (
                  <View style={{ width: 32 }}>
                    {showAvatar && (
                      <Image source={{ uri: activeConv.shopAvatar }} style={styles.bubbleAvatar} />
                    )}
                  </View>
                )}
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleShop]}>
                  <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextShop]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeShop]}>
                    {item.time}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* ── Quick Action Pills ── */}
        <View style={styles.templatesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templatesRow}>
            <TouchableOpacity style={styles.templateChip} onPress={handleSendAddress} activeOpacity={0.8}>
              <MapPin color="#5A4035" size={13} strokeWidth={2} />
              <Text style={styles.templateText}>Địa chỉ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.templateChip} onPress={handleShowQr} activeOpacity={0.8}>
              <QrCode color="#5A4035" size={13} strokeWidth={2} />
              <Text style={styles.templateText}>VietQR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.templateChip, styles.templateChipConfirm]}
              onPress={handleConfirmOrder}
              activeOpacity={0.8}
            >
              <CheckCircle color="#2D5927" size={13} strokeWidth={2} />
              <Text style={[styles.templateText, styles.templateTextConfirm]}>Chốt đơn</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── Input Bar ── */}
        <View style={[styles.inputRow, { paddingBottom: Math.max(12, insets.bottom) }]}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhắn tin cho shop..."
            placeholderTextColor={colors.muted}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            disabled={!inputText.trim()}
            onPress={() => sendMessage(inputText)}
            activeOpacity={0.8}
          >
            <Send color="#fff" size={16} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* ── QR Payment Modal ── */}
        <Modal
          visible={qrModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setQrModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.qrCard}>
              <View style={styles.qrHeader}>
                <Text style={styles.qrTitle}>MÃ THANH TOÁN VIETQR</Text>
                <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                  <X color={colors.muted} size={20} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <Text style={styles.qrSub}>Chuyển khoản trực tiếp cho {activeConv.shopName}</Text>

              <View style={styles.qrFrame}>
                <Image
                  source={{
                    uri: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=230302-REWORE-DENIM-450000',
                  }}
                  style={styles.qrImage}
                />
              </View>

              <View style={styles.bankInfoBox}>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Ngân hàng:</Text>
                  <Text style={styles.bankValue}>Vietcombank (CN Sài Gòn)</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Số tài khoản:</Text>
                  <Text style={styles.bankValueHighlight}>9988 7766 5544</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Chủ TK:</Text>
                  <Text style={styles.bankValue}>TIEM DO SI SAI GON</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Số tiền:</Text>
                  <Text style={styles.bankPrice}>
                    {formatVnd(activeHeldItem ? activeHeldItem.price : 450000)}
                  </Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Nội dung CK:</Text>
                  <Text style={styles.bankMemo}>REWORE {user?.email?.split('@')[0]?.toUpperCase() || 'DATTHANH'}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.paidConfirmBtn}
                onPress={() => {
                  setQrModalVisible(false);
                  sendMessage('Đã chuyển khoản thành công ' + formatVnd(activeHeldItem?.price ?? 450000) + ' kèm ảnh biên lai.');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.paidConfirmText}>Tôi đã chuyển khoản</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
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

  // ── Conversation List ──
  convHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DF',
    backgroundColor: '#fff',
  },
  convHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2B1810',
  },
  badgeWrap: {
    backgroundColor: '#F0EAE2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B5744',
  },
  convAvatarWrap: {
    position: 'relative',
  },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#3A2417',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  convAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#EAE5DF',
  },
  onlineDotBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  convShopName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B1810',
  },
  verifiedBadge: {
    backgroundColor: '#4A7C59',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  verifiedText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '900',
  },
  holdTagBadge: {
    backgroundColor: '#FCEBE6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  holdTagText: {
    color: colors.terracotta,
    fontSize: 9.5,
    fontWeight: '800',
  },
  convLastMsg: {
    fontSize: 12,
    color: colors.muted,
  },
  convLastMsgUnread: {
    fontWeight: '700',
    color: '#2B1810',
  },
  convTime: {
    fontSize: 10,
    color: colors.muted,
  },
  unreadCircle: {
    backgroundColor: colors.terracotta,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },

  // ── Chat Header ──
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DF',
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0EAE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#EAE5DF',
  },
  headerShopName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B1810',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4CAF50',
  },
  onlineText: {
    fontSize: 10.5,
    color: '#4CAF50',
    fontWeight: '600',
  },
  shopBtn: {
    backgroundColor: '#F0EAE2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shopBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2B1810',
  },

  // ── Order Pin Banner (WHITE CREAM) ──
  orderPinBanner: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  orderPinImg: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAE5DF',
  },
  pinLockBadge: {
    backgroundColor: '#F0EAE2',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pinLockText: {
    color: '#7A5C4A',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pinTimer: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pinTimerUrgent: {
    color: '#D44B26',
  },
  pinTitle: {
    color: '#2B1810',
    fontSize: 12.5,
    fontWeight: '800',
  },
  pinPrice: {
    color: colors.terracotta,
    fontSize: 13,
    fontWeight: '900',
  },
  pinSpecs: {
    color: colors.muted,
    fontSize: 10.5,
  },
  pinActionRelease: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0EAE2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // ── Messages ──
  messageList: {
    padding: 14,
    gap: 6,
    paddingBottom: 16,
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: '#EDE8E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: '85%',
    marginVertical: 6,
  },
  systemText: {
    fontSize: 11.5,
    color: '#5E4E42',
    textAlign: 'center',
    lineHeight: 16,
  },
  confirmedBubble: {
    backgroundColor: '#E2EEDC',
    borderWidth: 1,
    borderColor: '#ADCFA0',
  },
  confirmedText: {
    color: '#2D5927',
    fontWeight: '700',
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    maxWidth: '80%',
    marginVertical: 2,
  },
  msgRowMe: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  msgRowShop: {
    alignSelf: 'flex-start',
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
    maxWidth: SCREEN_W * 0.65,
  },
  bubbleMe: {
    backgroundColor: '#2B1810',
    borderBottomRightRadius: 4,
  },
  bubbleShop: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EAE5DF',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  msgText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  msgTextMe: {
    color: '#fff',
  },
  msgTextShop: {
    color: '#1C1917',
  },
  msgTime: {
    fontSize: 9.5,
    alignSelf: 'flex-end',
  },
  msgTimeMe: {
    color: 'rgba(255,255,255,0.5)',
  },
  msgTimeShop: {
    color: colors.muted,
  },

  // ── Quick Action Pills ──
  templatesContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EAE5DF',
    paddingVertical: 8,
  },
  templatesRow: {
    paddingHorizontal: 14,
    gap: 8,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E4D8CC',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  templateChipConfirm: {
    backgroundColor: '#EDF5EA',
    borderColor: '#BCD5B5',
  },
  templateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A4035',
  },
  templateTextConfirm: {
    color: '#2D5927',
  },

  // ── Input Row ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#EAE5DF',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5EFE6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#2B1810',
    maxHeight: 90,
  },
  sendBtn: {
    backgroundColor: '#2B1810',
    borderRadius: 22,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#C5BCB2',
  },

  // ── QR Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 22,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  qrTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2B1810',
    letterSpacing: 0.8,
  },
  qrSub: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: -6,
  },
  qrFrame: {
    padding: 12,
    backgroundColor: '#FAF5EE',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EAE5DF',
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  bankInfoBox: {
    width: '100%',
    backgroundColor: '#FAF5EE',
    borderRadius: 14,
    padding: 14,
    gap: 7,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  bankValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2B1810',
  },
  bankValueHighlight: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.terracotta,
    letterSpacing: 1,
  },
  bankPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2B1810',
  },
  bankMemo: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#5C6E4A',
  },
  paidConfirmBtn: {
    backgroundColor: '#2B1810',
    borderRadius: 24,
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  paidConfirmText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default ChatScreen;
