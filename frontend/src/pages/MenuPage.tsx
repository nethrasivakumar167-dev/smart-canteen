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
  Clock,
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
  const [maxPrepTime, setMaxPrepTime] = useState<number>(0); // 0 = no limit
  const [maxPrice, setMaxPrice] = useState<number>(0); // 0 = no limit
  const [sortBy, setSortBy] = useState<'POPULAR' | 'PRICE_ASC' | 'PRICE_DESC' | 'RATING' | 'FASTEST'>('POPULAR');
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
    setMaxPrepTime(0);
    setMaxPrice(0);
    setSortBy('POPULAR');
    searchParams.delete('category');
    setSearchParams(searchParams);
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    searchQuery.trim() !== '' ||
    dietaryFilter !== 'ALL' ||
    maxPrepTime > 0 ||
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

    // 4. Max Prep Time
    if (maxPrepTime > 0) {
      result = result.filter((item) => item.preparationTime <= maxPrepTime);
    }

    // 5. Max Price
    if (maxPrice > 0) {
      result = result.filter((item) => item.price <= maxPrice);
    }

    // 6. Sorting
    result.sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return a.price - b.price;
      if (sortBy === 'PRICE_DESC') return b.price - a.price;
      if (sortBy === 'RATING') return b.rating - a.rating;
      if (sortBy === 'FASTEST') return a.preparationTime - b.preparationTime;
      // Default: Popular / Chef specials first, then rating
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return b.rating - a.rating;
    });

    return result;
  }, [selectedCategory, searchQuery, dietaryFilter, maxPrepTime, maxPrice, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-gray-200/80 dark:border-dark-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Freshly Prepared Daily
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Campus Canteen Menu
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Preorder ahead • Customized spice levels • Live kitchen dispatch
          </p>
        </div>

        {/* Live Active Items Count */}
        <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Showing {filteredItems.length} available dishes</span>
        </div>
      </div>

      {/* Top Search & Controls Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by dish name, ingredients (e.g. Dosa, Paneer, Coffee)..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dietary Quick Filter */}
        <div className="flex items-center p-1 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl shadow-sm">
          <button
            onClick={() => setDietaryFilter('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
              dietaryFilter === 'ALL'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            All Dishes
          </button>
          <button
            onClick={() => setDietaryFilter('VEG')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
              dietaryFilter === 'VEG'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="veg-badge bg-white">
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
            className="w-full appearance-none pl-4 pr-9 py-3 rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 shadow-sm cursor-pointer"
          >
            <option value="POPULAR">🔥 Most Popular</option>
            <option value="FASTEST">⚡ Fastest (Under 5-10m)</option>
            <option value="PRICE_ASC">💰 Price: Low to High</option>
            <option value="PRICE_DESC">💎 Price: High to Low</option>
            <option value="RATING">⭐ Highest Rated</option>
          </select>
          <ArrowUpDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Filter Drawer Toggle on Mobile */}
        <button
          onClick={() => setShowFiltersModal(!showFiltersModal)}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-xs sm:text-sm font-bold transition shadow-sm ${
            maxPrepTime > 0 || maxPrice > 0
              ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-600 dark:text-brand-400'
              : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {(maxPrepTime > 0 || maxPrice > 0) && (
            <span className="w-2 h-2 rounded-full bg-brand-500" />
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
        <div className="p-5 bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-brand-500" />
              Advanced Filters
            </h4>
            <button
              onClick={handleResetFilters}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Prep Time Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-500" />
                Maximum Preparation Time
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Any Time', value: 0 },
                  { label: '⚡ Under 5 min', value: 5 },
                  { label: '🕒 Under 8 min', value: 8 },
                  { label: '⏳ Under 12 min', value: 12 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMaxPrepTime(opt.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      maxPrepTime === opt.value
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-300">
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
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-300'
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
          <span className="text-xs font-bold text-gray-400">Active Filters:</span>

          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
              Category: {MOCK_CATEGORIES.find((c) => c.id === selectedCategory)?.name}
              <button onClick={() => handleCategoryChange('all')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {dietaryFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              {dietaryFilter === 'VEG' ? 'Pure Veg Only' : 'Non-Veg'}
              <button onClick={() => setDietaryFilter('ALL')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {maxPrepTime > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Prep: &le; {maxPrepTime} mins
              <button onClick={() => setMaxPrepTime(0)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {maxPrice > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              Price: &le; ₹{maxPrice}
              <button onClick={() => setMaxPrice(0)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-gray-500 hover:text-brand-500 underline ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Food Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white dark:bg-dark-surface rounded-3xl border border-gray-200 dark:border-dark-border p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-500 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            No dishes found matching your criteria
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Try adjusting your search query, price range, or dietary filters to find available canteen dishes.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-xs shadow-md hover:bg-brand-600 transition"
          >
            Reset Filters
          </button>
        </div>
      )}

    </div>
  );
};
