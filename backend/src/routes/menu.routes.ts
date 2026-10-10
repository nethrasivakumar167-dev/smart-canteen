import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { availableNow, menuTimeWindowsEnabled, unavailableReason } from '../config/menuAvailability';

const router = Router();

const menuQuerySchema = z.object({
  search: z.string().optional(),
  q: z.string().optional(),
  category: z.string().optional(),
  vegetarian: z.enum(['true', 'false']).optional(),
  cuisine: z.string().optional(),
  diet: z.string().optional(),
  spice: z.string().optional(),
  availableNow: z.enum(['true', 'false']).optional(),
  availableAt: z.string().datetime({ offset: true }).optional(),
  excludeAllergens: z.string().optional(),
});

const menuItemParamSchema = z.object({
  id: z.string().trim().min(1, 'Dish ID is required.'),
});

export function formatMenuItem(item: any, now = new Date(), enforceTimeWindows = menuTimeWindowsEnabled()) {
  const priceNum = typeof item.price === 'number' ? item.price : Number(item.price);
  const isAvailableNow = enforceTimeWindows ? availableNow(item, now) : item.isAvailable;
  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    price: priceNum,
    categoryId: item.categoryId,
    categoryName: item.category?.name || '',
    category: item.category
      ? {
          id: item.category.id,
          name: item.category.name,
          slug: item.category.slug,
          description: item.category.description || '',
          isAvailable: item.category.isAvailable,
          displayOrder: item.category.displayOrder,
        }
      : undefined,
    imageUrl: item.imageUrl || '',
    isVegetarian: item.isVegetarian,
    dietaryTags: item.dietaryTags,
    tags: item.tags || [],
    cuisines: item.cuisines || [],
    mealTimes: item.mealTimes || [],
    allergens: item.allergens || [],
    allergenNote: item.allergenNote,
    spiceLevel: item.spiceLevel,
    isSpecial: item.isSpecial,
    ingredients: item.ingredients || [],
    preparationTime: item.preparationTime || 8,
    calories: item.calories || null,
    isAvailable: item.isAvailable,
    stockStatus: item.isAvailable ? 'AVAILABLE' : 'OUT_OF_STOCK',
    availableNow: isAvailableNow,
    unavailableReason: enforceTimeWindows
      ? unavailableReason(item, now)
      : item.isAvailable ? null : 'Disabled by staff',
    rating: item.rating || 4.8,
    reviewCount: item.reviewCount || 50,
    isPopular: item.isPopular ?? true,
    isChefSpecial: item.isChefSpecial ?? false,
    customizationGroups: item.customizationGroups || [],
  };
}

/**
 * @route   GET /api/menu
 * @desc    Get public active menu items with search, category filtering, and dietary filter
 * @access  Public
 */
router.get(
  ['/', '/items'],
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validatedQuery = menuQuerySchema.parse(req.query);
    const now = new Date();
    const availabilityTime = validatedQuery.availableAt ? new Date(validatedQuery.availableAt) : now;
    const enforceTimeWindows = menuTimeWindowsEnabled();
    const isCatalogueEndpoint = req.path === '/items';
    const items = await prisma.menuItem.findMany({
      where: {
        category: { isAvailable: true },
        ...(!isCatalogueEndpoint ? { isAvailable: true } : {}),
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const querySearch = (validatedQuery.q || validatedQuery.search || '').trim().toLocaleLowerCase();
    const normalize = (value: string) => value.toLocaleLowerCase().replace(/[\s_]+/g, '-').trim();
    const excludedAllergens = new Set(
      (validatedQuery.excludeAllergens || '')
        .split(',')
        .map((allergen) => allergen.trim().toLocaleLowerCase())
        .filter(Boolean)
    );
    const formatted = items
      .filter((item) => {
        if (querySearch) {
          const searchable = [
            item.name,
            item.description || '',
            item.category?.name || '',
            ...(item.tags || []),
            ...(item.cuisines || []),
          ];
          if (!searchable.some((value) => value.toLocaleLowerCase().includes(querySearch))) return false;
        }

        if (validatedQuery.category && validatedQuery.category.toLowerCase() !== 'all') {
          const wanted = normalize(validatedQuery.category);
          const primaryMatch = item.categoryId === validatedQuery.category
            || normalize(item.category?.slug || '') === wanted
            || normalize(item.category?.name || '') === wanted;
          if (!primaryMatch && !(item.tags || []).some((tag) => normalize(tag) === wanted)) return false;
        }

        if (validatedQuery.cuisine
          && !(item.cuisines || []).some((cuisine) => normalize(cuisine) === normalize(validatedQuery.cuisine!))) return false;
        if (validatedQuery.diet
          && !(item.dietaryTags || []).some((diet) => normalize(diet) === normalize(validatedQuery.diet!))) return false;
        if (validatedQuery.spice
          && normalize(item.spiceLevel || '') !== normalize(validatedQuery.spice)) return false;
        if (validatedQuery.vegetarian === 'true' && !item.isVegetarian) return false;
        if (validatedQuery.vegetarian === 'false' && item.isVegetarian) return false;
        if (excludedAllergens.size && (item.allergens || []).some((allergen) => excludedAllergens.has(allergen.toLowerCase()))) {
          return false;
        }
        const available = enforceTimeWindows ? availableNow(item, availabilityTime) : item.isAvailable;
        if (validatedQuery.availableNow === 'true' && !available) return false;
        if (validatedQuery.availableNow === 'false' && available) return false;
        return true;
      })
      .map((item) => formatMenuItem(item, availabilityTime, enforceTimeWindows));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  })
);

/**
 * @route   GET /api/menu/:id
 * @desc    Get details for a single active menu item by ID
 * @access  Public
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = menuItemParamSchema.parse(req.params);

    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!item || !item.isAvailable || !item.category || !item.category.isAvailable) {
      res.status(404).json({
        success: false,
        error: 'Dish not found or is currently unavailable.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatMenuItem(item),
    });
  })
);

export default router;
