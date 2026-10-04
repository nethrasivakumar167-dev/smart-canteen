import { create } from 'zustand';
import { MenuItem, CartItem, CartItemCustomization, Coupon } from '../types';

interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  couponError: string | null;
  specialInstructions: string;
  pickupOption: 'ASAP' | 'SCHEDULED';
  scheduledTime: string; // e.g. "12:45 PM"

  // Actions
  addItem: (item: MenuItem, quantity?: number, customizations?: CartItemCustomization[]) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  applyCoupon: (coupon: Coupon) => boolean;
  removeCoupon: () => void;
  setPickupOption: (option: 'ASAP' | 'SCHEDULED', time?: string) => void;
  setSpecialInstructions: (note: string) => void;

  // Computed / Selectors
  getItemQuantity: (menuItemId: string) => number;
  getTotalItemsCount: () => number;
  getSubtotal: () => number;
  getTax: () => number;
  getDiscount: () => number;
  getGrandTotal: () => number;
  getEstimatedPreparationTime: () => number;
  getLoyaltyPointsEarnable: () => number;
}

const getInitialCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('sc_cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const persistCart = (items: CartItem[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sc_cart', JSON.stringify(items));
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  items: getInitialCart(),
  coupon: null,
  couponError: null,
  specialInstructions: '',
  pickupOption: 'ASAP',
  scheduledTime: 'ASAP (~10-15 mins)',

  addItem: (menuItem, quantity = 1, customizations = []) => {
    const customKey = customizations.length > 0
      ? `${menuItem.id}-${customizations.map(c => `${c.groupName}:${c.selectedOption}`).sort().join('|')}`
      : menuItem.id;

    const extraPrice = customizations.reduce((acc, c) => acc + c.additionalPrice, 0);
    const unitPrice = menuItem.price + extraPrice;

    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.id === customKey);
      let updatedItems: CartItem[];

      if (existingIndex > -1) {
        updatedItems = [...state.items];
        const newQty = updatedItems[existingIndex].quantity + quantity;
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: newQty,
          itemTotal: unitPrice * newQty,
        };
      } else {
        const newItem: CartItem = {
          id: customKey,
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: unitPrice,
          quantity,
          imageUrl: menuItem.imageUrl,
          isVegetarian: menuItem.isVegetarian,
          preparationTime: menuItem.preparationTime,
          customizations: customizations.length > 0 ? customizations : undefined,
          itemTotal: unitPrice * quantity,
        };
        updatedItems = [...state.items, newItem];
      }

      persistCart(updatedItems);
      return { items: updatedItems };
    });
  },

  updateQuantity: (id, delta) => {
    set((state) => {
      const updatedItems = state.items
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              itemTotal: item.price * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];

      persistCart(updatedItems);
      return { items: updatedItems };
    });
  },

  removeItem: (id) => {
    set((state) => {
      const updatedItems = state.items.filter((item) => item.id !== id);
      persistCart(updatedItems);
      return { items: updatedItems };
    });
  },

  clearCart: () => {
    persistCart([]);
    set({ items: [], coupon: null, couponError: null, specialInstructions: '' });
  },

  applyCoupon: (coupon) => {
    const subtotal = get().getSubtotal();
    if (subtotal < coupon.minOrderValue) {
      set({ couponError: `Minimum order value for ${coupon.code} is ₹${coupon.minOrderValue}` });
      return false;
    }
    set({ coupon, couponError: null });
    return true;
  },

  removeCoupon: () => set({ coupon: null, couponError: null }),

  setPickupOption: (option, time) =>
    set({
      pickupOption: option,
      scheduledTime: time || (option === 'ASAP' ? 'ASAP (~10-15 mins)' : '12:45 PM'),
    }),

  setSpecialInstructions: (note) => set({ specialInstructions: note }),

  getItemQuantity: (menuItemId) => {
    const items = get().items;
    return items
      .filter((i) => i.menuItemId === menuItemId)
      .reduce((acc, i) => acc + i.quantity, 0);
  },

  getTotalItemsCount: () => {
    return get().items.reduce((acc, item) => acc + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((acc, item) => acc + item.itemTotal, 0);
  },

  getTax: () => {
    const subtotal = get().getSubtotal();
    return Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
  },

  getDiscount: () => {
    const { coupon } = get();
    if (!coupon) return 0;
    const subtotal = get().getSubtotal();
    if (subtotal < coupon.minOrderValue) return 0;

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }
    return Math.min(discount, subtotal);
  },

  getGrandTotal: () => {
    const subtotal = get().getSubtotal();
    if (subtotal === 0) return 0;
    const tax = get().getTax();
    const discount = get().getDiscount();
    return Math.max(0, Math.round((subtotal + tax - discount) * 100) / 100);
  },

  getEstimatedPreparationTime: () => {
    const items = get().items;
    if (items.length === 0) return 0;
    const maxItemPrep = Math.max(...items.map((i) => i.preparationTime));
    const totalCount = items.reduce((acc, i) => acc + i.quantity, 0);
    // Dynamic calculation: max item prep time + queue / quantity modifier
    const quantityModifier = Math.min(6, Math.floor(totalCount / 2));
    return maxItemPrep + quantityModifier;
  },

  getLoyaltyPointsEarnable: () => {
    const total = get().getGrandTotal();
    return Math.floor(total / 10); // ₹100 = 10 points (1 point per ₹10)
  },
}));
