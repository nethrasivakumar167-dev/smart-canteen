export type Role = 'STUDENT' | 'FACULTY' | 'VISITOR' | 'STAFF' | 'ADMIN';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type PaymentMethod = 'UPI' | 'CARD' | 'CASH' | 'DEMO';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type StockStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISABLED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  institutionId?: string;
  isActive: boolean;
  points?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  itemCount?: number;
}

export interface CustomizationOption {
  name: string;
  price: number;
}

export interface CustomizationGroup {
  id: string;
  title: string;
  type: 'single' | 'multiple';
  required: boolean;
  options: CustomizationOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName?: string;
  imageUrl: string;
  isVegetarian: boolean;
  ingredients: string[];
  allergens: string[];
  preparationTime: number; // in minutes
  calories?: number;
  isAvailable: boolean;
  stockStatus: StockStatus;
  rating: number;
  reviewCount: number;
  isPopular?: boolean;
  isChefSpecial?: boolean;
  customizationGroups?: CustomizationGroup[];
}

export interface CartItemCustomization {
  groupName: string;
  selectedOption: string;
  additionalPrice: number;
}

export interface CartItem {
  id: string; // unique item + customization key
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  isVegetarian: boolean;
  preparationTime: number;
  customizations?: CartItemCustomization[];
  itemTotal: number;
}

export interface Review {
  id: string;
  userName: string;
  userRole: Role;
  rating: number;
  comment: string;
  date: string;
  avatarUrl?: string;
}

export interface Coupon {
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
}
