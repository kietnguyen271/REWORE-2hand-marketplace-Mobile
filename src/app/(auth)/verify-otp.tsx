import { useLocalSearchParams } from 'expo-router';
import { VerifyOtpScreen } from '@/screens/auth/AuthScreens';

export default function VerifyOtpRoute() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  return <VerifyOtpScreen initialEmail={email} />;
}
