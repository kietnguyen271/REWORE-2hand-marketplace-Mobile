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
    const axiosError = error as { response?: { data?: unknown }; code?: string; message?: string };

    // Network error (backend not reachable)
    if (!axiosError.response && axiosError.code === 'ERR_NETWORK') {
      return 'Không thể kết nối server. Vui lòng kiểm tra mạng.';
    }
    if (!axiosError.response && axiosError.code === 'ECONNABORTED') {
      return 'Server phản hồi quá chậm. Vui lòng thử lại.';
    }

    const data = axiosError.response?.data;
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;

      // Standard message field
      if (typeof record.message === 'string') return record.message;
      if (typeof record.error === 'string') return record.error;

      // Zod validation errors array
      if (record.errors && typeof record.errors === 'object') {
        const errs = record.errors as Record<string, string[]>;
        const first = Object.values(errs)[0];
        if (Array.isArray(first) && first.length > 0) return first[0];
      }
    }
  }

  return 'Có lỗi xảy ra. Vui lòng thử lại.';
}

export function compactParams(params: Record<string, string | number | undefined | null>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

export function hasVerifiedEmail(user?: { isEmailVerified?: boolean; emailVerified?: boolean } | null) {
  return Boolean(user?.isEmailVerified || user?.emailVerified);
}
