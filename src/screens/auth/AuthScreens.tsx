import { useState } from 'react';
import { Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { TextField } from '@/components/TextField';
import { colors } from '@/components/theme';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { getErrorMessage } from '@/utils/format';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuthStore();
  const show = useToastStore((state) => state.show);

  const submit = async () => {
    if (!email || !password) {
      show('Nhap email va mat khau.', 'error');
      return;
    }

    try {
      const result = await login(email.trim(), password);
      if (result === 'otp') {
        router.replace({ pathname: '/(auth)/verify-otp', params: { email } });
        return;
      }
      router.replace('/(tabs)');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  return (
    <AppScreen title="REWORE" subtitle="Dang nhap de mua, ban va quan ly don 2hand.">
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="Mat khau" value={password} onChangeText={setPassword} secureTextEntry />
      <AppButton title="Dang nhap" onPress={submit} loading={loading} />
      <View style={{ alignItems: 'center' }}>
        <Link href="/(auth)/register" style={{ color: colors.terracotta, fontWeight: '800' }}>
          Tao tai khoan moi
        </Link>
      </View>
    </AppScreen>
  );
}

export function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuthStore();
  const show = useToastStore((state) => state.show);

  const submit = async () => {
    if (!fullName || !email || !password) {
      show('Nhap day du ho ten, email va mat khau.', 'error');
      return;
    }

    try {
      await register({ fullName, email: email.trim(), phone, password });
      show('Dang ky thanh cong. Hay xac thuc OTP.', 'success');
      router.replace({ pathname: '/(auth)/verify-otp', params: { email } });
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  return (
    <AppScreen title="Tao tai khoan" subtitle="Email can duoc xac thuc truoc khi ban dang ky shop.">
      <TextField label="Ho ten" value={fullName} onChangeText={setFullName} />
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="So dien thoai" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextField label="Mat khau" value={password} onChangeText={setPassword} secureTextEntry />
      <AppButton title="Dang ky" onPress={submit} />
      <Link href="/(auth)/login" style={{ color: colors.terracotta, fontWeight: '800', textAlign: 'center' }}>
        Da co tai khoan
      </Link>
    </AppScreen>
  );
}

export function VerifyOtpScreen({ initialEmail }: { initialEmail?: string }) {
  const pendingOtpEmail = useAuthStore((state) => state.pendingOtpEmail);
  const verifyOtp = useAuthStore((state) => state.verifyOtp);
  const resendOtp = useAuthStore((state) => state.resendOtp);
  const show = useToastStore((state) => state.show);
  const [email, setEmail] = useState(initialEmail || pendingOtpEmail || '');
  const [otp, setOtp] = useState('');

  const submit = async () => {
    if (!email || !otp) {
      show('Nhap email va ma OTP.', 'error');
      return;
    }

    try {
      await verifyOtp(email.trim(), otp.trim());
      show('Xac thuc thanh cong. Hay dang nhap lai.', 'success');
      router.replace('/(auth)/login');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  const resend = async () => {
    if (!email) {
      show('Nhap email de gui lai OTP.', 'error');
      return;
    }

    try {
      await resendOtp(email.trim());
      show('Da gui lai OTP.', 'success');
    } catch (error) {
      show(getErrorMessage(error), 'error');
    }
  };

  return (
    <AppScreen title="Xac thuc OTP" subtitle="Kiem tra email va nhap ma xac thuc.">
      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="Ma OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" />
      <AppButton title="Xac thuc" onPress={submit} />
      <AppButton title="Gui lai OTP" variant="secondary" onPress={resend} />
      <Text style={{ color: colors.muted, textAlign: 'center' }}>Tai khoan chua verify se duoc dua ve man hinh nay sau khi login.</Text>
    </AppScreen>
  );
}
