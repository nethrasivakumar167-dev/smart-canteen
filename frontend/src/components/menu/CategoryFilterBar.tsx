import React from 'react';
import { Category } from '../../types';
import {
  UtensilsCrossed,
  Sunrise,
  Soup,
  Sandwich,
  Coffee,
  IceCream,
  Salad,
} from 'lucide-react';

interface CategoryFilterBarProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'breakfast':
        return <Sunrise className="w-4 h-4" />;
      case 'lunch':
        return <Soup className="w-4 h-4" />;
      case 'snacks':
        return <Sandwich className="w-4 h-4" />;
      case 'beverages':
        return <Coffee className="w-4 h-4" />;
      case 'desserts':
        return <IceCream className="w-4 h-4" />;
      case 'healthy':
        return <Salad className="w-4 h-4" />;
      default:
        return <UtensilsCrossed className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
      <div className="flex items-center gap-2 min-w-max">
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id || (cat.slug === 'all' && selectedCategoryId === 'all');
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug === 'all' ? 'all' : cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border font-bold text-xs sm:text-sm transition-all duration-200 shadow-sm ${
                isSelected
                  ? 'bg-navy border-navy text-cream'
                  : 'bg-sand border-line text-navy hover:bg-skysoft'
              }`}
            >
              <span className={isSelected ? 'text-cream' : 'text-navy'}>
                {getCategoryIcon(cat.slug)}
              </span>
              <span>{cat.name}</span>
              {cat.itemCount !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    isSelected
                      ? 'bg-cream/20 text-cream'
                  : 'bg-cream text-navy'
                  }`}
                >
                  {cat.itemCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
