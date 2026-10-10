import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MenuItem } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { useFavoriteStore } from '../../store/favoriteStore';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { FoodImage, hasUsableMenuImage } from '../common/FoodImage';
import { Heart, Plus, Minus, Flame } from 'lucide-react';

interface FoodCardProps {
  item: MenuItem;
}

const titleCase = (value: string) =>
  value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export const FoodCard: React.FC<FoodCardProps> = ({ item }) => {
  const { addItem, updateQuantity, items } = useCartStore();
  const { isFavorite, toggleFavorite } = useFavoriteStore();
  const isStudent = useAuthStore((state) => state.user?.role === 'STUDENT');
  const { addToast } = useToastStore();
  const [showImage, setShowImage] = useState(hasUsableMenuImage(item.imageUrl));

  useEffect(() => {
    setShowImage(hasUsableMenuImage(item.imageUrl));
  }, [item.imageUrl]);

  const favorited = isFavorite(item.id);
  const cartItem = items.find((i) => i.menuItemId === item.id && !i.customizations);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const unavailable = item.availableNow === false || !item.isAvailable;
  const marker = item.dietaryTags?.includes('egg')
    ? { label: 'Egg', className: 'border-amber-600 text-amber-700' }
    : item.isVegetarian
      ? { label: 'Vegetarian', className: 'border-emerald-600 text-emerald-700' }
      : { label: 'Non-vegetarian', className: 'border-rust text-rust' };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (unavailable) return;
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
    if (unavailable) return;
    if (cartItem) updateQuantity(cartItem.id, 1);
    else addItem(item, 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) updateQuantity(cartItem.id, -1);
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

  const markerBadge = (
    <span
      title={marker.label}
      aria-label={marker.label}
      className={`inline-flex w-5 h-5 items-center justify-center rounded border-2 bg-cream text-[8px] font-black ${marker.className}`}
    >
      {marker.label === 'Egg' ? 'E' : '•'}
    </span>
  );

  const favoriteButton = (
    <button
      onClick={handleToggleFavorite}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      className={`p-2 rounded-full transition z-10 ${
        favorited ? 'bg-rust text-cream shadow-sm scale-110' : 'bg-cream hover:bg-skysoft text-navy'
      }`}
    >
      <Heart className={`w-4 h-4 ${favorited ? 'fill-cream' : ''}`} />
    </button>
  );

  const meta = (
    <div className="flex flex-wrap items-center gap-2">
      {item.spiceLevel && item.spiceLevel !== 'NONE' && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-espresso">
          <Flame className="w-3 h-3 text-rust" />
          {titleCase(item.spiceLevel)}
        </span>
      )}
      {item.isSpecial && (
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700">
          Special
        </span>
      )}
      {unavailable && (
        <span className="text-[10px] font-semibold text-red-700">
          {item.unavailableReason || 'Unavailable now'}
        </span>
      )}
      {!unavailable && item.availableNow === true && (
        <span className="text-[10px] font-semibold text-emerald-800">Available now</span>
      )}
    </div>
  );

  const allergenDetails = (item.allergens?.length || item.allergenNote) ? (
    <div className="mt-2 space-y-1">
      {!!item.allergens?.length && (
        <div className="flex flex-wrap items-center gap-1 text-[10px] text-espresso">
          <span className="font-bold">Contains:</span>
          {item.allergens.map((allergen) => (
            <span key={allergen} className="rounded-full bg-sand px-2 py-0.5">
              {titleCase(allergen)}
            </span>
          ))}
        </div>
      )}
      {!!item.allergenNote && (
        <p className="truncate text-[10px] text-espresso/75" title={item.allergenNote}>
          Check: {item.allergenNote}
        </p>
      )}
    </div>
  ) : null;

  const action = quantityInCart > 0 ? (
    <div className="flex items-center bg-sand border border-line rounded-full p-1 shadow-sm">
      <button onClick={handleDecrement} aria-label="Decrease quantity" className="stepper-btn">
        <Minus className="w-4 h-4" />
      </button>
      <span className="stepper-count">{quantityInCart}</span>
      <button onClick={handleIncrement} aria-label="Increase quantity" className="stepper-btn" disabled={unavailable}>
        <Plus className="w-4 h-4" />
      </button>
    </div>
  ) : (
    <button
      onClick={handleAddToCart}
      disabled={unavailable}
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-navy hover:bg-slateblue-light active:scale-95 text-cream font-bold text-xs shadow-sm transition-all disabled:cursor-not-allowed disabled:bg-slate-400 disabled:hover:bg-slate-400"
    >
      <Plus className="w-4 h-4 stroke-[3]" />
      <span>Add</span>
    </button>
  );

  return (
    <div className={`food-card group relative transition-all duration-300 hover:-translate-y-1 flex flex-col ${unavailable ? 'opacity-65 grayscale-[0.25]' : ''}`}>
      {showImage ? (
        <Link to={`/menu/${item.id}`} className="food-card__image relative h-44 sm:h-52 w-full overflow-hidden bg-sand block">
          <FoodImage
            imageUrl={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setShowImage(false)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/25 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-3 left-3 z-10">{markerBadge}</div>
          {isStudent && <div className="absolute top-3 right-3">{favoriteButton}</div>}
        </Link>
      ) : (
        <div className="flex items-center justify-between px-4 pt-4">
          {markerBadge}
          {isStudent && favoriteButton}
        </div>
      )}

      <div className={`p-4 flex-1 flex flex-col justify-between ${showImage ? '' : 'pt-1'}`}>
        <div>
          <div className="flex items-center justify-between text-[11px] text-card-label mb-1">
            <span className="font-semibold uppercase tracking-wider text-card-label">
              {item.categoryName || 'Canteen Special'}
            </span>
          </div>
          <Link to={`/menu/${item.id}`} className="block group-hover:text-rust transition">
            <h3 className="font-semibold text-card-title text-base leading-snug line-clamp-2">{item.name}</h3>
          </Link>
          <p className="text-xs text-card-desc line-clamp-2 mt-1.5 leading-relaxed">{item.description}</p>
          <div className="mt-2">{meta}</div>
          {allergenDetails}
        </div>

        <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
          <div className="food-card__price-tag flex items-baseline gap-1 px-3 py-2">
            <span className="text-[10px] uppercase font-bold tracking-wide opacity-75">₹</span>
            <span className="text-lg font-extrabold font-mono leading-none">{item.price}</span>
          </div>
          {action}
        </div>
      </div>
    </div>
  );
};
