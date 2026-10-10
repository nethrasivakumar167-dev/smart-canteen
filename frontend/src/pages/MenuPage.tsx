import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FoodCard } from '../components/menu/FoodCard';
import { CategoryFilterBar } from '../components/menu/CategoryFilterBar';
import { fetchCategories, fetchMenuItems } from '../api/menuApi';
import { Category, MenuItem } from '../types';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  RotateCcw,
} from 'lucide-react';

const ALLERGEN_OPTIONS = [
  'milk', 'gluten', 'peanuts', 'tree-nuts', 'soy', 'sesame', 'egg', 'fish', 'shellfish',
];
const CUISINE_OPTIONS = ['south-indian', 'north-indian', 'chinese', 'western'];
const DIET_OPTIONS = [
  { value: 'veg', label: 'Veg' },
  { value: 'non-veg', label: 'Non-veg' },
  { value: 'egg', label: 'Egg' },
  { value: 'vegan', label: 'Vegan' },
];
const SPICE_OPTIONS = ['MILD', 'MEDIUM', 'HOT'];

const titleCase = (value: string) =>
  value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export const MenuPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [diet, setDiet] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [spice, setSpice] = useState('');
  const [availableNow, setAvailableNow] = useState(false);
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(0);
  const [sortBy, setSortBy] = useState<'POPULAR' | 'PRICE_ASC' | 'PRICE_DESC' | 'FASTEST'>('POPULAR');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [rawCategories, setRawCategories] = useState<Category[]>([]);
  const [unfilteredItems, setUnfilteredItems] = useState<MenuItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [baseLoaded, setBaseLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let active = true;
    Promise.all([fetchCategories(), fetchMenuItems()])
      .then(([categories, items]) => {
        if (!active) return;
        setRawCategories(categories);
        setUnfilteredItems(items);
        setMenuItems(items);
        setBaseLoaded(true);
      })
      .catch((error) => console.error('Failed to load menu page data:', error))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const category = searchParams.get('category');
    setSelectedCategory(category || 'all');
  }, [searchParams]);

  useEffect(() => {
    if (!baseLoaded) return;
    const hasServerFilters = Boolean(
      debouncedQuery || cuisine || diet || spice || availableNow ||
      excludedAllergens.length || selectedCategory !== 'all'
    );
    if (!hasServerFilters) {
      setMenuItems(unfilteredItems);
      return;
    }

    let active = true;
    setIsLoading(true);
    fetchMenuItems({
      q: debouncedQuery || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      cuisine: cuisine || undefined,
      diet: diet || undefined,
      spice: spice || undefined,
      availableNow: availableNow || undefined,
      excludeAllergens: excludedAllergens,
    })
      .then((items) => {
        if (active) setMenuItems(items);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    baseLoaded,
    debouncedQuery,
    cuisine,
    diet,
    spice,
    availableNow,
    excludedAllergens,
    selectedCategory,
    unfilteredItems,
  ]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    unfilteredItems.forEach((item) => counts.set(item.categoryId, (counts.get(item.categoryId) || 0) + 1));
    return counts;
  }, [unfilteredItems]);

  const categories = useMemo(() => {
    const all: Category = {
      id: 'cat-all',
      name: 'All Items',
      slug: 'all',
      displayOrder: 0,
      itemCount: unfilteredItems.length,
    };
    return [
      all,
      ...rawCategories
        .map((category) => ({ ...category, itemCount: categoryCounts.get(category.id) || 0 }))
        .filter((category) => category.itemCount > 0),
    ];
  }, [rawCategories, categoryCounts, unfilteredItems.length]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'all') setSearchParams({});
    else setSearchParams({ category });
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setDebouncedQuery('');
    setDiet('');
    setCuisine('');
    setSpice('');
    setAvailableNow(false);
    setExcludedAllergens([]);
    setMaxPrice(0);
    setSortBy('POPULAR');
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(
    selectedCategory !== 'all' || searchQuery.trim() || diet || cuisine || spice ||
    availableNow || excludedAllergens.length || maxPrice || sortBy !== 'POPULAR'
  );

  const filteredItems = useMemo(() => {
    const result = menuItems.filter((item) => !maxPrice || item.price <= maxPrice);
    return [...result].sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return a.price - b.price;
      if (sortBy === 'PRICE_DESC') return b.price - a.price;
      if (sortBy === 'FASTEST') return a.preparationTime - b.preparationTime;
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return b.rating - a.rating;
    });
  }, [menuItems, maxPrice, sortBy]);

  const removeAllergen = (allergen: string) =>
    setExcludedAllergens((current) => current.filter((value) => value !== allergen));

  const filterSelectClass =
    'w-full rounded-xl border border-line bg-sand px-3 py-2.5 text-xs font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-skyblue';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 bg-beige">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-line">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-navy">Freshly Prepared Daily</span>
          <h1 className="text-3xl sm:text-4xl font-semibold text-navy tracking-[0.1em] uppercase">Campus Canteen Menu</h1>
          <p className="text-xs sm:text-sm text-espresso mt-1">Preorder ahead • Customized spice levels • Live kitchen dispatch</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-espresso">
          <span className="w-2 h-2 rounded-full bg-rust" />
          <span>Showing {filteredItems.length} dishes</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search dishes, ingredients, cuisines..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-cream border border-line text-sm text-navy placeholder:text-espresso/50 focus:outline-none focus:ring-2 focus:ring-skyblue shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-espresso hover:text-navy p-1" aria-label="Clear search">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center p-1 bg-sand border border-line rounded-2xl shadow-sm">
          <button
            onClick={() => setDiet('')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition ${!diet ? 'bg-navy text-cream shadow-sm' : 'text-navy hover:bg-skysoft'}`}
          >
            All Dishes
          </button>
          <button
            onClick={() => setDiet((current) => current === 'veg' ? '' : 'veg')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${diet === 'veg' ? 'bg-navy text-cream shadow-sm' : 'text-navy hover:bg-skysoft'}`}
          >
            <span className="veg-badge bg-cream"><span className="veg-badge-dot" /></span>
            <span>Pure Veg</span>
          </button>
        </div>
        <div className="relative min-w-[180px]">
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="w-full appearance-none pl-4 pr-9 py-3 rounded-2xl bg-cream border border-line text-xs sm:text-sm font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-skyblue shadow-sm cursor-pointer">
            <option value="POPULAR">Most Popular</option>
            <option value="FASTEST">Fastest</option>
            <option value="PRICE_ASC">Price: Low to High</option>
            <option value="PRICE_DESC">Price: High to Low</option>
          </select>
          <ArrowUpDown className="w-4 h-4 text-espresso absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <button
          onClick={() => setShowFiltersModal(!showFiltersModal)}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-xs sm:text-sm font-bold transition shadow-sm ${hasActiveFilters ? 'bg-navy/10 border-navy text-navy' : 'bg-sand border-line text-navy hover:bg-skysoft'}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-navy" />}
        </button>
      </div>

      <CategoryFilterBar categories={categories} selectedCategoryId={selectedCategory} onSelectCategory={handleCategoryChange} />

      {showFiltersModal && (
        <div className="p-5 bg-cream border border-line rounded-2xl shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-navy flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-navy" />Advanced Filters</h4>
            <button onClick={clearFilters} className="text-xs text-navy hover:underline flex items-center gap-1 font-semibold"><RotateCcw className="w-3 h-3" />Reset All</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-espresso">Budget / Price Cap</label>
              <div className="flex flex-wrap gap-2">
                {[{ label: 'Any Price', value: 0 }, { label: 'Under ₹50', value: 50 }, { label: 'Under ₹80', value: 80 }, { label: 'Under ₹120', value: 120 }].map((option) => (
                  <button key={option.value} onClick={() => setMaxPrice(option.value)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${maxPrice === option.value ? 'bg-navy text-cream shadow-sm' : 'bg-sand text-navy hover:bg-skysoft'}`}>{option.label}</button>
                ))}
              </div>
            </div>
            <label className="space-y-2 text-xs font-bold text-espresso">
              Cuisine
              <select value={cuisine} onChange={(event) => setCuisine(event.target.value)} className={filterSelectClass}>
                <option value="">Any cuisine</option>
                {CUISINE_OPTIONS.map((option) => <option key={option} value={option}>{titleCase(option)}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-xs font-bold text-espresso">
              Diet
              <select value={diet} onChange={(event) => setDiet(event.target.value)} className={filterSelectClass}>
                <option value="">Any diet</option>
                {DIET_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-xs font-bold text-espresso">
              Spice
              <select value={spice} onChange={(event) => setSpice(event.target.value)} className={filterSelectClass}>
                <option value="">Any spice level</option>
                {SPICE_OPTIONS.map((option) => <option key={option} value={option}>{titleCase(option)}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-espresso">
              <input type="checkbox" checked={availableNow} onChange={(event) => setAvailableNow(event.target.checked)} className="accent-navy" />
              Available now
            </label>
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-espresso">Exclude allergens</legend>
              <div className="flex flex-wrap gap-2">
                {ALLERGEN_OPTIONS.map((allergen) => {
                  const checked = excludedAllergens.includes(allergen);
                  return (
                    <label key={allergen} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold cursor-pointer ${checked ? 'border-navy bg-navy text-cream' : 'border-line bg-sand text-navy'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setExcludedAllergens((current) => checked ? current.filter((value) => value !== allergen) : [...current, allergen])}
                        className="sr-only"
                      />
                      {titleCase(allergen)}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-espresso">Active Filters:</span>
          {selectedCategory !== 'all' && (
            <ActiveFilter label={`Category: ${categories.find((category) => category.id === selectedCategory || category.slug === selectedCategory)?.name || selectedCategory}`} onClear={() => handleCategoryChange('all')} />
          )}
          {searchQuery.trim() && <ActiveFilter label={`Search: "${searchQuery.trim()}"`} onClear={() => setSearchQuery('')} />}
          {diet && <ActiveFilter label={`Diet: ${DIET_OPTIONS.find((option) => option.value === diet)?.label || diet}`} onClear={() => setDiet('')} />}
          {cuisine && <ActiveFilter label={`Cuisine: ${titleCase(cuisine)}`} onClear={() => setCuisine('')} />}
          {spice && <ActiveFilter label={`Spice: ${titleCase(spice)}`} onClear={() => setSpice('')} />}
          {availableNow && <ActiveFilter label="Available now" onClear={() => setAvailableNow(false)} />}
          {excludedAllergens.map((allergen) => <ActiveFilter key={allergen} label={`Exclude: ${titleCase(allergen)}`} onClear={() => removeAllergen(allergen)} />)}
          {maxPrice > 0 && <ActiveFilter label={`Price: ≤ ₹${maxPrice}`} onClear={() => setMaxPrice(0)} />}
          {sortBy !== 'POPULAR' && <ActiveFilter label={`Sort: ${titleCase(sortBy)}`} onClear={() => setSortBy('POPULAR')} />}
          <button onClick={clearFilters} className="text-xs font-bold text-espresso hover:text-navy underline ml-2">Clear All</button>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-sm font-semibold text-espresso">Loading menu...</div>
      ) : filteredItems.length ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item) => <FoodCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div className="text-center py-16 bg-cream border border-line rounded-3xl p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-navy/10 text-navy flex items-center justify-center mx-auto"><Search className="w-8 h-8" /></div>
          <h3 className="text-xl font-bold text-navy">No dishes match your filters</h3>
          <button onClick={clearFilters} className="px-6 py-2.5 rounded-full bg-navy text-cream font-bold text-xs shadow-sm hover:bg-slateblue-light transition">Clear filters</button>
        </div>
      )}
    </div>
  );
};

const ActiveFilter: React.FC<{ label: string; onClear: () => void }> = ({ label, onClear }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-navy/10 text-navy border border-navy/20">
    {label}
    <button onClick={onClear} aria-label={`Remove ${label}`}><X className="w-3 h-3" /></button>
  </span>
);
