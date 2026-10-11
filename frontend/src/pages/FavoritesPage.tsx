import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FoodCard } from '../components/menu/FoodCard';
import { useFavoriteStore } from '../store/favoriteStore';
import { MenuItem } from '../types';
import { PixelIcon } from '../components/pixel/PixelIcon';

export const FavoritesPage: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const favorites = useFavoriteStore((state) => state.favorites);
  const replaceFavorites = useFavoriteStore((state) => state.replaceFavorites);

  useEffect(() => {
    let active = true;
    axios.get('/student/favorites')
      .then((response) => {
        if (!active) return;
        const favoriteItems = response.data?.success && Array.isArray(response.data.data)
          ? response.data.data as MenuItem[]
          : [];
        setItems(favoriteItems);
        replaceFavorites(favoriteItems.map((item) => item.id));
      })
      .catch((requestError: any) => {
        if (active) setError(requestError.response?.data?.error || 'Could not load your favourites.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [replaceFavorites]);

  const favoriteItems = items.filter((item) => favorites.includes(item.id));

  return (
    <main className="min-h-[60vh] bg-beige">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="flex items-center gap-3 border-b border-line pb-4">
          <PixelIcon name="heart" size={28} />
          <div>
            <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">Favourites</h1>
            <p className="mt-1 text-sm text-espresso">Your saved dishes, ready to reorder.</p>
          </div>
        </header>

        {loading ? (
          <p className="py-12 text-center text-sm font-semibold text-espresso">Loading favourites...</p>
        ) : error ? (
          <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : favoriteItems.length ? (
          <div className="px-stagger-grid grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteItems.map((item) => <FoodCard key={item.id} item={item} />)}
          </div>
        ) : (
          <section className="px-card rounded-2xl p-10 text-center">
            <div className="mx-auto w-fit text-navy/50"><PixelIcon name="heart" size={40} /></div>
            <h2 className="mt-3 text-lg font-bold text-navy">No favourites saved yet</h2>
            <p className="mt-1 text-sm text-espresso">Explore the menu and tap the heart on dishes you like.</p>
            <Link to="/menu" className="px-btn px-btn--sky mt-5">
              Browse menu
            </Link>
          </section>
        )}
      </div>
    </main>
  );
};
