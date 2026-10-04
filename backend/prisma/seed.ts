import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

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
  ];

  // Upsert categories by slug
  const categoryMap = new Map<string, string>();
  for (const cat of categoryData) {
    const upserted = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { ...cat, isAvailable: true },
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
    },
    {
      name: 'Steamed Rice Idli with Medu Vada (2+1)',
      description: 'Pillowy soft steamed rice cakes served with one crispy golden medu vada, accompanied by piping hot vegetable sambar and freshly grated mint-coconut chutney.',
      price: 55,
      categorySlug: 'breakfast',
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
    },
    {
      name: 'Ghee Ven Pongal with Cashews',
      description: 'Traditional Tamil comforting rice and moong dal porridge tempered with whole black pepper, cumin seeds, fresh ginger, curry leaves, and crunchy roasted cashews.',
      price: 60,
      categorySlug: 'breakfast',
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
    },
    {
      name: 'South Indian Breakfast Combo Feast',
      description: 'The ultimate student starter pack: 1 Crispy Masala Dosa + 1 Steamed Rice Idli + 1 Medu Vada + 1 Tumbler Filter Coffee. Maximum value and satisfaction.',
      price: 125,
      categorySlug: 'breakfast',
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
    },
    // Lunch
    {
      name: 'South Indian Executive Mini Meals',
      description: 'Wholesome campus lunch platter with Steamed Ponni Rice, Tomato Rasam, Drumstick Sambar, Vegetable Kootu, Poriyal, Curd, Appalam, and Sweet Kesari.',
      price: 95,
      categorySlug: 'lunch',
      imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
    },
    {
      name: 'Hyderabadi Dum Paneer Biryani Bowl',
      description: 'Fragrant long-grain basmati rice slow-cooked on dum with marinated malai paneer cubes, saffron, caramelized onions, and royal spices. Served with creamy cucumber raita and spicy salan.',
      price: 130,
      categorySlug: 'lunch',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
    },
    {
      name: 'Tempered South Indian Curd Rice',
      description: 'Refreshing homemade thick yogurt rice seasoned with mustard seeds, curry leaves, green chilies, grated ginger, and juicy pomegranate pearls. Served with spicy mango pickle.',
      price: 60,
      categorySlug: 'lunch',
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
    },
    // Snacks & Quick Bites
    {
      name: 'Paneer Butter Masala Kati Roll',
      description: 'Flaky whole wheat paratha wrapped around succulent smoky tandoori paneer chunks, crisp bell peppers, mint chutney, and sliced pickled onions.',
      price: 90,
      categorySlug: 'snacks',
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
    },
    {
      name: 'Crispy Onion Samosas (Plate of 2)',
      description: 'Deep-fried triangular pastry stuffed with a zesty spiced onion, flattened rice, and green pea filling. Served with tangy tamarind and coriander chutney.',
      price: 35,
      categorySlug: 'snacks',
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
    },
    {
      name: 'Crispy Peri Peri Potato Fries',
      description: 'Golden, crunch-crusted potato batons tossed in our signature spicy-tangy African peri peri dust. Served with creamy garlic dip.',
      price: 65,
      categorySlug: 'snacks',
      imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
    },
    // Beverages
    {
      name: 'Authentic Kumbakonam Degree Filter Coffee',
      description: 'Freshly decocted chicory-coffee blend frothed with thick boiling full-cream milk in traditional brass davarah and tumbler. Rich, aromatic, and invigorating.',
      price: 30,
      categorySlug: 'beverages',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
    },
    {
      name: 'Alphonso Mango Lassi Shake',
      description: 'Luscious blended thick curd churned with sweet Ratnagiri Alphonso mango pulp, cardamom essence, and topped with sliced roasted pistachios.',
      price: 60,
      categorySlug: 'beverages',
      imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
    },
    // Desserts
    {
      name: 'Warm Gulab Jamun with Rabdi (2 Pcs)',
      description: 'Melt-in-mouth golden fried khoya dumplings soaked in saffron-cardamom sugar syrup, served warm over a bed of chilled thickened rabdi.',
      price: 50,
      categorySlug: 'desserts',
      imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
    },
    // Healthy & Bowls
    {
      name: 'Avocado & Green Moong Sprouts Power Bowl',
      description: 'High-protein campus wellness bowl loaded with sprouted moong, ripe buttery avocado cubes, cherry tomatoes, English cucumber, roasted pumpkin seeds, and a zesty lime vinaigrette.',
      price: 110,
      categorySlug: 'healthy',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
    },
  ];

  // Upsert menu items
  let menuItemCount = 0;
  for (const item of menuItemsData) {
    const categoryId = categoryMap.get(item.categorySlug);
    if (!categoryId) {
      console.error(`  ⚠ Category not found for slug: ${item.categorySlug}`);
      continue;
    }

    await prisma.menuItem.upsert({
      where: {
        categoryId_name: {
          categoryId,
          name: item.name,
        },
      },
      update: {
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        isVegetarian: item.isVegetarian,
        isAvailable: true,
      },
      create: {
        categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        isVegetarian: item.isVegetarian,
        isAvailable: true,
      },
    });
    menuItemCount++;
    console.log(`  ✓ MenuItem: ${item.name}`);
  }

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