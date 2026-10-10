import southIndianBreakfast from './south-indian-breakfast.json';
import vegetarianMeals from './vegetarian-meals.json';
import nonVegChinese from './non-veg-chinese.json';
import westernSnacks from './western-snacks.json';
import dessertsBeverages from './desserts-beverages.json';
import coldBeverages from './cold-beverages.json';

export const PRICE_BY_CATEGORY = {
  breakfast: 50,
  lunch: 90,
  dinner: 100,
  snacks: 50,
  starter: 70,
  chaat: 50,
  dessert: 50,
  'hot-beverages': 25,
  'cold-beverages': 40,
  seafood: 150,
  'non-veg': 130,
  egg: 80,
  indian: 90,
  default: 75,
} as const;

export const CATALOGUE_LEGACY_MATCHES: Record<string, string> = {
  'Podi Dosa': 'Crispy Ghee Podi Masala Dosa',
  'Idli with Sambar': 'Steamed Rice Idli with Medu Vada (2+1)',
  Pongal: 'Ghee Ven Pongal with Cashews',
  'South Indian Meals': 'South Indian Executive Mini Meals',
  'Paneer Biryani': 'Hyderabadi Dum Paneer Biryani Bowl',
  'Curd Rice': 'Tempered South Indian Curd Rice',
  Samosa: 'Crispy Onion Samosas (Plate of 2)',
  'French Fries': 'Crispy Peri Peri Potato Fries',
  'Peri-Peri Fries': 'Crispy Peri Peri Potato Fries',
  'South Indian Filter Coffee': 'Authentic Kumbakonam Degree Filter Coffee',
  'Mango Lassi': 'Alphonso Mango Lassi Shake',
  'Gulab Jamun': 'Warm Gulab Jamun with Rabdi (2 Pcs)',
};

export const menuCatalogue = [
  ...southIndianBreakfast,
  ...vegetarianMeals,
  ...nonVegChinese,
  ...westernSnacks,
  ...dessertsBeverages,
  ...coldBeverages,
];
