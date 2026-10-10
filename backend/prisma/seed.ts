import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { CATALOGUE_LEGACY_MATCHES, menuCatalogue } from './catalogue';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // Prevent seeding in production
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Seeding is not allowed in production environment.');
    process.exit(1);
  }

  // Load DEMO_PASSWORD from environment
  const demoPassword = process.env.DEMO_PASSWORD;
  if (!demoPassword) {
    console.error('❌ DEMO_PASSWORD environment variable is required for seeding.');
    process.exit(1);
  }
  if (demoPassword.length < 8) {
    console.error('❌ DEMO_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  console.log('🌱 Seeding Smart Canteen Database...');

  // Hash the demo password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(demoPassword, salt);

  // Category data from frontend mockData
  const categoryData = [
    { name: 'Breakfast', slug: 'breakfast', description: 'Freshly steamed idlis, crispy dosas, and morning specials', displayOrder: 1 },
    { name: 'Lunch', slug: 'lunch', description: 'South Indian full meals, variety rices, and biryani bowls', displayOrder: 2 },
    { name: 'Snacks & Quick Bites', slug: 'snacks', description: 'Samosas, hot rolls, cutlets, and crispy fries', displayOrder: 3 },
    { name: 'Beverages', slug: 'beverages', description: 'Kumbakonam degree filter coffee, masala tea, and juices', displayOrder: 4 },
    { name: 'Desserts', slug: 'desserts', description: 'Warm gulab jamuns, rabdi, and ice cream treats', displayOrder: 5 },
    { name: 'Healthy & Bowls', slug: 'healthy', description: 'Sprout salads, fruit bowls, and protein shakes', displayOrder: 6 },
    { name: 'South Indian & Breakfast', slug: 'south-indian-breakfast', description: 'South Indian breakfast favourites', displayOrder: 7 },
    { name: 'North Indian & Meals', slug: 'north-indian-meals', description: 'North Indian meals and curries', displayOrder: 8 },
    { name: 'Non-Veg', slug: 'non-veg', description: 'Meat, seafood, and egg dishes', displayOrder: 9 },
    { name: 'Chinese', slug: 'chinese', description: 'Chinese and Indo-Chinese dishes', displayOrder: 10 },
    { name: 'Western & Fast Food', slug: 'western-fast-food', description: 'Western meals and fast food', displayOrder: 11 },
    { name: 'Snacks & Chaats', slug: 'snacks-chaats', description: 'Snacks, chaats, and street food', displayOrder: 12 },
  ];

  // Upsert categories by slug
  const categoryMap = new Map<string, string>();
  for (const cat of categoryData) {
    const upserted = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: { ...cat, isAvailable: true },
    });
    categoryMap.set(cat.slug, upserted.id);
    console.log(`  ✓ Category: ${cat.name} (${upserted.id})`);
  }

  // Menu item data from frontend mockData.ts
  // Format: { name, description, price, categorySlug, imageUrl, isVegetarian }
  const menuItemsData = [
    // Breakfast
    {
      name: 'Crispy Ghee Podi Masala Dosa',
      description: 'Golden fermented rice-lentil crepe infused with aromatic podi masala, clarified ghee, and spiced potato onion filling. Served with 3 coconut chutneys and hot sambar.',
      price: 75,
      categorySlug: 'breakfast',
      imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      dietaryTags: [],
    },
    {
      name: 'Steamed Rice Idli with Medu Vada (2+1)',
      description: 'Pillowy soft steamed rice cakes served with one crispy golden medu vada, accompanied by piping hot vegetable sambar and freshly grated mint-coconut chutney.',
      price: 55,
      categorySlug: 'breakfast',
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      dietaryTags: [],
    },
    {
      name: 'Ghee Ven Pongal with Cashews',
      description: 'Traditional Tamil comforting rice and moong dal porridge tempered with whole black pepper, cumin seeds, fresh ginger, curry leaves, and crunchy roasted cashews.',
      price: 60,
      categorySlug: 'breakfast',
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      dietaryTags: ['contains-nuts'],
    },
    {
      name: 'South Indian Breakfast Combo Feast',
      description: 'The ultimate student starter pack: 1 Crispy Masala Dosa + 1 Steamed Rice Idli + 1 Medu Vada + 1 Tumbler Filter Coffee. Maximum value and satisfaction.',
      price: 125,
      categorySlug: 'breakfast',
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      dietaryTags: [],
    },
    // Lunch
    {
      name: 'South Indian Executive Mini Meals',
      description: 'Wholesome campus lunch platter with Steamed Ponni Rice, Tomato Rasam, Drumstick Sambar, Vegetable Kootu, Poriyal, Curd, Appalam, and Sweet Kesari.',
      price: 95,
      categorySlug: 'lunch',
      imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      dietaryTags: [],
    },
    {
      name: 'Hyderabadi Dum Paneer Biryani Bowl',
      description: 'Fragrant long-grain basmati rice slow-cooked on dum with marinated malai paneer cubes, saffron, caramelized onions, and royal spices. Served with creamy cucumber raita and spicy salan.',
      price: 130,
      categorySlug: 'lunch',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      dietaryTags: ['veg'],
    },
    {
      name: 'Tempered South Indian Curd Rice',
      description: 'Refreshing homemade thick yogurt rice seasoned with mustard seeds, curry leaves, green chilies, grated ginger, and juicy pomegranate pearls. Served with spicy mango pickle.',
      price: 60,
      categorySlug: 'lunch',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      dietaryTags: [],
    },
    // Snacks & Quick Bites
    {
      name: 'Paneer Butter Masala Kati Roll',
      description: 'Flaky whole wheat paratha wrapped around succulent smoky tandoori paneer chunks, crisp bell peppers, mint chutney, and sliced pickled onions.',
      price: 90,
      categorySlug: 'snacks',
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      dietaryTags: ['veg'],
    },
    {
      name: 'Crispy Onion Samosas (Plate of 2)',
      description: 'Deep-fried triangular pastry stuffed with a zesty spiced onion, flattened rice, and green pea filling. Served with tangy tamarind and coriander chutney.',
      price: 35,
      categorySlug: 'snacks',
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      dietaryTags: [],
    },
    {
      name: 'Crispy Peri Peri Potato Fries',
      description: 'Golden, crunch-crusted potato batons tossed in our signature spicy-tangy African peri peri dust. Served with creamy garlic dip.',
      price: 65,
      categorySlug: 'snacks',
      imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      dietaryTags: [],
    },
    // Beverages
    {
      name: 'Authentic Kumbakonam Degree Filter Coffee',
      description: 'Freshly decocted chicory-coffee blend frothed with thick boiling full-cream milk in traditional brass davarah and tumbler. Rich, aromatic, and invigorating.',
      price: 30,
      categorySlug: 'beverages',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      dietaryTags: [],
    },
    {
      name: 'Alphonso Mango Lassi Shake',
      description: 'Luscious blended thick curd churned with sweet Ratnagiri Alphonso mango pulp, cardamom essence, and topped with sliced roasted pistachios.',
      price: 60,
      categorySlug: 'beverages',
      imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      dietaryTags: [],
    },
    // Desserts
    {
      name: 'Warm Gulab Jamun with Rabdi (2 Pcs)',
      description: 'Melt-in-mouth golden fried khoya dumplings soaked in saffron-cardamom sugar syrup, served warm over a bed of chilled thickened rabdi.',
      price: 50,
      categorySlug: 'desserts',
      imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      dietaryTags: [],
    },
    // Healthy & Bowls
    {
      name: 'Avocado & Green Moong Sprouts Power Bowl',
      description: 'High-protein campus wellness bowl loaded with sprouted moong, ripe buttery avocado cubes, cherry tomatoes, English cucumber, roasted pumpkin seeds, and a zesty lime vinaigrette.',
      price: 110,
      categorySlug: 'healthy',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      dietaryTags: [],
    },
  ];

  const legacyMetadata: Record<string, {
    tags: string[];
    cuisines: string[];
    mealTimes: string[];
    dietaryTags: string[];
    allergens: string[];
    allergenNote: string | null;
    spiceLevel: string;
  }> = {
    'Crispy Ghee Podi Masala Dosa': { tags: ['south-indian'], cuisines: ['south-indian'], mealTimes: ['BREAKFAST'], dietaryTags: ['veg'], allergens: ['milk'], allergenNote: null, spiceLevel: 'MEDIUM' },
    'Steamed Rice Idli with Medu Vada (2+1)': { tags: ['south-indian', 'snacks'], cuisines: ['south-indian'], mealTimes: ['ALL_DAY'], dietaryTags: ['veg'], allergens: [], allergenNote: null, spiceLevel: 'MILD' },
    'Ghee Ven Pongal with Cashews': { tags: ['south-indian'], cuisines: ['south-indian'], mealTimes: ['BREAKFAST'], dietaryTags: ['veg', 'contains-nuts'], allergens: ['milk', 'tree-nuts'], allergenNote: null, spiceLevel: 'MILD' },
    'South Indian Breakfast Combo Feast': { tags: ['south-indian'], cuisines: ['south-indian'], mealTimes: ['ALL_DAY'], dietaryTags: ['veg'], allergens: ['milk'], allergenNote: null, spiceLevel: 'MILD' },
    'South Indian Executive Mini Meals': { tags: ['south-indian'], cuisines: ['south-indian'], mealTimes: ['LUNCH'], dietaryTags: ['veg'], allergens: ['milk'], allergenNote: 'Milk if curd is included.', spiceLevel: 'MILD' },
    'Hyderabadi Dum Paneer Biryani Bowl': { tags: ['indian'], cuisines: ['indian'], mealTimes: ['LUNCH', 'DINNER'], dietaryTags: ['veg'], allergens: ['milk'], allergenNote: 'Possible nuts.', spiceLevel: 'MEDIUM' },
    'Tempered South Indian Curd Rice': { tags: ['south-indian'], cuisines: ['south-indian'], mealTimes: ['LUNCH'], dietaryTags: ['veg'], allergens: ['milk'], allergenNote: null, spiceLevel: 'MILD' },
    'Paneer Butter Masala Kati Roll': { tags: ['north-indian', 'snacks'], cuisines: ['north-indian'], mealTimes: ['ALL_DAY'], dietaryTags: ['veg'], allergens: ['milk', 'gluten'], allergenNote: null, spiceLevel: 'MILD' },
    'Crispy Onion Samosas (Plate of 2)': { tags: ['indian', 'snacks'], cuisines: ['indian'], mealTimes: ['ALL_DAY'], dietaryTags: ['veg'], allergens: ['gluten'], allergenNote: null, spiceLevel: 'MILD' },
    'Crispy Peri Peri Potato Fries': { tags: ['western', 'snacks'], cuisines: ['western'], mealTimes: ['ALL_DAY'], dietaryTags: ['veg'], allergens: [], allergenNote: null, spiceLevel: 'MEDIUM' },
    'Authentic Kumbakonam Degree Filter Coffee': { tags: ['south-indian'], cuisines: ['south-indian'], mealTimes: ['ALL_DAY'], dietaryTags: ['veg'], allergens: ['milk'], allergenNote: null, spiceLevel: 'NONE' },
    'Alphonso Mango Lassi Shake': { tags: ['indian'], cuisines: ['indian'], mealTimes: ['ALL_DAY'], dietaryTags: ['veg', 'contains-nuts'], allergens: ['milk', 'tree-nuts'], allergenNote: null, spiceLevel: 'NONE' },
    'Warm Gulab Jamun with Rabdi (2 Pcs)': { tags: ['indian', 'dessert'], cuisines: ['indian'], mealTimes: ['ALL_DAY'], dietaryTags: ['veg'], allergens: ['milk'], allergenNote: 'Gluten may be present.', spiceLevel: 'NONE' },
    'Avocado & Green Moong Sprouts Power Bowl': { tags: ['healthy'], cuisines: [], mealTimes: ['LUNCH'], dietaryTags: ['veg'], allergens: [], allergenNote: null, spiceLevel: 'MILD' },
  };

  const originalMenuItemByName = new Map(menuItemsData.map((item) => [item.name, item]));
  const originalMenuItemIdByName = new Map<string, string>();
  for (const item of menuItemsData) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) throw new Error(`Category not found for menu item "${item.name}".`);
    const current = await prisma.menuItem.findUnique({
      where: { categoryId_name: { categoryId, name: item.name } },
    });
    const metadata = legacyMetadata[item.name];
    const saved = current
      ? await prisma.menuItem.update({
          where: { id: current.id },
          data: metadata,
        })
      : await prisma.menuItem.create({
          data: {
        categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        isVegetarian: item.isVegetarian,
        isAvailable: true,
            dietaryTags: metadata.dietaryTags,
            tags: metadata.tags,
            cuisines: metadata.cuisines,
            mealTimes: metadata.mealTimes,
            allergens: metadata.allergens,
            allergenNote: metadata.allergenNote,
            spiceLevel: metadata.spiceLevel,
          },
        });
    originalMenuItemIdByName.set(item.name, saved.id);
  }

  const normalizeMenuName = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  const legacyNormalizedNames = new Set(
    [...originalMenuItemByName.keys()].map(normalizeMenuName)
  );
  const primaryCategorySlug = (categories: string[], cuisines: string[]) => {
    const normalized = categories.map((value) => value.toLowerCase());
    if (normalized.includes('breakfast')) return 'breakfast';
    if (normalized.includes('lunch') || normalized.includes('dinner')) return 'lunch';
    if (normalized.some((value) => ['snacks', 'starter', 'chaat', 'street food'].includes(value))) return 'snacks';
    if (normalized.some((value) => ['dessert', 'bakery'].includes(value))) return 'desserts';
    if (normalized.some((value) => ['hot beverages', 'cold beverages', 'juice'].includes(value))) return 'beverages';
    if (normalized.includes('non-veg') || normalized.includes('seafood')) return 'non-veg';
    if (normalized.some((value) => value.startsWith('chinese'))) return 'chinese';
    if (normalized.some((value) => value.startsWith('western')) || normalized.includes('fast food') || normalized.includes('pizza')) return 'western-fast-food';
    if (normalized.includes('north indian')) return 'north-indian-meals';
    if (normalized.includes('south indian')) return 'south-indian-breakfast';
    if (cuisines.includes('chinese')) return 'chinese';
    if (cuisines.includes('western')) return 'western-fast-food';
    return 'healthy';
  };

  let catalogueAddedCount = 0;
  let catalogueMergedCount = 0;
  const cataloguePrimaryCategoryCounts = new Map<string, number>();
  for (const item of menuCatalogue) {
    const categorySlug = primaryCategorySlug(item.categories, item.cuisines);
    const categoryId = categoryMap.get(categorySlug);
    if (!categoryId) throw new Error(`Category "${categorySlug}" not found for "${item.name}".`);

    const legacyName = CATALOGUE_LEGACY_MATCHES[item.name];
    const legacyId = legacyName ? originalMenuItemIdByName.get(legacyName) : undefined;
    if (legacyId) {
      await prisma.menuItem.update({
        where: { id: legacyId },
        data: {
          tags: item.tags,
          cuisines: item.cuisines,
          mealTimes: item.mealTimes,
          dietaryTags: item.dietaryTags,
          allergens: item.allergens,
          allergenNote: item.allergenNote,
          spiceLevel: item.spiceLevel,
        },
      });
      catalogueMergedCount++;
    } else if (!legacyNormalizedNames.has(normalizeMenuName(item.name))) {
      await prisma.menuItem.upsert({
        where: { id: `item-${item.slug}` },
        update: {
          tags: item.tags,
          cuisines: item.cuisines,
          mealTimes: item.mealTimes,
          dietaryTags: item.dietaryTags,
          allergens: item.allergens,
          allergenNote: item.allergenNote,
          spiceLevel: item.spiceLevel,
        },
        create: {
          id: `item-${item.slug}`,
          categoryId,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: `/images/menu/${item.slug}.jpg`,
          isVegetarian: !item.dietaryTags.includes('non-veg'),
          isAvailable: item.defaultAvailable,
          tags: item.tags,
          cuisines: item.cuisines,
          mealTimes: item.mealTimes,
          dietaryTags: item.dietaryTags,
          allergens: item.allergens,
          allergenNote: item.allergenNote,
          spiceLevel: item.spiceLevel,
        },
      });
      catalogueAddedCount++;
    } else {
      catalogueMergedCount++;
    }
    cataloguePrimaryCategoryCounts.set(
      categorySlug,
      (cataloguePrimaryCategoryCounts.get(categorySlug) || 0) + 1
    );
  }

  console.log(`  ✓ Catalogue items created: ${catalogueAddedCount}`);
  console.log(`  ✓ Catalogue items matched to originals: ${catalogueMergedCount}`);
  console.log('  ✓ Catalogue primary category counts:', Object.fromEntries(cataloguePrimaryCategoryCounts));

  // Verify all categories have at least one menu item
  for (const cat of categoryData) {
    const count = await prisma.menuItem.count({ where: { categoryId: categoryMap.get(cat.slug)! } });
    if (count === 0) {
      console.warn(`  ⚠ Category "${cat.name}" has NO menu items!`);
    }
  }

  // Upsert demo users (isDemo = true)
  const demoUsers = [
    { name: 'Demo Student', email: 'student@demo.com', role: 'STUDENT' as Role, institutionId: 'DEMO-STU-001', phone: '+91 98401 23456' },
    { name: 'Demo Staff', email: 'staff@demo.com', role: 'STAFF' as Role, institutionId: 'DEMO-STF-001', phone: '+91 98844 55667' },
    { name: 'Demo Admin', email: 'admin@demo.com', role: 'ADMIN' as Role, institutionId: 'DEMO-ADM-001', phone: '+91 97909 11223' },
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash,
        name: user.name,
        role: user.role,
        institutionId: user.institutionId,
        phone: user.phone,
        isActive: true,
        isDemo: true,
      },
      create: {
        ...user,
        passwordHash,
        isActive: true,
        isDemo: true,
      },
    });
    console.log(`  ✓ User: ${user.name} (${user.email})`);
  }

  // Print counts
  const userCount = await prisma.user.count();
  const categoryCount = await prisma.category.count();
  const finalMenuItemCount = await prisma.menuItem.count();
  const orderCount = await prisma.order.count();
  const orderItemCount = await prisma.orderItem.count();
  const paymentCount = await prisma.payment.count();
  const feedbackCount = await prisma.feedback.count();
  const favoriteCount = await prisma.favorite.count();

  console.log('\n📊 Seed Summary:');
  console.log(`  Users: ${userCount}`);
  console.log(`  Categories: ${categoryCount}`);
  console.log(`  MenuItems: ${finalMenuItemCount}`);
  console.log(`  Orders: ${orderCount}`);
  console.log(`  OrderItems: ${orderItemCount}`);
  console.log(`  Payments: ${paymentCount}`);
  console.log(`  Feedback: ${feedbackCount}`);
  console.log(`  Favorites: ${favoriteCount}`);
  console.log('\n🎉 Smart Canteen Database Seed Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });