/**
 * REWORE Mobile – Auth Screens
 * Design: UI/18 (Login) · UI/19 (Register)
 */
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
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
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { getErrorMessage } from '@/utils/format';

const HERO_URI = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop&crop=top';
const C = {
  bg: '#FFF8F5', card: '#FFFFFF', primary: '#974226', onPrimary: '#FFFFFF',
  border: '#DBC1B9', borderFocus: '#231A11', text: '#231A11', muted: '#55433D',
  placeholder: '#88726C', line: '#EDD8C8',
};
type RoleId = 'buyer' | 'seller' | 'admin';
const ROLES = [
  { id: 'buyer' as RoleId, label: 'Buyer', sub: 'Browse drops, hold items, join live auctions & bid.', Icon: ShoppingBag, iconBg: '#FFDBD0', iconColor: '#974226' },
  { id: 'seller' as RoleId, label: 'Shop Owner', sub: 'Manage drops, live auctions, inventory & payouts.', Icon: Store, iconBg: '#EDE1D2', iconColor: '#55433D' },
  { id: 'admin' as RoleId, label: 'Platform Admin', sub: 'Appeals, trust score audits & verification.', Icon: ShieldCheck, iconBg: '#DAE9B5', iconColor: '#556138' },
];

function AuthHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[sty.header, { paddingTop: insets.top + 2 }]}>
      <TouchableOpacity style={sty.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <ArrowLeft size={20} color={C.muted} strokeWidth={2} />
      </TouchableOpacity>
      <Text style={sty.headerLogo}>REWORE.</Text>
      <View style={sty.headerBtn} />
    </View>
  );
}

function HeroStrip({ quote }: { quote: string }) {
  return (
    <View style={sty.heroWrap}>
      <Image source={{ uri: HERO_URI }} style={sty.heroImg} resizeMode="cover" />
      <View style={sty.heroOverlay} />
      <View style={sty.heroBadge}><View style={sty.heroBadgeDot} /><Text style={sty.heroBadgeText}>CURATED ARCHIVE</Text></View>
      <Text style={sty.heroSeason}>AUTUMN 24</Text>
      <Text style={sty.heroQuote}>{quote}</Text>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, secure, keyboardType = 'default', autoCapitalize = 'none', icon: Icon, hint }: { label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; secure?: boolean; keyboardType?: any; autoCapitalize?: any; icon?: any; hint?: string }) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  return (
    <View style={{ gap: 5 }}>
      <Text style={sty.label}>{label}</Text>
      <View style={[sty.inputRow, focused && sty.inputFocused]}>
        {Icon && <Icon size={16} color={focused ? C.text : C.placeholder} strokeWidth={2} />}
        <TextInput style={sty.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.placeholder} secureTextEntry={secure && !showPw} autoCapitalize={autoCapitalize} keyboardType={keyboardType} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} autoCorrect={false} />
        {secure && <TouchableOpacity onPress={() => setShowPw(p => !p)} hitSlop={8}>{showPw ? <EyeOff size={17} color={C.placeholder} strokeWidth={1.8} /> : <Eye size={17} color={C.placeholder} strokeWidth={1.8} />}</TouchableOpacity>}
      </View>
      {hint ? <Text style={sty.hint}>{hint}</Text> : null}
    </View>
  );
}

function PrimaryBtn({ title, onPress, loading }: { title: string; onPress: () => void; loading?: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={sty.primaryBtn} onPress={onPress} onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()} onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()} activeOpacity={0.9} disabled={loading}>
        {loading ? <ActivityIndicator color={C.onPrimary} /> : <><Text style={sty.primaryBtnText}>{title}</Text><ArrowRight size={17} color={C.onPrimary} strokeWidth={2.5} /></>}
      </TouchableOpacity>
    </Animated.View>
  );
}

function OrDivider() {
  return (
    <View style={sty.dividerRow}>
      <View style={sty.dividerLine} /><Text style={sty.dividerText}>OR CONTINUE AS</Text><View style={sty.dividerLine} />
    </View>
  );
}

function RoleCard({ role, selected, onSelect }: { role: typeof ROLES[0]; selected: boolean; onSelect: () => void }) {
  return (
    <TouchableOpacity style={[sty.roleCard, selected && sty.roleCardSelected]} onPress={onSelect} activeOpacity={0.85}>
      <View style={[sty.roleIcon, { backgroundColor: role.iconBg }]}><role.Icon size={18} color={role.iconColor} strokeWidth={1.8} /></View>
      <View style={{ flex: 1 }}><Text style={sty.roleLabel}>{role.label}</Text><Text style={sty.roleSub} numberOfLines={1}>{role.sub}</Text></View>
      {selected ? <CheckCircle2 size={18} color={C.primary} strokeWidth={2} /> : <Circle size={18} color={C.border} strokeWidth={1.5} />}
    </TouchableOpacity>
  );
}

function OutlineBtn({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={sty.outlineBtn} onPress={onPress} activeOpacity={0.85}>
      <Text style={sty.outlineBtnText}>{title}</Text>
      <ArrowRight size={15} color={C.primary} strokeWidth={2.5} />
    </TouchableOpacity>
  );
}

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleId>('buyer');
  const { login, loading } = useAuthStore();
  const show = useToastStore(s => s.show);

  const submit = async () => {
    if (!email || !password) { show('Vui lòng nhập email và mật khẩu.', 'error'); return; }
    try {
      const result = await login(email.trim(), password);
      if (result === 'otp') { router.replace({ pathname: '/(auth)/verify-otp', params: { email } }); return; }
      router.replace('/(tabs)');
    } catch (error) { show(getErrorMessage(error), 'error'); }
  };

  return (
    <View style={sty.root}>
      <StatusBar barStyle="dark-content" />
      <AuthHeader />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sty.scroll} keyboardShouldPersistTaps="handled">
          <HeroStrip quote='"Secondhand fashion drops, held fairly."' />
          <View style={sty.card}>
            <Text style={sty.cardTitle}>Welcome back</Text>
            <Text style={sty.cardSub}>Đăng nhập để tiếp tục với REWORE.</Text>
            <View style={{ gap: 14, marginTop: 18 }}>
              <Field label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com" icon={Mail} keyboardType="email-address" />
              <Field label="Mật khẩu" value={password} onChangeText={setPassword} placeholder="••••••••" icon={Lock} secure />
            </View>
            <View style={sty.optionsRow}>
              <View /><TouchableOpacity><Text style={sty.forgotText}>Quên mật khẩu?</Text></TouchableOpacity>
            </View>
            <PrimaryBtn title="Đăng nhập" onPress={submit} loading={loading} />
            <OrDivider />
            <View style={{ gap: 8 }}>
              {ROLES.map(r => <RoleCard key={r.id} role={r} selected={selectedRole === r.id} onSelect={() => setSelectedRole(r.id)} />)}
            </View>
            <View style={{ marginTop: 8 }}>
              <OutlineBtn title={`Vào với tư cách ${ROLES.find(r => r.id === selectedRole)?.label}`} onPress={submit} />
            </View>
          </View>
          <View style={sty.footer}>
            <Text style={sty.footerText}>Chưa có tài khoản? <Text style={sty.footerLink} onPress={() => router.push('/(auth)/register')}>Tạo tài khoản</Text></Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleId>('buyer');
  const { register } = useAuthStore();
  const show = useToastStore(s => s.show);

  const submit = async () => {
    if (!fullName || !email || !password) { show('Vui lòng điền đầy đủ thông tin.', 'error'); return; }
    if (password !== confirmPw) { show('Mật khẩu xác nhận không khớp.', 'error'); return; }
    if (!agreed) { show('Vui lòng đồng ý với điều khoản sử dụng.', 'error'); return; }
    try {
      await register({ fullName, email: email.trim(), phone, password });
      show('Đăng ký thành công! Vui lòng xác thực OTP.', 'success');
      router.replace({ pathname: '/(auth)/verify-otp', params: { email } });
    } catch (error) { show(getErrorMessage(error), 'error'); }
  };

  return (
    <View style={sty.root}>
      <StatusBar barStyle="dark-content" />
      <AuthHeader />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sty.scroll} keyboardShouldPersistTaps="handled">
          <HeroStrip quote='"Join a community that wears with intention."' />
          <View style={sty.card}>
            <Text style={sty.cardTitle}>Tạo tài khoản</Text>
            <Text style={sty.cardSub}>Khám phá, giữ hàng và đặt giá trên các sản phẩm vintage.</Text>
            <View style={{ gap: 14, marginTop: 18 }}>
              <Field label="Họ và tên" value={fullName} onChangeText={setFullName} placeholder="Elena Vance" icon={User} autoCapitalize="words" />
              <Field label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com" icon={Mail} keyboardType="email-address" />
              <Field label="Số điện thoại" value={phone} onChangeText={setPhone} placeholder="0901 234 567" icon={Phone} keyboardType="phone-pad" />
              <Field label="Mật khẩu" value={password} onChangeText={setPassword} placeholder="••••••••" icon={Lock} secure hint="Tối thiểu 8 ký tự, bao gồm chữ số và ký hiệu" />
              <Field label="Xác nhận mật khẩu" value={confirmPw} onChangeText={setConfirmPw} placeholder="••••••••" icon={Lock} secure />
            </View>
            <TouchableOpacity style={sty.termsRow} onPress={() => setAgreed(v => !v)} activeOpacity={0.8}>
              <View style={[sty.checkbox, agreed && sty.checkboxOn]}>{agreed && <Text style={sty.tick}>✓</Text>}</View>
              <Text style={sty.termsText}>Tôi đồng ý với <Text style={sty.termsLink}>Điều khoản dịch vụ</Text> và <Text style={sty.termsLink}>Chính sách bảo mật</Text></Text>
            </TouchableOpacity>
            <PrimaryBtn title="Tạo tài khoản" onPress={submit} />
            <OrDivider />
            <View style={{ gap: 8 }}>
              {ROLES.map(r => <RoleCard key={r.id} role={r} selected={selectedRole === r.id} onSelect={() => setSelectedRole(r.id)} />)}
            </View>
            <View style={{ marginTop: 8 }}>
              <OutlineBtn title={`Tiếp tục với tư cách ${ROLES.find(r => r.id === selectedRole)?.label}`} onPress={submit} />
            </View>
          </View>
          <View style={sty.footer}>
            <Text style={sty.footerText}>Đã có tài khoản? <Text style={sty.footerLink} onPress={() => router.push('/(auth)/login')}>Đăng nhập</Text></Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function VerifyOtpScreen({ initialEmail }: { initialEmail?: string }) {
  const pendingOtpEmail = useAuthStore(s => s.pendingOtpEmail);
  const verifyOtp = useAuthStore(s => s.verifyOtp);
  const resendOtp = useAuthStore(s => s.resendOtp);
  const show = useToastStore(s => s.show);
  const [email, setEmail] = useState(initialEmail || pendingOtpEmail || '');
  const [otp, setOtp] = useState('');

  const submit = async () => {
    if (!email || !otp) { show('Nhập email và mã OTP.', 'error'); return; }
    try { await verifyOtp(email.trim(), otp.trim()); show('Xác thực thành công.', 'success'); router.replace('/(auth)/login'); }
    catch (error) { show(getErrorMessage(error), 'error'); }
  };
  const resend = async () => {
    if (!email) { show('Nhập email để gửi lại OTP.', 'error'); return; }
    try { await resendOtp(email.trim()); show('Đã gửi lại OTP.', 'success'); }
    catch (error) { show(getErrorMessage(error), 'error'); }
  };

  return (
    <View style={sty.root}>
      <StatusBar barStyle="dark-content" />
      <AuthHeader />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sty.scroll} keyboardShouldPersistTaps="handled">
          <HeroStrip quote='"Xác thực để bảo vệ tài khoản của bạn."' />
          <View style={sty.card}>
            <Text style={sty.cardTitle}>Xác thực OTP</Text>
            <Text style={sty.cardSub}>Kiểm tra email và nhập mã xác thực 6 số.</Text>
            <View style={{ gap: 14, marginTop: 18 }}>
              <Field label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com" icon={Mail} keyboardType="email-address" />
              <Field label="Mã OTP" value={otp} onChangeText={setOtp} placeholder="123456" keyboardType="number-pad" />
            </View>
            <View style={{ height: 18 }} />
            <PrimaryBtn title="Xác thực" onPress={submit} />
            <TouchableOpacity style={sty.resendBtn} onPress={resend} activeOpacity={0.7}>
              <Text style={sty.resendText}>Gửi lại OTP</Text>
            </TouchableOpacity>
          </View>
          <View style={sty.footer}>
            <Text style={sty.footerText}>Tài khoản chưa xác thực sẽ được chuyển về màn hình này sau khi đăng nhập.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const sty = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 6, backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.line },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerLogo: { fontSize: 18, fontWeight: '900', color: C.text, letterSpacing: 2 },
  scroll: { paddingBottom: 40 },
  heroWrap: { height: 154, marginHorizontal: 14, marginTop: 14, borderRadius: 20, overflow: 'hidden', backgroundColor: '#DBC1B9' },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(35,26,17,0.45)' },
  heroBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,248,245,0.93)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
  heroBadgeText: { fontSize: 9.5, fontWeight: '700', color: C.primary, letterSpacing: 1 },
  heroSeason: { position: 'absolute', top: 14, right: 12, fontSize: 9, fontWeight: '600', color: 'rgba(255,248,245,0.85)', letterSpacing: 2 },
  heroQuote: { position: 'absolute', bottom: 14, left: 14, right: 14, fontSize: 14, fontStyle: 'italic', color: '#FFF8F5', lineHeight: 20 },
  card: { backgroundColor: C.card, marginHorizontal: 14, marginTop: 16, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#EDE1D2', shadowColor: '#3A2417', shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardTitle: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5, lineHeight: 31 },
  cardSub: { fontSize: 12.5, color: C.muted, marginTop: 4, lineHeight: 18 },
  label: { fontSize: 12.5, fontWeight: '700', color: C.text, letterSpacing: 0.1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: '#FFFCFA', paddingHorizontal: 12, gap: 9 },
  inputFocused: { borderColor: C.borderFocus, backgroundColor: C.card },
  input: { flex: 1, fontSize: 14.5, color: C.text, height: '100%' },
  hint: { fontSize: 11, color: C.placeholder, marginTop: 2 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 16 },
  forgotText: { fontSize: 12.5, color: C.primary, fontWeight: '700' },
  primaryBtn: { height: 52, backgroundColor: C.primary, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: C.primary, shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  primaryBtnText: { fontSize: 15, fontWeight: '800', color: C.onPrimary, letterSpacing: 0.3 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.line },
  dividerText: { fontSize: 10.5, fontWeight: '700', color: C.muted, letterSpacing: 1.2 },
  roleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 1.5, borderColor: C.border, backgroundColor: '#FFFCFA' },
  roleCardSelected: { borderColor: C.primary, backgroundColor: '#FFF1E8' },
  roleIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  roleLabel: { fontSize: 13.5, fontWeight: '700', color: C.text },
  roleSub: { fontSize: 11, color: C.muted, marginTop: 1.5 },
  outlineBtn: { height: 50, borderRadius: 16, borderWidth: 2, borderColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  outlineBtnText: { fontSize: 13, fontWeight: '800', color: C.primary, letterSpacing: 0.2 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14, marginBottom: 6 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  checkboxOn: { backgroundColor: C.primary, borderColor: C.primary },
  tick: { fontSize: 12, color: '#fff', fontWeight: '800', lineHeight: 14 },
  termsText: { fontSize: 12, color: C.muted, flex: 1, lineHeight: 17 },
  termsLink: { color: C.primary, fontWeight: '700', textDecorationLine: 'underline' },
  resendBtn: { alignItems: 'center', paddingVertical: 10, marginTop: 4 },
  resendText: { fontSize: 13, color: C.muted, fontWeight: '600', textDecorationLine: 'underline' },
  footer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, alignItems: 'center' },
  footerText: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19 },
  footerLink: { color: C.primary, fontWeight: '800' },
});
