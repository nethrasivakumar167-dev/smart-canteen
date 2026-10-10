import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import app from '../src/app';
import { prisma } from '../src/prisma';

describe('Public Menu & Category API', () => {
  const mockCategory1 = {
    id: 'cat-breakfast-id',
    name: 'Breakfast',
    slug: 'breakfast',
    description: 'Morning specials',
    isAvailable: true,
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { menuItems: 2 },
  };

  const mockCategory2 = {
    id: 'cat-unavailable-id',
    name: 'Discontinued Category',
    slug: 'discontinued',
    description: 'Unavailable category',
    isAvailable: false,
    displayOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { menuItems: 1 },
  };

  const mockItem1 = {
    id: 'item-dosa-1',
    categoryId: 'cat-breakfast-id',
    name: 'Crispy Ghee Podi Masala Dosa',
    description: 'Golden fermented rice-lentil crepe with podi masala.',
    price: 75.0,
    imageUrl: 'https://images.unsplash.com/dosa',
    isVegetarian: true,
    isAvailable: true,
    dietaryTags: ['veg'],
    tags: ['south-indian', 'spicy'],
    cuisines: ['south-indian'],
    mealTimes: ['BREAKFAST'],
    allergens: ['milk'],
    allergenNote: null,
    spiceLevel: 'MEDIUM',
    isSpecial: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: mockCategory1,
  };

  const mockItem2 = {
    id: 'item-idli-2',
    categoryId: 'cat-breakfast-id',
    name: 'Steamed Rice Idli',
    description: 'Pillowy soft idlis.',
    price: 55.0,
    imageUrl: 'https://images.unsplash.com/idli',
    isVegetarian: true,
    isAvailable: true,
    dietaryTags: [],
    tags: [],
    cuisines: [],
    mealTimes: [],
    allergens: [],
    allergenNote: null,
    spiceLevel: null,
    isSpecial: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: mockCategory1,
  };

  const mockUnavailableItem = {
    id: 'item-unavailable-3',
    categoryId: 'cat-breakfast-id',
    name: 'Out of Stock Dish',
    description: 'Temporarily unavailable item',
    price: 100.0,
    imageUrl: '',
    isVegetarian: true,
    isAvailable: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: mockCategory1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/categories', () => {
    it('returns available categories sorted by displayOrder', async () => {
      vi.spyOn(prisma.category, 'findMany').mockResolvedValue([mockCategory1] as any);

      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toEqual({
        id: 'cat-breakfast-id',
        name: 'Breakfast',
        slug: 'breakfast',
        description: 'Morning specials',
        isAvailable: true,
        displayOrder: 1,
        itemCount: 2,
      });
    });
  });

  describe('GET /api/menu', () => {
    it('returns public active menu items with converted numerical prices', async () => {
      vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue([mockItem1, mockItem2] as any);

      const res = await request(app).get('/api/menu');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(typeof res.body.data[0].price).toBe('number');
      expect(res.body.data[0].price).toBe(75);
      expect(res.body.data[0].categoryName).toBe('Breakfast');
      expect(res.body.data[0].stockStatus).toBe('AVAILABLE');
      expect(res.body.data[0].dietaryTags).toEqual(['veg']);
      expect(res.body.data[0].isSpecial).toBe(true);
      expect(res.body.data[0]).toMatchObject({
        tags: ['south-indian', 'spicy'],
        cuisines: ['south-indian'],
        mealTimes: ['BREAKFAST'],
        allergens: ['milk'],
        allergenNote: null,
        spiceLevel: 'MEDIUM',
      });
    });

    it('filters items by search query', async () => {
      vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue([mockItem1] as any);

      const res = await request(app).get('/api/menu?search=Dosa');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toContain('Dosa');
    });

    it('filters items by category slug', async () => {
      vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue([mockItem1, mockItem2] as any);

      const res = await request(app).get('/api/menu?category=breakfast');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('excludes unavailable items and items with unavailable category', async () => {
      vi.spyOn(prisma.menuItem, 'findMany').mockImplementation(async (args: any) => {
        const conditions = args?.where?.AND || [];
        const expectsAvailableItem = args?.where?.isAvailable === true;
        const expectsAvailableCategory = args?.where?.category?.isAvailable === true;

        if (expectsAvailableItem && expectsAvailableCategory) {
          return [mockItem1, mockItem2] as any;
        }
        return [mockItem1, mockItem2, mockUnavailableItem] as any;
      });

      const res = await request(app).get('/api/menu');

      expect(res.status).toBe(200);
      expect(res.body.data.some((item: any) => item.id === 'item-unavailable-3')).toBe(false);
    });

    it('searches names, descriptions, categories, tags, and cuisines on /items', async () => {
      vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue([mockItem1, mockItem2] as any);

      const res = await request(app).get('/api/menu/items?q=spicy');

      expect(res.status).toBe(200);
      expect(res.body.data.map((item: any) => item.id)).toEqual(['item-dosa-1']);
    });

    it('filters category by the primary category or a category tag', async () => {
      vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue([mockItem1, mockItem2] as any);

      const res = await request(app).get('/api/menu/items?category=south-indian');

      expect(res.status).toBe(200);
      expect(res.body.data.map((item: any) => item.id)).toEqual(['item-dosa-1']);
    });

    it('filters by cuisine', async () => {
      vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue([mockItem1, mockItem2] as any);

      const res = await request(app).get('/api/menu/items?cuisine=south-indian');

      expect(res.body.data.map((item: any) => item.id)).toEqual(['item-dosa-1']);
    });

    it('filters by dietary tag and spice level', async () => {
      vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue([mockItem1, mockItem2] as any);

      const res = await request(app).get('/api/menu/items?diet=veg&spice=medium');

      expect(res.body.data.map((item: any) => item.id)).toEqual(['item-dosa-1']);
    });

    it('filters out confirmed allergens case-insensitively', async () => {
      vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue([mockItem1, mockItem2] as any);

      const res = await request(app).get('/api/menu/items?excludeAllergens=MILK,GlUtEn');

      expect(res.status).toBe(200);
      expect(res.body.data.map((item: any) => item.id)).toEqual(['item-idli-2']);
    });

    it('returns manual availability reasons and supports the availableNow filter', async () => {
      const disabledItem = { ...mockItem2, isAvailable: false };
      vi.spyOn(prisma.menuItem, 'findMany').mockResolvedValue([mockItem1, disabledItem] as any);

      const res = await request(app).get('/api/menu/items?availableNow=false');

      expect(res.status).toBe(200);
      expect(res.body.data.map((item: any) => item.id)).toEqual(['item-idli-2']);
      expect(res.body.data[0].unavailableReason).toBe('Disabled by staff');
    });
  });

  describe('GET /api/menu/:id', () => {
    it('returns single dish details for valid active item', async () => {
      vi.spyOn(prisma.menuItem, 'findUnique').mockResolvedValue(mockItem1 as any);

      const res = await request(app).get('/api/menu/item-dosa-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Crispy Ghee Podi Masala Dosa');
      expect(res.body.data.price).toBe(75);
      expect(res.body.data.category.id).toBe('cat-breakfast-id');
    });

    it('returns 404 when item does not exist in DB', async () => {
      vi.spyOn(prisma.menuItem, 'findUnique').mockResolvedValue(null);

      const res = await request(app).get('/api/menu/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/not found or is currently unavailable/i);
    });

    it('returns 404 when item is unavailable or category is unavailable', async () => {
      const itemWithUnavailableCategory = {
        ...mockItem1,
        category: mockCategory2, // isAvailable: false
      };
      vi.spyOn(prisma.menuItem, 'findUnique').mockResolvedValue(itemWithUnavailableCategory as any);

      const res = await request(app).get('/api/menu/item-dosa-1');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/not found or is currently unavailable/i);
    });
  });
});
