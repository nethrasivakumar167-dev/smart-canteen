import { PrismaClient, Role, OrderStatus, PaymentStatus, PaymentMethod, StockStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Smart Canteen Database...');

  // 1. Clear existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.wasteRecord.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.loyaltyAccount.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 3. Create Demo Users
  const student = await prisma.user.create({
    data: {
      name: 'Nethra Sundaram',
      email: 'student@demo.com',
      passwordHash,
      phone: '+91 98401 23456',
      role: Role.STUDENT,
      institutionId: 'CS-2024-8841',
      isActive: true,
      loyaltyAccount: {
        create: {
          pointsBalance: 340,
          lifetimePoints: 520,
          tier: 'Gold',
        },
      },
    },
  });

  const faculty = await prisma.user.create({
    data: {
      name: 'Dr. S. Ramanathan',
      email: 'faculty@demo.com',
      passwordHash,
      phone: '+91 94440 87654',
      role: Role.FACULTY,
      institutionId: 'FAC-EE-104',
      isActive: true,
      loyaltyAccount: {
        create: {
          pointsBalance: 820,
          lifetimePoints: 1200,
          tier: 'Platinum',
        },
      },
    },
  });

  const staff = await prisma.user.create({
    data: {
      name: 'Murugan (Chef & Kitchen Lead)',
      email: 'staff@demo.com',
      passwordHash,
      phone: '+91 98844 55667',
      role: Role.STAFF,
      institutionId: 'STF-KIT-01',
      isActive: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: 'Ananya Sharma (General Manager)',
      email: 'admin@demo.com',
      passwordHash,
      phone: '+91 97909 11223',
      role: Role.ADMIN,
      institutionId: 'ADM-GEN-01',
      isActive: true,
    },
  });

  console.log('✅ Demo Users Seeded: Student, Faculty, Staff, Admin (Password: password123)');

  // 4. Create Categories
  const catBreakfast = await prisma.category.create({
    data: { name: 'Breakfast', slug: 'breakfast', description: 'Freshly steamed idlis, crispy dosas, and morning specials', displayOrder: 1 },
  });

  const catLunch = await prisma.category.create({
    data: { name: 'Lunch', slug: 'lunch', description: 'South Indian full meals, variety rices, and biryani bowls', displayOrder: 2 },
  });

  const catSnacks = await prisma.category.create({
    data: { name: 'Snacks & Quick Bites', slug: 'snacks', description: 'Samosas, hot rolls, cutlets, and crispy fries', displayOrder: 3 },
  });

  const catBeverages = await prisma.category.create({
    data: { name: 'Beverages', slug: 'beverages', description: 'Kumbakonam degree filter coffee, masala tea, and juices', displayOrder: 4 },
  });

  const catDesserts = await prisma.category.create({
    data: { name: 'Desserts', slug: 'desserts', description: 'Warm gulab jamuns, rabdi, and ice cream treats', displayOrder: 5 },
  });

  const catHealthy = await prisma.category.create({
    data: { name: 'Healthy & Bowls', slug: 'healthy', description: 'Sprout salads, fruit bowls, and protein shakes', displayOrder: 6 },
  });

  console.log('✅ Categories Seeded');

  // 5. Seed Menu Items
  const dosa = await prisma.menuItem.create({
    data: {
      name: 'Crispy Ghee Podi Masala Dosa',
      description: 'Golden fermented rice-lentil crepe infused with aromatic podi masala, clarified ghee, and spiced potato onion filling. Served with 3 coconut chutneys and hot sambar.',
      price: 75,
      categoryId: catBreakfast.id,
      imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      ingredients: ['Fermented Rice Batter', 'Urad Dal', 'Desi Ghee', 'Potato Masala', 'Gunpowder Podi'],
      allergens: ['Dairy (Ghee)'],
      preparationTime: 8,
      rating: 4.9,
      reviewCount: 142,
      isAvailable: true,
    },
  });

  const idliVada = await prisma.menuItem.create({
    data: {
      name: 'Steamed Rice Idli with Medu Vada (2+1)',
      description: 'Pillowy soft steamed rice cakes served with one crispy golden medu vada, accompanied by piping hot vegetable sambar and mint chutney.',
      price: 55,
      categoryId: catBreakfast.id,
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      ingredients: ['Rice', 'Urad Dal', 'Curry Leaves', 'Black Pepper'],
      allergens: [],
      preparationTime: 5,
      rating: 4.8,
      reviewCount: 98,
      isAvailable: true,
    },
  });

  const meals = await prisma.menuItem.create({
    data: {
      name: 'South Indian Executive Mini Meals',
      description: 'Wholesome campus lunch platter with Steamed Ponni Rice, Tomato Rasam, Drumstick Sambar, Vegetable Kootu, Curd, Appalam, and Sweet Kesari.',
      price: 95,
      categoryId: catLunch.id,
      imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      ingredients: ['Steamed Ponni Rice', 'Toor Dal', 'Country Vegetables', 'Curd', 'Appalam'],
      allergens: ['Dairy (Curd)'],
      preparationTime: 7,
      rating: 4.9,
      reviewCount: 230,
      isAvailable: true,
    },
  });

  const coffee = await prisma.menuItem.create({
    data: {
      name: 'Authentic Kumbakonam Degree Filter Coffee',
      description: 'Freshly decocted chicory-coffee blend frothed with thick boiling full-cream milk in traditional brass tumbler.',
      price: 30,
      categoryId: catBeverages.id,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      ingredients: ['Plantation-A Coffee Beans', 'Chicory', 'Full Cream Milk', 'Sugar'],
      allergens: ['Dairy (Milk)'],
      preparationTime: 3,
      rating: 4.9,
      reviewCount: 310,
      isAvailable: true,
    },
  });

  // 6. Create Coupons
  await prisma.coupon.createMany({
    data: [
      {
        code: 'WELCOME20',
        description: '20% Flat Discount on your first campus preorder (Up to ₹50)',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderValue: 99,
        maxDiscount: 50,
      },
      {
        code: 'CAMPUS10',
        description: '10% Instant Student discount on orders above ₹150',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderValue: 150,
        maxDiscount: 40,
      },
    ],
  });

  console.log('✅ Menu Items and Coupons Seeded');
  console.log('🎉 Smart Canteen Database Seed Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
