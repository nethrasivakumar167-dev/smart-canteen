export interface LandingDish {
  name: string;
  slug: string;
  descriptor: string;
}

export const landingDishes: LandingDish[] = [
  { name: 'Masala Dosa', slug: 'masala-dosa', descriptor: 'South Indian breakfast' },
  { name: 'Veg Biryani', slug: 'veg-biryani', descriptor: 'Fragrant rice favourite' },
  { name: 'Chicken Biryani', slug: 'chicken-biryani', descriptor: 'A hearty campus meal' },
  { name: 'Gulab Jamun', slug: 'gulab-jamun', descriptor: 'Classic Indian sweet' },
  { name: 'Cappuccino', slug: 'cappuccino', descriptor: 'Freshly brewed coffee' },
  { name: 'Pani Puri', slug: 'pani-puri', descriptor: 'Crisp street-food snack' },
  { name: 'Idli with Sambar', slug: 'idli-with-sambar', descriptor: 'Soft idli and lentil stew' },
  { name: 'Chicken Burger', slug: 'chicken-burger', descriptor: 'A familiar savoury bite' },
];
