import { create } from 'zustand';

export interface HeldItem {
  id: string;
  name: string;
  shop: string;
  price: number;
  img: string;
  size?: string;
  condition?: string;
  heldAt: number;
  expiresAt: number; // ms
}

export interface WaitlistEntry {
  productId: string;
  productName: string;
  shop: string;
  position: number;
}

const HOLD_DURATION_MS = 15 * 60 * 1000; // 15 phút
const MAX_HOLD_SLOTS = 3;
const MIN_REPUTATION_TO_HOLD = 70;

const INITIAL_HELD_ITEMS: HeldItem[] = [
  {
    id: 'hold-denim-patchwork-1',
    name: 'Áo khoác Denim Patchwork',
    shop: 'Tiệm Đồ Si Sài Gòn',
    price: 450000,
    img: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=400&h=400&fit=crop',
    size: 'M',
    condition: '90%',
    heldAt: Date.now() - 7 * 60 * 1000 - 15 * 1000,
    expiresAt: Date.now() + 7 * 60 * 1000 + 45 * 1000, // 07:45 còn lại
  },
];

interface HoldState {
  reputationScore: number;
  heldItems: HeldItem[];
  waitlist: WaitlistEntry[];
  otherHeldIds: string[]; // giả lập hàng của người khác đang giữ
  pinnedItemId: string | null;

  setPinnedItemId: (id: string | null) => void;
  holdItem: (
    product: Omit<HeldItem, 'heldAt' | 'expiresAt'>,
  ) => { success: boolean; message: string; reason?: string };

  releaseHold: (id: string) => void;
  timeoutHold: (id: string) => void;
  joinWaitlist: (productId: string, name: string, shop: string) => void;
  isHeldByMe: (id: string) => boolean;
  isHeldByOther: (id: string) => boolean;
  getRemainingSeconds: (id: string) => number;
}

export const useHoldStore = create<HoldState>((set, get) => ({
  reputationScore: 95,
  heldItems: INITIAL_HELD_ITEMS,
  waitlist: [],
  otherHeldIds: [],
  pinnedItemId: 'hold-denim-patchwork-1',

  setPinnedItemId: (id) => set({ pinnedItemId: id }),

  holdItem: (product) => {
    const { reputationScore, heldItems, otherHeldIds } = get();

    if (reputationScore < MIN_REPUTATION_TO_HOLD) {
      return {
        success: false,
        reason: 'LOW_REPUTATION',
        message: `Điểm uy tín của bạn (${reputationScore}) thấp hơn mức tối thiểu ${MIN_REPUTATION_TO_HOLD}. Không thể giữ hàng.`,
      };
    }

    if (heldItems.length >= MAX_HOLD_SLOTS) {
      return {
        success: false,
        reason: 'LIMIT_EXCEEDED',
        message: `Bạn đang giữ tối đa ${MAX_HOLD_SLOTS} món. Hoàn tất hoặc hủy một món để tiếp tục.`,
      };
    }

    if (otherHeldIds.includes(product.id)) {
      return {
        success: false,
        reason: 'HELD_BY_OTHER',
        message: 'Món đồ này đang được người khác giữ. Bạn có muốn xếp hàng đợi?',
      };
    }

    if (heldItems.some((i) => i.id === product.id)) {
      return { success: false, reason: 'ALREADY_HELD', message: 'Bạn đã đang giữ món này.' };
    }

    const now = Date.now();
    const newItem: HeldItem = {
      ...product,
      heldAt: now,
      expiresAt: now + HOLD_DURATION_MS,
    };
    set((state) => ({ heldItems: [...state.heldItems, newItem] }));
    return {
      success: true,
      message: `Đã giữ "${product.name}" thành công! Bạn có 15 phút để chốt đơn.`,
    };
  },

  releaseHold: (id) => {
    set((state) => ({ heldItems: state.heldItems.filter((i) => i.id !== id) }));
  },

  timeoutHold: (id) => {
    set((state) => ({
      heldItems: state.heldItems.filter((i) => i.id !== id),
      reputationScore: Math.max(0, state.reputationScore - 5),
    }));
  },

  joinWaitlist: (productId, productName, shop) => {
    set((state) => {
      const existing = state.waitlist.find((w) => w.productId === productId);
      if (existing) return state;
      return {
        waitlist: [
          ...state.waitlist,
          { productId, productName: productName, shop, position: state.waitlist.length + 1 },
        ],
      };
    });
  },

  isHeldByMe: (id) => get().heldItems.some((i) => i.id === id),
  isHeldByOther: (id) => get().otherHeldIds.includes(id),

  getRemainingSeconds: (id) => {
    const item = get().heldItems.find((i) => i.id === id);
    if (!item) return 0;
    return Math.max(0, Math.floor((item.expiresAt - Date.now()) / 1000));
  },
}));
