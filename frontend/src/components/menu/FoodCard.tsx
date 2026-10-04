import React from 'react';
import { Link } from 'react-router-dom';
import { MenuItem } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { useFavoriteStore } from '../../store/favoriteStore';
import { useToastStore } from '../../store/toastStore';
import { Clock, Star, Heart, Plus, Minus, Flame, Sparkles } from 'lucide-react';

interface FoodCardProps {
  item: MenuItem;
}

export const FoodCard: React.FC<FoodCardProps> = ({ item }) => {
  const { addItem, updateQuantity, items } = useCartStore();
  const { isFavorite, toggleFavorite } = useFavoriteStore();
  const { addToast } = useToastStore();

  const favorited = isFavorite(item.id);

  // Find if standard uncustomized version is in cart
  const cartItem = items.find((i) => i.menuItemId === item.id && !i.customizations);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(item, 1);
    addToast({
      type: 'success',
      title: 'Added to Preorder',
      message: `${item.name} added to your cart.`,
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) {
      updateQuantity(cartItem.id, 1);
    } else {
      addItem(item, 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) {
      updateQuantity(cartItem.id, -1);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleFavorite(item.id);
    addToast({
      type: added ? 'success' : 'info',
      title: added ? 'Added to Favorites' : 'Removed from Favorites',
      message: `${item.name} ${added ? 'saved to your favorites.' : 'removed from favorites.'}`,
    });
  };

  return (
    <div className="group relative bg-white dark:bg-dark-surface rounded-2xl border border-gray-200/80 dark:border-dark-border shadow-sm hover:shadow-xl hover:border-brand-500/40 transition-all duration-300 flex flex-col overflow-hidden">
      
      {/* Top Image Container */}
      <Link to={`/menu/${item.id}`} className="relative h-48 sm:h-52 w-full overflow-hidden bg-gray-100 dark:bg-dark-card block">
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

        {/* Veg / Non-Veg badge + Category */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <div className="bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md p-1 rounded-md shadow-sm">
            {item.isVegetarian ? (
              <span className="veg-badge" title="Vegetarian">
                <span className="veg-badge-dot" />
              </span>
            ) : (
              <span className="non-veg-badge" title="Non-Vegetarian">
                <span className="non-veg-badge-dot" />
              </span>
            )}
          </div>

          {item.isPopular && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/90 text-white text-[11px] font-bold backdrop-blur-md shadow-sm">
              <Flame className="w-3 h-3 fill-white" />
              Trending
            </span>
          )}

          {item.isChefSpecial && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-white text-[11px] font-bold backdrop-blur-md shadow-sm">
              <Sparkles className="w-3 h-3" />
              Special
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleToggleFavorite}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition z-10 ${
            favorited
              ? 'bg-red-500 text-white shadow-md scale-110'
              : 'bg-black/30 hover:bg-black/50 text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-white' : ''}`} />
        </button>

        {/* Bottom Image Overlay: Prep Time & Rating */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs z-10 pointer-events-none">
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md">
            <Clock className="w-3 h-3 text-amber-400" />
            <span className="font-semibold">{item.preparationTime} mins</span>
          </div>

          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md font-bold">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{item.rating}</span>
            <span className="text-gray-300 font-normal text-[10px]">({item.reviewCount})</span>
          </div>
        </div>
      </Link>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            <span className="font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              {item.categoryName || 'Canteen Special'}
            </span>
            {item.calories && (
              <span>{item.calories} kcal</span>
            )}
          </div>

          <Link to={`/menu/${item.id}`} className="block group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-1">
              {item.name}
            </h3>
          </Link>

          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-border flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Price</span>
            <span className="text-lg font-extrabold text-gray-900 dark:text-white font-mono">
              ₹{item.price}
            </span>
          </div>

          {/* Stepper or Add to Cart Button */}
          {quantityInCart > 0 ? (
            <div className="flex items-center bg-brand-50 dark:bg-brand-950/40 border border-brand-500/30 rounded-xl p-1 shadow-sm">
              <button
                onClick={handleDecrement}
                aria-label="Decrease quantity"
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm hover:bg-brand-500 hover:text-white transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-xs font-extrabold text-brand-600 dark:text-brand-400 font-mono">
                {quantityInCart}
              </span>
              <button
                onClick={handleIncrement}
                aria-label="Increase quantity"
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm hover:bg-brand-600 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-xs shadow-sm hover:shadow-glow transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
