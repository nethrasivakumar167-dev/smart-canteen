import React from 'react';
import { Link } from 'react-router-dom';
import { MenuItem } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { useFavoriteStore } from '../../store/favoriteStore';
import { useToastStore } from '../../store/toastStore';
import { Heart, Plus, Minus } from 'lucide-react';

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
    <div className="food-card group relative transition-all duration-300 hover:-translate-y-1 flex flex-col">
      
      {/* Top Image Container */}
      <Link to={`/menu/${item.id}`} className="food-card__image relative h-44 sm:h-52 w-full overflow-hidden bg-sand block">
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-navy/25 via-transparent to-transparent pointer-events-none" />

        {/* Veg / Non-Veg badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <div className="bg-cream/95 dark:bg-slate/95 backdrop-blur-md p-1 rounded-md shadow-sm">
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

        </div>

        {/* Favorite Button */}
        <button
          onClick={handleToggleFavorite}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-3 right-3 p-2 rounded-full transition z-10 ${
            favorited
              ? 'bg-rust text-cream shadow-sm scale-110'
              : 'bg-cream hover:bg-skysoft text-navy'
          }`}
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-cream' : ''}`} />
        </button>

        {/* Bottom Image Overlay: REMOVED prep time overlay as requested */}
      </Link>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-card-label mb-1">
            <span className="font-semibold uppercase tracking-wider text-card-label">
              {item.categoryName || 'Canteen Special'}
            </span>
          </div>

          <Link to={`/menu/${item.id}`} className="block group-hover:text-rust transition">
            <h3 className="font-semibold text-card-title text-base leading-snug line-clamp-2">
              {item.name}
            </h3>
          </Link>

          <p className="text-xs text-card-desc line-clamp-2 mt-1.5 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
          <div className="food-card__price-tag flex items-baseline gap-1 px-3 py-2">
            <span className="text-[10px] uppercase font-bold tracking-wide opacity-75">₹</span>
            <span className="text-lg font-extrabold font-mono leading-none">{item.price}</span>
          </div>

          {/* Stepper or Add to Cart Button */}
          {quantityInCart > 0 ? (
            <div className="flex items-center bg-sand border border-line rounded-full p-1 shadow-sm">
              <button
                onClick={handleDecrement}
                aria-label="Decrease quantity"
                className="stepper-btn"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="stepper-count">
                {quantityInCart}
              </span>
              <button
                onClick={handleIncrement}
                aria-label="Increase quantity"
                className="stepper-btn"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-navy hover:bg-slateblue-light active:scale-95 text-cream font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
