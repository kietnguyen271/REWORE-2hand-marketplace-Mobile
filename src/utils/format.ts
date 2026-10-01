export function formatVnd(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Lien he';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function normalizeList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidates = [record.data, record.items, record.products, record.orders, record.results, record.auctions, record.staff];
    const match = candidates.find(Array.isArray);
    if (match) {
      return match as T[];
    }
  }

  return [];
}

export function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data;
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      const value = record.message ?? record.error;
      if (typeof value === 'string') {
        return value;
      }
    }
  }

  return 'Co loi xay ra. Vui long thu lai.';
}

export function compactParams(params: Record<string, string | number | undefined | null>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

export function hasVerifiedEmail(user?: { isEmailVerified?: boolean; emailVerified?: boolean } | null) {
  return Boolean(user?.isEmailVerified || user?.emailVerified);
}
