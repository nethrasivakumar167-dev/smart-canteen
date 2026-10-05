import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FoodCard } from '../components/menu/FoodCard';
import { CategoryFilterBar } from '../components/menu/CategoryFilterBar';
import { MOCK_MENU_ITEMS, MOCK_CATEGORIES } from '../data/mockData';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Sparkles,
  Flame,
  RotateCcw,
  Check,
} from 'lucide-react';

export const MenuPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL State initialization
  const initialCategory = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');
  const [maxPrice, setMaxPrice] = useState<number>(0); // 0 = no limit
  const [sortBy, setSortBy] = useState<'POPULAR' | 'PRICE_ASC' | 'PRICE_DESC' | 'FASTEST'>('POPULAR');
  const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: catId });
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setDietaryFilter('ALL');
    setMaxPrice(0);
    setSortBy('POPULAR');
    searchParams.delete('category');
    setSearchParams(searchParams);
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    searchQuery.trim() !== '' ||
    dietaryFilter !== 'ALL' ||
    maxPrice > 0 ||
    sortBy !== 'POPULAR';

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = [...MOCK_MENU_ITEMS];

    // 1. Category
    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.categoryId === selectedCategory);
    }

    // 2. Search Query (name, description, ingredients, categoryName)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.ingredients.some((ing) => ing.toLowerCase().includes(q)) ||
          (item.categoryName && item.categoryName.toLowerCase().includes(q))
      );
    }

    // 3. Dietary
    if (dietaryFilter === 'VEG') {
      result = result.filter((item) => item.isVegetarian);
    } else if (dietaryFilter === 'NON_VEG') {
      result = result.filter((item) => !item.isVegetarian);
    }

    // 4. Max Price
    if (maxPrice > 0) {
      result = result.filter((item) => item.price <= maxPrice);
    }

    // 5. Sorting
    result.sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return a.price - b.price;
      if (sortBy === 'PRICE_DESC') return b.price - a.price;
      if (sortBy === 'FASTEST') return a.preparationTime - b.preparationTime;
      // Default: Popular / Chef specials first, then rating
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return b.rating - a.rating;
    });

    return result;
  }, [selectedCategory, searchQuery, dietaryFilter, maxPrice, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 bg-beige">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-line">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-navy">
            Freshly Prepared Daily
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold text-navy tracking-[0.1em] uppercase">
            Campus Canteen Menu
          </h1>
          <p className="text-xs sm:text-sm text-espresso mt-1">
            Preorder ahead • Customized spice levels • Live kitchen dispatch
          </p>
        </div>

        {/* Live Active Items Count */}
        <div className="flex items-center gap-2 text-xs font-bold text-espresso">
          <span className="w-2 h-2 rounded-full bg-rust" />
          <span>Showing {filteredItems.length} available dishes</span>
        </div>
      </div>

      {/* Top Search & Controls Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by dish name, ingredients (e.g. Dosa, Paneer, Coffee)..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-cream border border-line text-sm text-navy placeholder:text-espresso/50 focus:outline-none focus:ring-2 focus:ring-skyblue shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-espresso hover:text-navy p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dietary Quick Filter */}
        <div className="flex items-center p-1 bg-sand border border-line rounded-2xl shadow-sm">
          <button
            onClick={() => setDietaryFilter('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
              dietaryFilter === 'ALL'
                ? 'bg-navy text-cream shadow-sm'
                : 'text-navy hover:bg-skysoft'
            }`}
          >
            All Dishes
          </button>
          <button
            onClick={() => setDietaryFilter('VEG')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              dietaryFilter === 'VEG'
                ? 'bg-navy text-cream shadow-sm'
                : 'text-navy hover:bg-skysoft'
            }`}
          >
            <span className="veg-badge bg-cream">
              <span className="veg-badge-dot" />
            </span>
            <span>Pure Veg</span>
          </button>
        </div>

        {/* Sort Selector */}
        <div className="relative min-w-[180px]">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full appearance-none pl-4 pr-9 py-3 rounded-2xl bg-cream border border-line text-xs sm:text-sm font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-skyblue shadow-sm cursor-pointer"
          >
            <option value="POPULAR">🔥 Most Popular</option>
            <option value="FASTEST">⚡ Fastest (Under 5-10m)</option>
            <option value="PRICE_ASC">💰 Price: Low to High</option>
            <option value="PRICE_DESC">💎 Price: High to Low</option>
          </select>
          <ArrowUpDown className="w-4 h-4 text-espresso absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Filter Drawer Toggle on Mobile */}
        <button
          onClick={() => setShowFiltersModal(!showFiltersModal)}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-xs sm:text-sm font-bold transition shadow-sm ${
            maxPrice > 0
              ? 'bg-navy/10 border-navy text-navy'
              : 'bg-sand border-line text-navy hover:bg-skysoft'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {maxPrice > 0 && (
            <span className="w-2 h-2 rounded-full bg-navy" />
          )}
        </button>
      </div>

      {/* Category Horizontal Filter Bar */}
      <CategoryFilterBar
        categories={MOCK_CATEGORIES}
        selectedCategoryId={selectedCategory}
        onSelectCategory={handleCategoryChange}
      />

      {/* Secondary Quick Filter Pills / Sliders (Expandable) */}
      {showFiltersModal && (
        <div className="p-5 bg-cream border border-line rounded-2xl shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-navy flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-navy" />
              Advanced Filters
            </h4>
            <button
              onClick={handleResetFilters}
              className="text-xs text-navy hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Price Range Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-espresso">
                Budget / Price Cap
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Any Price', value: 0 },
                  { label: 'Under ₹50', value: 50 },
                  { label: 'Under ₹80', value: 80 },
                  { label: 'Under ₹120', value: 120 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMaxPrice(opt.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      maxPrice === opt.value
                        ? 'bg-navy text-cream shadow-sm'
                        : 'bg-sand text-navy hover:bg-skysoft'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-espresso">Active Filters:</span>

          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-navy/10 text-navy border border-navy/20">
              Category: {MOCK_CATEGORIES.find((c) => c.id === selectedCategory)?.name}
              <button onClick={() => handleCategoryChange('all')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-navy/10 text-navy border border-navy/20">
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {dietaryFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              {dietaryFilter === 'VEG' ? 'Pure Veg Only' : 'Non-Veg'}
              <button onClick={() => setDietaryFilter('ALL')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {maxPrice > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
              Price: &le; ₹{maxPrice}
              <button onClick={() => setMaxPrice(0)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-espresso hover:text-navy underline ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Food Items Grid - 2 column grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-cream border border-line rounded-3xl p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-navy/10 text-navy flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-navy">
            No dishes found matching your criteria
          </h3>
          <p className="text-sm text-espresso max-w-md mx-auto">
            Try adjusting your search query, price range, or dietary filters to find available canteen dishes.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2.5 rounded-full bg-navy text-cream font-bold text-xs shadow-sm hover:bg-slateblue-light transition"
          >
            Reset Filters
          </button>
        </div>
      )}

    </div>
  );
};