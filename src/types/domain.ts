export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN' | string;

export type SellerPermission =
  | 'VIEW_DASHBOARD'
  | 'MANAGE_PRODUCTS'
  | 'MANAGE_ORDERS'
  | 'MANAGE_AUCTIONS';

export type SellerStaffAccess = {
  id?: string;
  sellerId: string;
  status: 'ACTIVE' | 'PENDING' | 'REVOKED' | string;
  permissions: SellerPermission[];
};

export type User = {
  id: string;
  email: string;
  fullName?: string;
  name?: string;
  avatar?: string;
  phone?: string;
  role: UserRole;
  isEmailVerified?: boolean;
  emailVerified?: boolean;
  sellerStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  sellerStaffAccess?: SellerStaffAccess | null;
  sellerProfile?: SellerProfile | null;
};

export type SellerProfile = {
  id?: string;
  userId?: string;
  shopName?: string;
  avatar?: string;
  verified?: boolean;
  sellerScore?: number;
  pickupArea?: string;
};

export type ProductStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'SOLD'
  | 'INACTIVE'
  | string;

export type ProductCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';

export type Product = {
  id: string;
  title: string;
  description?: string;
  price: number;
  category?: string;
  condition?: ProductCondition | string;
  brand?: string;
  size?: string;
  color?: string;
  tags?: string[] | string;
  status?: ProductStatus;
  availability?: ProductStatus;
  images?: string[];
  productImages?: string[];
  imageUrls?: string[];
  sellerId?: string;
  seller?: SellerProfile & { id?: string; userId?: string };
  shop?: SellerProfile;
  createdAt?: string;
};

export type CartItem = {
  id?: string;
  productId: string;
  product?: Product;
  quantity?: number;
};

export type WishlistItem = {
  id?: string;
  productId: string;
  product?: Product;
};

export type Address = {
  receiverName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  note?: string;
};

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | string;

export type Order = {
  id: string;
  status: OrderStatus;
  paymentStatus?: string;
  total?: number;
  totalAmount?: number;
  product?: Product;
  products?: Product[];
  items?: { product?: Product; productId?: string; price?: number }[];
  seller?: SellerProfile;
  buyer?: User;
  createdAt?: string;
};

export type Auction = {
  id: string;
  productId?: string;
  product?: Product;
  startPrice: number;
  currentPrice?: number;
  minIncrement?: number;
  startTime?: string;
  endTime?: string;
  status?: string;
};

export type Subscription = {
  id?: string;
  plan?: string;
  status?: string;
  price?: number;
  expiresAt?: string;
};

export type ApiList<T> = T[] | { data?: T[]; items?: T[]; products?: T[]; orders?: T[]; results?: T[] };

export type PickedImage = {
  uri: string;
  name: string;
  type: string;
};
