import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { FoodCard } from '../components/menu/FoodCard';
import { useFavoriteStore } from '../store/favoriteStore';
import { MenuItem } from '../types';

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
          <Heart className="h-7 w-7 fill-rust text-rust" />
          <div>
            <h1 className="text-2xl font-bold text-navy sm:text-3xl">Favourites</h1>
            <p className="mt-1 text-sm text-espresso">Your saved dishes, ready to reorder.</p>
          </div>
        </header>

        {loading ? (
          <p className="py-12 text-center text-sm font-semibold text-espresso">Loading favourites...</p>
        ) : error ? (
          <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : favoriteItems.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteItems.map((item) => <FoodCard key={item.id} item={item} />)}
          </div>
        ) : (
          <section className="rounded-3xl border border-line bg-sand p-10 text-center shadow-sm">
            <Heart className="mx-auto h-10 w-10 text-navy/50" />
            <h2 className="mt-3 text-lg font-bold text-navy">No favourites saved yet</h2>
            <p className="mt-1 text-sm text-espresso">Explore the menu and tap the heart on dishes you like.</p>
            <Link to="/menu" className="mt-5 inline-flex rounded-xl bg-navy px-5 py-3 text-sm font-bold text-cream hover:bg-slateblue-light">
              Browse menu
            </Link>
          </section>
        )}
      </div>
    </main>
  );
};
