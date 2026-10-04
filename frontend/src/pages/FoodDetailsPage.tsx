import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_MENU_ITEMS, MOCK_REVIEWS } from '../data/mockData';
import { useCartStore } from '../store/cartStore';
import { useFavoriteStore } from '../store/favoriteStore';
import { useToastStore } from '../store/toastStore';
import { CartItemCustomization } from '../types';
import { FoodCard } from '../components/menu/FoodCard';
import {
  Clock,
  Star,
  Heart,
  Plus,
  Minus,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const FoodDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCartStore();
  const { isFavorite, toggleFavorite } = useFavoriteStore();
  const { addToast } = useToastStore();

  const item = MOCK_MENU_ITEMS.find((m) => m.id === id);

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  if (!item) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dish Not Found</h2>
        <p className="text-gray-500">The requested canteen item does not exist or has been discontinued.</p>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-bold text-sm shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Link>
      </div>
    );
  }

  const favorited = isFavorite(item.id);

  const handleToggleOption = (groupId: string, optName: string, isSingle: boolean) => {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];
      if (isSingle) {
        return { ...prev, [groupId]: [optName] };
      }
      if (current.includes(optName)) {
        return { ...prev, [groupId]: current.filter((o) => o !== optName) };
      }
      return { ...prev, [groupId]: [...current, optName] };
    });
  };

  // Calculate dynamic customization extra cost
  const customizationAdditions: CartItemCustomization[] = [];
  if (item.customizationGroups) {
    item.customizationGroups.forEach((group) => {
      const chosen = selectedOptions[group.id] || [];
      chosen.forEach((optName) => {
        const optionObj = group.options.find((o) => o.name === optName);
        if (optionObj) {
          customizationAdditions.push({
            groupName: group.title,
            selectedOption: optionObj.name,
            additionalPrice: optionObj.price,
          });
        }
      });
    });
  }

  const customizationExtraPerUnit = customizationAdditions.reduce((acc, c) => acc + c.additionalPrice, 0);
  const unitPrice = item.price + customizationExtraPerUnit;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addItem(item, quantity, customizationAdditions);
    addToast({
      type: 'success',
      title: 'Added to Preorder',
      message: `${quantity} × ${item.name} added to your cart.`,
    });
  };

  const handleToggleFavorite = () => {
    const added = toggleFavorite(item.id);
    addToast({
      type: added ? 'success' : 'info',
      title: added ? 'Favorites Updated' : 'Removed from Favorites',
      message: `${item.name} ${added ? 'saved to favorites.' : 'removed.'}`,
    });
  };

  const relatedItems = MOCK_MENU_ITEMS.filter(
    (m) => m.categoryId === item.categoryId && m.id !== item.id
  ).slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Breadcrumbs & Back */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
        <Link to="/" className="hover:text-brand-500 transition">Home</Link>
        <span>/</span>
        <Link to="/menu" className="hover:text-brand-500 transition">Menu</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white truncate">{item.name}</span>
      </div>

      {/* Main Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Image Showcase */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative rounded-3xl overflow-hidden bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-lg aspect-square sm:aspect-4/3 max-h-[480px] w-full">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md p-1.5 rounded-lg shadow-sm">
                {item.isVegetarian ? (
                  <span className="veg-badge">
                    <span className="veg-badge-dot" />
                  </span>
                ) : (
                  <span className="non-veg-badge">
                    <span className="non-veg-badge-dot" />
                  </span>
                )}
              </div>
              <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-lg">
                {item.categoryName}
              </span>
            </div>

            {/* Favorite Button */}
            <button
              onClick={handleToggleFavorite}
              className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition shadow-md ${
                favorited ? 'bg-red-500 text-white scale-110' : 'bg-black/40 hover:bg-black/60 text-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${favorited ? 'fill-white' : ''}`} />
            </button>

            {/* Bottom Photo Stats */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl font-bold">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Prep: {item.preparationTime} mins</span>
              </div>
              {item.calories && (
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl font-bold">
                  {item.calories} Calories
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Information & Ordering Controls */}
        <div className="lg:col-span-6 space-y-6">
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 text-amber-500 font-extrabold text-sm">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{item.rating}</span>
              </div>
              <span className="text-xs text-gray-400">({item.reviewCount} reviews)</span>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                In Stock & Available
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {item.name}
            </h1>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-brand-600 dark:text-brand-400 font-mono">
                ₹{unitPrice}
              </span>
              {customizationExtraPerUnit > 0 && (
                <span className="text-xs text-gray-400">
                  (Base ₹{item.price} + ₹{customizationExtraPerUnit} add-ons)
                </span>
              )}
            </div>

            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Ingredients & Allergens Pills */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-dark-card border border-gray-200/80 dark:border-dark-border space-y-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Ingredients
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {item.ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            {item.allergens.length > 0 && (
              <div className="pt-2 border-t border-gray-200/60 dark:border-dark-border flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Allergen Warning:</strong> Contains {item.allergens.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Customization Options (if any) */}
          {item.customizationGroups && item.customizationGroups.length > 0 && (
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                Customise Your Order
              </h3>

              {item.customizationGroups.map((group) => {
                const isSingle = group.type === 'single';
                const chosen = selectedOptions[group.id] || [];

                return (
                  <div
                    key={group.id}
                    className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {group.title}
                      </span>
                      <span className="text-gray-400">
                        {isSingle ? '(Select 1)' : '(Optional Multi-select)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {group.options.map((opt) => {
                        const isSelected = chosen.includes(opt.name);
                        return (
                          <button
                            key={opt.name}
                            type="button"
                            onClick={() =>
                              handleToggleOption(group.id, opt.name, isSingle)
                            }
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition text-left ${
                              isSelected
                                ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-500 text-brand-700 dark:text-brand-300'
                                : 'bg-gray-50 dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            <span>{opt.name}</span>
                            <span className="font-mono text-brand-600 dark:text-brand-400">
                              {opt.price > 0 ? `+₹${opt.price}` : 'Free'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stepper & Preorder Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-dark-border flex flex-col sm:flex-row items-center gap-4">
            {/* Quantity Stepper */}
            <div className="flex items-center bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-1.5 w-full sm:w-auto justify-between">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-xl bg-white dark:bg-dark-surface flex items-center justify-center text-gray-700 dark:text-gray-200 shadow-sm hover:bg-brand-500 hover:text-white transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-extrabold text-base font-mono text-gray-900 dark:text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 rounded-xl bg-white dark:bg-dark-surface flex items-center justify-center text-gray-700 dark:text-gray-200 shadow-sm hover:bg-brand-500 hover:text-white transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="w-full flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white font-extrabold text-base shadow-lg hover:shadow-glow transition transform active:scale-98"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Add to Preorder • ₹{totalPrice}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="pt-8 border-t border-gray-200 dark:border-dark-border space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Student & Faculty Reviews
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Verified campus feedback on taste, portion size, and pickup speed
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 font-extrabold text-sm">
            <Star className="w-4 h-4 fill-amber-400" />
            <span>{item.rating} / 5.0</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOCK_REVIEWS.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-gray-900 dark:text-white">
                  {review.userName}
                </span>
                <div className="flex text-amber-400">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 italic">
                "{review.comment}"
              </p>
              <span className="text-[10px] text-gray-400 block">{review.date}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Related Dishes */}
      {relatedItems.length > 0 && (
        <section className="pt-8 border-t border-gray-200 dark:border-dark-border space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Frequently Preordered Together
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              More popular items from {item.categoryName}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedItems.map((rel) => (
              <FoodCard key={rel.id} item={rel} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
