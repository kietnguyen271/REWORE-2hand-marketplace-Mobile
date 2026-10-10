/**
 * GateModal – Bottom sheet shown when a guest user tries to access a locked feature.
 * Slides up from the bottom with a backdrop.
 */
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Shield, Gavel, ArrowRight } from 'lucide-react-native';
import { colors } from '@/components/theme';

interface GateModalProps {
  visible: boolean;
  featureName?: string;
  onClose: () => void;
}

export function GateModal({ visible, featureName, onClose }: GateModalProps) {
  const slideAnim = useRef(new Animated.Value(500)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [fadeAnim, slideAnim, onClose]);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(500);
      fadeAnim.setValue(0);
      openSheet();
    }
  }, [visible, openSheet]);

  const contextMsg = featureName
    ? `Đăng nhập để truy cập ${featureName} và bảo mật đơn hàng.`
    : 'Giữ hàng, đấu giá trực tiếp và giao dịch có bảo đảm.';

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={closeSheet}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Drag handle */}
        <TouchableOpacity onPress={closeSheet} activeOpacity={0.7} style={styles.handleWrap}>
          <View style={styles.handle} />
        </TouchableOpacity>

        {/* Lock icon */}
        <View style={styles.lockIconWrap}>
          <View style={styles.lockIconCircle}>
            <Shield color={colors.terracotta} size={26} strokeWidth={1.8} />
          </View>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Đăng nhập để tiếp tục</Text>
        <Text style={styles.sub}>{contextMsg}</Text>

        {/* Perks */}
        <View style={styles.perksBox}>
          <View style={styles.perkRow}>
            <Shield color={colors.terracotta} size={17} strokeWidth={2} />
            <Text style={styles.perkText}>Bảo vệ giữ hàng 15 phút (escrow)</Text>
          </View>
          <View style={styles.perkRow}>
            <Gavel color={colors.terracotta} size={17} strokeWidth={2} />
            <Text style={styles.perkText}>Đấu giá trực tiếp & xác thực ngay</Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.btnPrimary}
          activeOpacity={0.85}
          onPress={() => {
            closeSheet();
            setTimeout(() => router.push('/(auth)/login'), 280);
          }}
        >
          <Text style={styles.btnPrimaryText}>Đăng nhập</Text>
          <ArrowRight color="#fff" size={18} strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          activeOpacity={0.85}
          onPress={() => {
            closeSheet();
            setTimeout(() => router.push('/(auth)/register'), 280);
          }}
        >
          <Text style={styles.btnSecondaryText}>Tạo tài khoản</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGhost} activeOpacity={0.7} onPress={closeSheet}>
          <Text style={styles.btnGhostText}>Có lẽ sau, tiếp tục xem</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(35,26,17,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF8F5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingBottom: 36,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0DED4',
    shadowColor: '#2B1810',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#DBC1B9',
  },
  lockIconWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  lockIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEEADC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#231A11',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 13,
    color: '#55433D',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 19,
    paddingHorizontal: 10,
  },
  perksBox: {
    backgroundColor: '#FFF1E8',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FEEADC',
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkText: {
    fontSize: 12.5,
    color: '#231A11',
    fontWeight: '500',
  },
  btnPrimary: {
    backgroundColor: '#974226',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    shadowColor: '#974226',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  btnSecondary: {
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#974226',
    marginBottom: 8,
  },
  btnSecondaryText: {
    color: '#974226',
    fontSize: 15,
    fontWeight: '700',
  },
  btnGhost: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  btnGhostText: {
    fontSize: 12.5,
    color: '#88726C',
    fontWeight: '500',
  },
});
