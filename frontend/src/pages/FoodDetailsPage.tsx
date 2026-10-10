import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchMenuItemById, fetchMenuItems } from '../api/menuApi';
import { MenuItem, CartItemCustomization } from '../types';
import { useCartStore } from '../store/cartStore';
import { useFavoriteStore } from '../store/favoriteStore';
import { useToastStore } from '../store/toastStore';
import { FoodCard } from '../components/menu/FoodCard';
import { FoodImage, hasUsableMenuImage } from '../components/common/FoodImage';
import {
  Heart,
  Plus,
  Minus,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

export const FoodDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCartStore();
  const { isFavorite, toggleFavorite } = useFavoriteStore();
  const { addToast } = useToastStore();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showImage, setShowImage] = useState(false);

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let isMounted = true;
    const loadItemDetails = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const dish = await fetchMenuItemById(id);
        if (isMounted) {
          setItem(dish);
          setShowImage(hasUsableMenuImage(dish?.imageUrl));
          if (dish) {
            const allCategoryItems = await fetchMenuItems({ category: dish.categoryId });
            if (isMounted) {
              setRelatedItems(
                allCategoryItems.filter((m) => m.id !== dish.id).slice(0, 3)
              );
            }
          }
        }
      } catch (err) {
        console.error('Error fetching dish details:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadItemDetails();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-navy border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-espresso">Loading dish details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-navy">Dish Not Found</h2>
        <p className="text-espresso">The requested canteen item does not exist or has been discontinued.</p>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-navy text-cream font-bold text-sm shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </Link>
      </div>
    );
  }

  const favorited = isFavorite(item.id);
  const unavailable = item.availableNow === false || !item.isAvailable;

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Breadcrumbs & Back */}
      <div className="flex items-center gap-2 text-xs font-semibold text-espresso">
        <Link to="/" className="hover:text-navy transition">Home</Link>
        <span>/</span>
        <Link to="/menu" className="hover:text-navy transition">Menu</Link>
        <span>/</span>
        <span className="text-navy truncate">{item.name}</span>
      </div>

      {/* Main Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Image Showcase */}
        {showImage && <div className="lg:col-span-6 space-y-4">
          <div className="relative rounded-3xl overflow-hidden bg-cream border border-line shadow-sm aspect-square sm:aspect-4/3 max-h-[480px] w-full">
            <FoodImage
              imageUrl={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={() => setShowImage(false)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent pointer-events-none" />

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="bg-cream/95 backdrop-blur-md p-1.5 rounded-lg shadow-sm">
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
              <span className="bg-navy text-cream text-xs font-bold px-3 py-1 rounded-full">
                {item.categoryName}
              </span>
            </div>

          </div>
        </div>}

        {/* Right Column: Information & Ordering Controls */}
        <div className={`${showImage ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-6 bg-cream border border-line rounded-3xl p-5 sm:p-7 shadow-sm`}>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-navy tracking-tight">
              {item.name}
            </h1>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rust font-mono">
                ₹{unitPrice}
              </span>
              {customizationExtraPerUnit > 0 && (
                <span className="text-xs text-espresso">
                  (Base ₹{item.price} + ₹{customizationExtraPerUnit} add-ons)
                </span>
              )}
            </div>

            <p className="mt-4 text-sm text-espresso leading-relaxed">
              {item.description}
            </p>
            {!!item.allergens?.length && (
              <div className="mt-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy">Allergens</h2>
                <p className="mt-1 text-sm text-espresso">{item.allergens.map((allergen) => allergen.replace(/[-_]/g, ' ')).join(', ')}</p>
              </div>
            )}
            {!!item.allergenNote && (
              <p className="mt-2 text-sm text-espresso">Check: {item.allergenNote}</p>
            )}
            {(item.allergens?.length || item.allergenNote) && (
              <p className="mt-2 text-xs text-espresso/75">
                Allergen information is indicative. Please confirm with canteen staff before ordering.
              </p>
            )}
          </div>

          {/* Customization Options (if any) */}
          {item.customizationGroups && item.customizationGroups.length > 0 && (
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-navy flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-navy" />
                Customise Your Order
              </h3>

              {item.customizationGroups.map((group) => {
                const isSingle = group.type === 'single';
                const chosen = selectedOptions[group.id] || [];

                return (
                  <div
                    key={group.id}
                    className="p-4 rounded-2xl bg-sand border border-line space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-navy">
                        {group.title}
                      </span>
                      <span className="text-espresso">
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
                                ? 'bg-navy text-cream border-navy'
                                : 'bg-cream border-line text-navy hover:bg-skysoft'
                            }`}
                          >
                            <span>{opt.name}</span>
                            <span className={`font-mono ${isSelected ? 'text-cream' : 'text-rust'}`}>
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

          {/* Stepper & Preorder Button - sticky bottom bar on mobile */}
          <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center gap-4 sticky bottom-0 bg-cream pb-4 md:pb-0 z-10">
            {/* Quantity Stepper */}
            <div className="flex items-center bg-sand border border-line rounded-full p-1.5 w-full sm:w-auto justify-between">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="stepper-btn w-9 h-9"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-extrabold text-base font-mono text-navy">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="stepper-btn w-9 h-9"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleToggleFavorite}
              aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
              className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition ${
                favorited ? 'bg-rust text-cream' : 'bg-skyblue text-navy hover:bg-skysoft'
              }`}
            >
              <Heart className={`w-5 h-5 ${favorited ? 'fill-cream' : ''}`} />
            </button>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={unavailable}
              className="w-full flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-full bg-navy hover:bg-slateblue-light text-cream font-extrabold text-base shadow-sm transition transform active:scale-98 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:hover:bg-slate-400"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{unavailable ? item.unavailableReason || 'Unavailable now' : `Add to Preorder • ₹${totalPrice}`}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Related Dishes */}
      {relatedItems.length > 0 && (
        <section className="pt-8 border-t border-line space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-navy">
              Frequently Preordered Together
            </h3>
            <p className="text-xs text-espresso mt-0.5">
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
