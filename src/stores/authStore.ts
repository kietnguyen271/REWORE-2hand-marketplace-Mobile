import { create } from 'zustand';
import { router } from 'expo-router';
import { authApi } from '@/api/endpoints';
import { deleteStoredToken, getStoredToken, setStoredToken } from '@/auth/tokenStorage';
import { setAuthToken } from '@/api/client';
import type { SellerPermission, User } from '@/types/domain';

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  bootstrapped: boolean;
  pendingOtpEmail: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<'ok' | 'otp'>;
  register: (payload: Record<string, unknown>) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  setPendingOtpEmail: (email: string | null) => void;
};

function unwrapUser(payload: unknown): User {
  if (payload && typeof payload === 'object' && 'user' in payload) {
    return (payload as { user: User }).user;
  }

  return payload as User;
}

function tokenFrom(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  return typeof record.token === 'string'
    ? record.token
    : typeof record.accessToken === 'string'
      ? record.accessToken
      : null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  bootstrapped: false,
  pendingOtpEmail: null,
  bootstrap: async () => {
    set({ loading: true });
    try {
      const token = await getStoredToken();
      setAuthToken(token);
      if (!token) {
        set({ token: null, user: null, bootstrapped: true });
        return;
      }

      const user = unwrapUser(await authApi.me());
      set({ token, user, bootstrapped: true });
    } catch {
      await deleteStoredToken();
      setAuthToken(null);
      set({ token: null, user: null, bootstrapped: true });
    } finally {
      set({ loading: false });
    }
  },
  login: async (email, password) => {
    set({ loading: true });
    try {
      const payload = await authApi.login({ email, password });
      if ('requiresOtp' in payload && payload.requiresOtp) {
        set({ pendingOtpEmail: payload.email || email });
        return 'otp';
      }

      const token = tokenFrom(payload);
      if (token) {
        await setStoredToken(token);
        setAuthToken(token);
      }

      let user = 'user' in payload ? (payload.user ?? null) : null;
      if (!user) {
        user = unwrapUser(await authApi.me());
      }

      set({ token, user, pendingOtpEmail: null });
      return 'ok';
    } finally {
      set({ loading: false });
    }
  },
  register: async (payload) => {
    await authApi.register(payload);
    const email = typeof payload.email === 'string' ? payload.email : null;
    set({ pendingOtpEmail: email });
  },
  verifyOtp: async (email, otp) => {
    await authApi.verifyOtp({ email, otp });
    set({ pendingOtpEmail: null });
  },
  resendOtp: async (email) => {
    await authApi.resendOtp({ email });
  },
  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Local logout should still succeed when the token is expired.
    }

    await deleteStoredToken();
    setAuthToken(null);
    set({ user: null, token: null, pendingOtpEmail: null });
    router.replace('/(auth)/login');
  },
  setPendingOtpEmail: (email) => set({ pendingOtpEmail: email }),
}));

export function hasSellerAccess(user: User | null) {
  return Boolean(
    (user?.role === 'SELLER' && user.sellerStatus === 'APPROVED') ||
      (user?.sellerStaffAccess?.status === 'ACTIVE'),
  );
}

export function sellerIdFor(user: User | null) {
  return user?.sellerStaffAccess?.status === 'ACTIVE'
    ? user.sellerStaffAccess.sellerId
    : user?.sellerProfile?.id || user?.sellerProfile?.userId || user?.id || '';
}

export function canSeller(user: User | null, permission: SellerPermission) {
  if (user?.role === 'SELLER' && user.sellerStatus === 'APPROVED') {
    return true;
  }

  return Boolean(user?.sellerStaffAccess?.status === 'ACTIVE' && user.sellerStaffAccess.permissions.includes(permission));
}

export function isSellerOwner(user: User | null) {
  return user?.role === 'SELLER' && user.sellerStatus === 'APPROVED' && !user.sellerStaffAccess;
}
