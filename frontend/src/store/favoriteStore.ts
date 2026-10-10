import axios from 'axios';
import { create } from 'zustand';
import { useToastStore } from './toastStore';

interface FavoriteState {
  userId: string | null;
  isStudent: boolean;
  favorites: string[];
  setUserId: (userId: string | null, isStudent: boolean) => void;
  replaceFavorites: (ids: string[]) => void;
  toggleFavorite: (id: string) => boolean;
  isFavorite: (id: string) => boolean;
}

const localFavoritesKey = (userId: string) => `sc_favorites_${userId}`;
let synchronizationErrorToastShown = false;

function readLocalFavorites(key: string): string[] {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

async function loadServerFavorites(userId: string): Promise<string[]> {
  const state = useFavoriteStore.getState();
  if (!state.isStudent || state.userId !== userId) return [];
  const response = await axios.get('/student/favorites');
  const ids = (response.data.data || [])
    .map((item: { id?: unknown }) => item.id)
    .filter((id: unknown): id is string => typeof id === 'string');
  const current = useFavoriteStore.getState();
  if (current.isStudent && current.userId === userId) {
    useFavoriteStore.setState({ favorites: ids });
  }
  return ids;
}

async function synchronizeFavorites(userId: string): Promise<void> {
  if (!useFavoriteStore.getState().isStudent || useFavoriteStore.getState().userId !== userId) return;
  const key = localFavoritesKey(userId);
  try {
    await loadServerFavorites(userId);
    if (!useFavoriteStore.getState().isStudent || useFavoriteStore.getState().userId !== userId) return;
    const localCopy = localStorage.getItem(key);
    if (localCopy !== null) {
      for (const id of readLocalFavorites(key)) {
        if (!useFavoriteStore.getState().isStudent || useFavoriteStore.getState().userId !== userId) return;
        await axios.put(`/student/favorites/${encodeURIComponent(id)}`);
      }
      localStorage.removeItem(key);
      await loadServerFavorites(userId);
    }
  } catch (error) {
    console.error('Could not synchronize student favorites with the server.', error);
    const current = useFavoriteStore.getState();
    if (current.isStudent && current.userId === userId && !synchronizationErrorToastShown) {
      synchronizationErrorToastShown = true;
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Favorites unavailable',
        message: 'Your saved favorites could not be synchronized. Please try again.',
      });
    }
  }
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  userId: null,
  isStudent: false,
  favorites: [],
  setUserId: (userId, isStudent) => {
    const scopedUserId = isStudent ? userId : null;
    if (get().userId === scopedUserId && get().isStudent === isStudent) return;
    set({ userId: scopedUserId, isStudent, favorites: [] });
    if (scopedUserId && isStudent) {
      queueMicrotask(() => {
        if (get().isStudent && get().userId === scopedUserId) void synchronizeFavorites(scopedUserId);
      });
    }
  },
  replaceFavorites: (ids) => {
    if (get().isStudent) set({ favorites: ids });
  },
  toggleFavorite: (id) => {
    const userId = get().userId;
    if (!userId || !get().isStudent) return false;

    const before = get().favorites;
    const exists = before.includes(id);
    const updated = exists ? before.filter((item) => item !== id) : [...before, id];
    set({ favorites: updated });

    const request = exists
      ? axios.delete(`/student/favorites/${encodeURIComponent(id)}`)
      : axios.put(`/student/favorites/${encodeURIComponent(id)}`);
    void request.catch((error) => {
      if (get().isStudent && get().userId === userId) {
        const current = get().favorites;
        const stillOptimistic = exists ? !current.includes(id) : current.includes(id);
        if (stillOptimistic) set({ favorites: exists ? [...current, id] : current.filter((item) => item !== id) });
      }
      console.error('Could not update student favorite on the server.', error);
      if (get().isStudent && get().userId === userId) {
        useToastStore.getState().addToast({
          type: 'error',
          title: 'Favorite not saved',
          message: 'Your favorites could not be updated. Please try again.',
        });
      }
    });
    return !exists;
  },
  isFavorite: (id) => get().isStudent && get().favorites.includes(id),
}));

if (typeof window !== 'undefined') {
  localStorage.removeItem('sc_favorites');
}
