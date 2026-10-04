import { Category, MenuItem, Coupon, Review } from '../types';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'All Items', slug: 'all', icon: 'UtensilsCrossed', displayOrder: 0, itemCount: 14 },
  { id: 'cat-2', name: 'Breakfast', slug: 'breakfast', icon: 'Sunrise', displayOrder: 1, itemCount: 4 },
  { id: 'cat-3', name: 'Lunch', slug: 'lunch', icon: 'Soup', displayOrder: 2, itemCount: 3 },
  { id: 'cat-4', name: 'Snacks & Quick Bites', slug: 'snacks', icon: 'Sandwich', displayOrder: 3, itemCount: 3 },
  { id: 'cat-5', name: 'Beverages', slug: 'beverages', icon: 'Coffee', displayOrder: 4, itemCount: 2 },
  { id: 'cat-6', name: 'Desserts', slug: 'desserts', icon: 'IceCream', displayOrder: 5, itemCount: 1 },
  { id: 'cat-7', name: 'Healthy & Bowls', slug: 'healthy', icon: 'Salad', displayOrder: 6, itemCount: 1 },
];

export const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: 'item-1',
    name: 'Crispy Ghee Podi Masala Dosa',
    description: 'Golden fermented rice-lentil crepe infused with aromatic podi masala, clarified ghee, and spiced potato onion filling. Served with 3 coconut chutneys and hot sambar.',
    price: 75,
    categoryId: 'cat-2',
    categoryName: 'Breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80',
    isVegetarian: true,
    ingredients: ['Fermented Rice Batter', 'Urad Dal', 'Desi Ghee', 'Potato Masala', 'Gunpowder Podi', 'Mustard Seeds'],
    allergens: ['Dairy (Ghee)'],
    preparationTime: 8,
    calories: 340,
    isAvailable: true,
    stockStatus: 'AVAILABLE',
    rating: 4.9,
    reviewCount: 142,
    isPopular: true,
    isChefSpecial: true,
    customizationGroups: [
      {
        id: 'spice-level',
        title: 'Spice Level',
        type: 'single',
        required: true,
        options: [
          { name: 'Regular Spice', price: 0 },
          { name: 'Spicy Gunpowder Special', price: 5 },
          { name: 'Mild (Kids / Faculty friendly)', price: 0 }
        ]
      },
      {
        id: 'add-ons',
        title: 'Delicious Add-ons',
        type: 'multiple',
        required: false,
        options: [
          { name: 'Extra Coconut Chutney Cup', price: 10 },
          { name: 'Extra Spiced Potato Filling', price: 15 },
          { name: 'Filter Coffee Combo Add-on', price: 25 }
        ]
      }
    ]
  },
  {
    id: 'item-2',
    name: 'Steamed Rice Idli with Medu Vada (2+1)',
    description: 'Pillowy soft steamed rice cakes served with one crispy golden medu vada, accompanied by piping hot vegetable sambar and freshly grated mint-coconut chutney.',
    price: 55,
    categoryId: 'cat-2',
    categoryName: 'Breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    isVegetarian: true,
    ingredients: ['Rice', 'Urad Dal', 'Curry Leaves', 'Black Peppercorns', 'Ginger', 'Hing'],
    allergens: [],
    preparationTime: 5,
    calories: 280,
    isAvailable: true,
    stockStatus: 'AVAILABLE',
    rating: 4.8,
    reviewCount: 98,
    isPopular: true,
    customizationGroups: [
      {
        id: 'vada-dip',
        title: 'Vada Preparation',
        type: 'single',
        required: true,
        options: [
          { name: 'Crispy on Side', price: 0 },
          { name: 'Dipped in Sambar Bowl (Sambar Vada)', price: 5 }
        ]
      }
    ]
  },
  {
    id: 'item-3',
    name: 'Ghee Ven Pongal with Cashews',
    description: 'Traditional Tamil comforting rice and moong dal porridge tempered with whole black pepper, cumin seeds, fresh ginger, curry leaves, and crunchy roasted cashews.',
    price: 60,
    categoryId: 'cat-2',
    categoryName: 'Breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    isVegetarian: true,
    ingredients: ['Raw Rice', 'Yellow Moong Dal', 'Pure Ghee', 'Whole Black Pepper', 'Cumin', 'Cashews'],
    allergens: ['Nuts (Cashew)', 'Dairy (Ghee)'],
    preparationTime: 6,
    calories: 360,
    isAvailable: true,
    stockStatus: 'AVAILABLE',
    rating: 4.7,
    reviewCount: 76,
    isPopular: false,
  },
  {
    id: 'item-4',
    name: 'South Indian Executive Mini Meals',
    description: 'Wholesome campus lunch platter with Steamed Ponni Rice, Tomato Rasam, Drumstick Sambar, Vegetable Kootu, Poriyal, Curd, Appalam, and Sweet Kesari.',
    price: 95,
    categoryId: 'cat-3',
    categoryName: 'Lunch',
    imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80',
    isVegetarian: true,
    ingredients: ['Steamed Ponni Rice', 'Toor Dal', 'Tamarind', 'Mixed Country Vegetables', 'Fresh Curd', 'Papad'],
    allergens: ['Dairy (Curd)'],
    preparationTime: 7,
    calories: 520,
    isAvailable: true,
    stockStatus: 'AVAILABLE',
    rating: 4.9,
    reviewCount: 230,
    isPopular: true,
    isChefSpecial: true,
    customizationGroups: [
      {
        id: 'rice-choice',
        title: 'Rice Portion',
        type: 'single',
        required: true,
        options: [
          { name: 'Standard Full Meals', price: 0 },
          { name: 'Extra Rice & Sambar Bowl', price: 20 }
        ]
      }
    ]
  },
  {
    id: 'item-5',
    name: 'Hyderabadi Dum Paneer Biryani Bowl',
    description: 'Fragrant long-grain basmati rice slow-cooked on dum with marinated malai paneer cubes, saffron, caramelized onions, and royal spices. Served with creamy cucumber raita and spicy salan.',
    price: 130,
    categoryId: 'cat-3',
    categoryName: 'Lunch',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    isVegetarian: true,
    ingredients: ['Basmati Rice', 'Malai Paneer', 'Saffron', 'Mint & Coriander', 'Biryani Spices', 'Fried Onions'],
    allergens: ['Dairy (Paneer, Raita)'],
    preparationTime: 12,
    calories: 580,
    isAvailable: true,
    stockStatus: 'AVAILABLE',
    rating: 4.8,
    reviewCount: 185,
    isPopular: true,
    customizationGroups: [
      {
        id: 'biryani-spice',
        title: 'Spice Customization',
        type: 'single',
        required: true,
        options: [
          { name: 'Medium Dum Flavour', price: 0 },
          { name: 'Spicy Hyderabadi Kick', price: 0 }
        ]
      },
      {
        id: 'side-bowl',
        title: 'Side Additions',
        type: 'multiple',
        required: false,
        options: [
          { name: 'Extra Cucumber Raita', price: 15 },
          { name: 'Mirchi Ka Salan Cup', price: 15 }
        ]
      }
    ]
  },
  {
    id: 'item-6',
    name: 'Tempered South Indian Curd Rice',
    description: 'Refreshing homemade thick yogurt rice seasoned with mustard seeds, curry leaves, green chilies, grated ginger, and juicy pomegranate pearls. Served with spicy mango pickle.',
    price: 60,
    categoryId: 'cat-3',
    categoryName: 'Lunch',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    isVegetarian: true,
    ingredients: ['Mashed Rice', 'Fresh Yogurt', 'Mustard', 'Curry Leaves', 'Pomegranate', 'Green Chillies'],
    allergens: ['Dairy (Yogurt)'],
    preparationTime: 4,
    calories: 310,
    isAvailable: true,
    stockStatus: 'AVAILABLE',
    rating: 4.6,
    reviewCount: 64,
  },
  {
    id: 'item-7',
    name: 'Paneer Butter Masala Kati Roll',
    description: 'Flaky whole wheat paratha wrapped around succulent smoky tandoori paneer chunks, crisp bell peppers, mint chutney, and sliced pickled onions.',
    price: 90,
    categoryId: 'cat-4',
    categoryName: 'Snacks & Quick Bites',
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    isVegetarian: true,
    ingredients: ['Wheat Paratha', 'Cottage Cheese (Paneer)', 'Tandoori Spices', 'Bell Peppers', 'Mint Sauce', 'Onions'],
    allergens: ['Gluten (Wheat)', 'Dairy (Paneer)'],
    preparationTime: 10,
    calories: 410,
    isAvailable: true,
    stockStatus: 'AVAILABLE',
    rating: 4.8,
    reviewCount: 160,
    isPopular: true,
    customizationGroups: [
      {
        id: 'cheese-add',
        title: 'Cheese Upgrade',
        type: 'single',
        required: false,
        options: [
          { name: 'No Extra Cheese', price: 0 },
          { name: 'Loaded Melted Mozzarella', price: 20 }
        ]
      }
    ]
  },
  {
    id: 'item-8',
    name: 'Crispy Onion Samosas (Plate of 2)',
    description: 'Deep-fried triangular pastry stuffed with a zesty spiced onion, flattened rice, and green pea filling. Served with tangy tamarind and coriander chutney.',
    price: 35,
    categoryId: 'cat-4',
    categoryName: 'Snacks & Quick Bites',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    isVegetarian: true,
    ingredients: ['Flour Crust', 'Sliced Onions', 'Poha', 'Green Peas', 'Garam Masala', 'Amchur'],
    allergens: ['Gluten (Flour)'],
    preparationTime: 3,
    calories: 260,
    isAvailable: true,
    stockStatus: 'AVAILABLE',
    rating: 4.7,
    reviewCount: 210,
    isPopular: true,
  },
  {
    id: 'item-9',
    name: 'Crispy Peri Peri Potato Fries',
    description: 'Golden, crunch-crusted potato batons tossed in our signature spicy-tangy African peri peri dust. Served with creamy garlic dip.',
    price: 65,
    categoryId: 'cat-4',
    categoryName: 'Snacks & Quick Bites',
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
    isVegetarian: true,
    ingredients: ['Farm Potatoes', 'Peri Peri Spice Blend', 'Vegetable Oil', 'Garlic Mayo Dip'],
    allergens: [],
    preparationTime: 7,
    calories: 320,
    isAvailable: true,
    stockStatus: 'AVAILABLE',
    rating: 4.6,
    reviewCount: 92,
  },
  {
    id: 'item-10',
    name: 'Authentic Kumbakonam Degree Filter Coffee',
    description: 'Freshly decocted chicory-coffee blend frothed with thick boiling full-cream milk in traditional brass davarah and tumbler. Rich, aromatic, and invigorating.',
    price: 30,
    categoryId: 'cat-5',
    categoryName: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    isVegetarian: true,
    ingredients: ['Plantation-A Coffee Beans', 'Chicory', 'Full Cream Milk', 'Cane Sugar'],
    allergens: ['Dairy (Milk)'],
    preparationTime: 3,
    calories: 90,
    isAvailable: true,
    stockStatus: 'AVAILABLE',
    rating: 4.9,
    reviewCount: 310,
    isPopular: true,
    isChefSpecial: true,
    customizationGroups: [
      {
        id: 'coffee-sugar',
        title: 'Sugar Preference',
        type: 'single',
        required: true,
        options: [
          { name: 'Standard Sweetness', price: 0 },
          { name: 'Less Sugar', price: 0 },
          { name: 'No Sugar / Black Coffee', price: 0 },
          { name: 'Jaggery / Nattu Sakkarai', price: 5 }
        ]
      }
    ]
  },
  {
    id: 'item-11',
    name: 'Alphonso Mango Lassi Shake',
    description: 'Luscious blended thick curd churned with sweet Ratnagiri Alphonso mango pulp, cardamom essence, and topped with sliced roasted pistachios.',
    price: 60,
    categoryId: 'cat-5',
    categoryName: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80',
    isVegetarian: true,
    ingredients: ['Fresh Thick Curd', 'Alphonso Mango Pulp', 'Green Cardamom', 'Pistachios'],
    allergens: ['Dairy (Curd)', 'Nuts (Pistachio)'],
    preparationTime: 4,
    calories: 220,
    isAvailable: true,
    stockStatus: 'AVAILABLE',
    rating: 4.8,
    reviewCount: 88,
  },
  {
    id: 'item-12',
    name: 'Warm Gulab Jamun with Rabdi (2 Pcs)',
    description: 'Melt-in-mouth golden fried khoya dumplings soaked in saffron-cardamom sugar syrup, served warm over a bed of chilled thickened rabdi.',
    price: 50,
    categoryId: 'cat-6',
    categoryName: 'Desserts',
    imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
    isVegetarian: true,
    ingredients: ['Mawa / Khoya', 'Cottage Cheese', 'Saffron Sugar Syrup', 'Cardamom', 'Almonds'],
    allergens: ['Dairy (Khoya, Rabdi)', 'Nuts (Almonds)'],
    preparationTime: 2,
    calories: 290,
    isAvailable: true,
    stockStatus: 'AVAILABLE',
    rating: 4.9,
    reviewCount: 114,
    isPopular: true,
  },
  {
    id: 'item-13',
    name: 'Avocado & Green Moong Sprouts Power Bowl',
    description: 'High-protein campus wellness bowl loaded with sprouted moong, ripe buttery avocado cubes, cherry tomatoes, English cucumber, roasted pumpkin seeds, and a zesty lime vinaigrette.',
    price: 110,
    categoryId: 'cat-7',
    categoryName: 'Healthy & Bowls',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    isVegetarian: true,
    ingredients: ['Organic Moong Sprouts', 'Fresh Avocado', 'Cherry Tomatoes', 'Cucumber', 'Pumpkin Seeds', 'Lemon Olive Oil Dressing'],
    allergens: [],
    preparationTime: 6,
    calories: 240,
    isAvailable: true,
    stockStatus: 'AVAILABLE',
    rating: 4.7,
    reviewCount: 45,
    isPopular: false,
    isChefSpecial: true,
  },
  {
    id: 'item-14',
    name: 'South Indian Breakfast Combo Feast',
    description: 'The ultimate student starter pack: 1 Crispy Masala Dosa + 1 Steamed Rice Idli + 1 Medu Vada + 1 Tumbler Filter Coffee. Maximum value and satisfaction.',
    price: 125,
    categoryId: 'cat-2',
    categoryName: 'Breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    isVegetarian: true,
    ingredients: ['Masala Dosa', 'Idli', 'Medu Vada', 'Sambar', 'Chutney', 'Filter Coffee'],
    allergens: ['Dairy (Ghee, Milk)'],
    preparationTime: 9,
    calories: 620,
    isAvailable: true,
    stockStatus: 'AVAILABLE',
    rating: 4.95,
    reviewCount: 340,
    isPopular: true,
    isChefSpecial: true,
  }
];

export const MOCK_COUPONS: Coupon[] = [
  {
    code: 'WELCOME20',
    description: '20% Flat Discount on your first campus preorder (Up to ₹50)',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderValue: 99,
    maxDiscount: 50
  },
  {
    code: 'CAMPUS10',
    description: '10% Instant Student & Faculty discount on orders above ₹150',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderValue: 150,
    maxDiscount: 40
  },
  {
    code: 'BREAKFAST15',
    description: 'Flat ₹15 off on morning breakfast orders above ₹80',
    discountType: 'FIXED',
    discountValue: 15,
    minOrderValue: 80
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    userName: 'Kavitha R.',
    userRole: 'STUDENT',
    rating: 5,
    comment: 'The Podi Masala Dosa was crisp to perfection and arrived in 8 minutes flat! Preordering saved me from the 30-minute recess queue.',
    date: 'Yesterday'
  },
  {
    id: 'rev-2',
    userName: 'Dr. S. Ramanathan',
    userRole: 'FACULTY',
    rating: 5,
    comment: 'Filter coffee is consistent every morning. Degree coffee decoction aroma is outstanding. Great initiative for our department staff.',
    date: '2 days ago'
  },
  {
    id: 'rev-3',
    userName: 'Arjun Verma',
    userRole: 'STUDENT',
    rating: 4,
    comment: 'Paneer roll was piping hot and juicy. The QR pickup counter is so swift—just tapped and collected!',
    date: '3 days ago'
  }
];
