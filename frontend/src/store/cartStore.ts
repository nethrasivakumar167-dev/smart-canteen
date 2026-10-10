import { create } from 'zustand';
import { MenuItem, CartItem, CartItemCustomization } from '../types';

type CartProduct = Pick<
  MenuItem,
  'id' | 'name' | 'price' | 'imageUrl' | 'isVegetarian' | 'preparationTime'
>;

interface CartState {
  userId: string | null;
  items: CartItem[];
  specialInstructions: string;
  pickupOption: 'ASAP' | 'SCHEDULED';
  scheduledTime: string; // e.g. "12:45 PM"

  // Actions
  setUserId: (userId: string | null) => void;
  addItem: (item: CartProduct, quantity?: number, customizations?: CartItemCustomization[]) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setPickupOption: (option: 'ASAP' | 'SCHEDULED', time?: string) => void;
  setSpecialInstructions: (note: string) => void;

  // Computed / Selectors
  getItemQuantity: (menuItemId: string) => number;
  getTotalItemsCount: () => number;
  getSubtotal: () => number;
  getGrandTotal: () => number;
  getEstimatedPreparationTime: () => number;
  getLoyaltyPointsEarnable: () => number;
}

const legacyCartKey = 'sc_cart';

if (typeof window !== 'undefined') {
  localStorage.removeItem(legacyCartKey);
}

const getUserCart = (userId: string | null): CartItem[] => {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const saved = localStorage.getItem(`sc_cart_${userId}`);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistCart = (userId: string | null, items: CartItem[]) => {
  if (typeof window !== 'undefined' && userId) {
    localStorage.setItem(`sc_cart_${userId}`, JSON.stringify(items));
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  userId: null,
  items: [],
  specialInstructions: '',
  pickupOption: 'ASAP',
  scheduledTime: 'ASAP (~10-15 mins)',

  setUserId: (userId) => {
    if (get().userId === userId) return;
    set({
      userId,
      items: getUserCart(userId),
      specialInstructions: '',
      pickupOption: 'ASAP',
      scheduledTime: 'ASAP (~10-15 mins)',
    });
  },

  addItem: (menuItem, quantity = 1, customizations = []) => {
    const customKey = customizations.length > 0
      ? `${menuItem.id}-${customizations.map(c => `${c.groupName}:${c.selectedOption}`).sort().join('|')}`
      : menuItem.id;

    const unitPrice = menuItem.price;

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

      persistCart(state.userId, updatedItems);
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

      persistCart(state.userId, updatedItems);
      return { items: updatedItems };
    });
  },

  removeItem: (id) => {
    set((state) => {
      const updatedItems = state.items.filter((item) => item.id !== id);
      persistCart(state.userId, updatedItems);
      return { items: updatedItems };
    });
  },

  clearCart: () => {
    persistCart(get().userId, []);
    set({ items: [], specialInstructions: '' });
  },

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

  getGrandTotal: () => get().getSubtotal(),

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
