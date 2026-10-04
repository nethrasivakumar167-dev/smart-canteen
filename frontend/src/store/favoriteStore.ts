import { create } from 'zustand';

interface FavoriteState {
  favorites: string[]; // List of MenuItem IDs
  toggleFavorite: (id: string) => boolean; // Returns true if added, false if removed
  isFavorite: (id: string) => boolean;
}

const getInitialFavorites = (): string[] => {
  if (typeof window === 'undefined') return ['item-1', 'item-10'];
  try {
    const saved = localStorage.getItem('sc_favorites');
    return saved ? JSON.parse(saved) : ['item-1', 'item-10'];
  } catch {
    return ['item-1', 'item-10'];
  }
};

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: getInitialFavorites(),
  toggleFavorite: (id: string) => {
    const current = get().favorites;
    const exists = current.includes(id);
    const updated = exists ? current.filter((item) => item !== id) : [...current, id];
    localStorage.setItem('sc_favorites', JSON.stringify(updated));
    set({ favorites: updated });
    return !exists;
  },
  isFavorite: (id: string) => get().favorites.includes(id),
}));
