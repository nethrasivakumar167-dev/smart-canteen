import { env } from '../config/env';
import { availableNow, menuTimeWindowsEnabled } from '../config/menuAvailability';
import { prisma } from '../prisma';
import { formatMenuItem } from '../routes/menu.routes';
import { generateGeminiContent } from './aiService';

const CACHE_TTL_MS = 5 * 60_000;
const MAX_CACHE_ENTRIES = 300;
const MAX_REASON_LENGTH = 120;
const forbiddenReasonTerms = /\b(allergen|allergens|gluten|dairy|milk|peanut|peanuts|tree[- ]nuts|soy|sesame|egg|fish|shellfish|vegan|vegetarian|non[- ]veg|dairy[- ]free|gluten[- ]free|contains?|free[- ]from|free of|without|ingredient|safe for|suitable for|healthy|lactose|celiac|halal|kosher|plant[- ]based)\b/i;

interface Recommendation {
  item: ReturnType<typeof formatMenuItem>;
  label: 'Smart pick' | 'Popular now';
  reason: string;
}

interface CachedRecommendation {
  expiresAt: number;
  recommendations: Recommendation[];
}

const recommendationCache = new Map<string, CachedRecommendation>();

function localMealPeriod(now: Date): { day: string; period: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'CLOSED' } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));
  const period = minutes >= 7 * 60 && minutes < 12 * 60
    ? 'BREAKFAST'
    : minutes >= 12 * 60 && minutes < 16 * 60
      ? 'LUNCH'
      : minutes >= 16 * 60 && minutes < 19 * 60
        ? 'DINNER'
        : 'CLOSED';
  return { day: `${get('year')}-${get('month')}-${get('day')}`, period };
}

function fallbackReason(
  facts: { orderCount: number; isFavorite: boolean; matchesMealPeriod: boolean; isSpecial: boolean; popularity: number },
  period: string,
  noHistory: boolean
): string {
  if (noHistory) {
    if (facts.isSpecial) return "No order history yet; today's special.";
    return `No order history yet; popular ${period === 'CLOSED' ? 'today' : `for ${period.toLowerCase()}`}.`;
  }
  if (facts.orderCount > 0) return `You ordered this ${facts.orderCount} time${facts.orderCount === 1 ? '' : 's'} before.`;
  if (facts.isFavorite) return 'One of your saved favourites.';
  if (facts.isSpecial) return "Today's special.";
  if (facts.matchesMealPeriod) return `A pick for ${period.toLowerCase()}.`;
  return 'Popular with students.';
}

async function getAiRecommendations(
  candidates: Array<{ id: string; name: string; tags: string[]; reasonFacts: object }>
): Promise<Array<{ id: string; reason: string }> | null> {
  if (env.AI_PROVIDER !== 'gemini' || !env.GEMINI_API_KEY || !env.GEMINI_MODEL || candidates.length === 0) {
    return null;
  }
  const prompt = [
    'Re-rank these canteen recommendations and write a short reason for each.',
    'Return only JSON shaped as {"recommendations":[{"id":"candidate id","reason":"short reason"}]}.',
    'Use only the supplied facts. Never make dietary, allergen, ingredient, health, or availability claims.',
    'Return at most six unique candidate ids. Each reason must be at most 120 characters.',
    JSON.stringify({ candidates }),
  ].join('\n');
  const response: any = await generateGeminiContent(
    env.GEMINI_API_KEY,
    env.GEMINI_MODEL,
    [{ parts: [{ text: prompt }] }],
    true
  );
  const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') return null;

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed?.recommendations) || parsed.recommendations.length > 6) return null;
    const candidateIds = new Set(candidates.map((candidate) => candidate.id));
    const seen = new Set<string>();
    const recommendations: Array<{ id: string; reason: string }> = [];
    for (const entry of parsed.recommendations) {
      if (
        typeof entry?.id !== 'string' ||
        !candidateIds.has(entry.id) ||
        seen.has(entry.id) ||
        typeof entry.reason !== 'string' ||
        !entry.reason.trim() ||
        entry.reason.trim().length > MAX_REASON_LENGTH ||
        forbiddenReasonTerms.test(entry.reason)
      ) {
        return null;
      }
      seen.add(entry.id);
      recommendations.push({ id: entry.id, reason: entry.reason.trim() });
    }
    return recommendations.length ? recommendations : null;
  } catch {
    return null;
  }
}

export function invalidateStudentRecommendations(userId: string): void {
  for (const key of recommendationCache.keys()) {
    if (key.startsWith(`${userId}|`)) recommendationCache.delete(key);
  }
}

export async function getStudentRecommendations(userId: string, now = new Date()): Promise<Recommendation[]> {
  const { day, period } = localMealPeriod(now);
  const cacheKey = `${userId}|${day}|${period}`;
  const cached = recommendationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.recommendations;
  if (cached) recommendationCache.delete(cacheKey);

  const timeWindowsEnabled = menuTimeWindowsEnabled();
  const [menuItems, studentOrders, popularity, favorites] = await Promise.all([
    prisma.menuItem.findMany({
      where: { isAvailable: true, category: { isAvailable: true } },
      include: { category: true },
    }),
    prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: { order: { studentId: userId, orderStatus: { not: 'CANCELLED' } } },
      _count: { _all: true },
    }),
    prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: { order: { orderStatus: { not: 'CANCELLED' } } },
      _count: { _all: true },
    }),
    prisma.favorite.findMany({ where: { userId }, select: { menuItemId: true } }),
  ]);

  const orderedCounts = new Map(studentOrders.map((entry) => [entry.menuItemId, entry._count._all]));
  const popularCounts = new Map(popularity.map((entry) => [entry.menuItemId, entry._count._all]));
  const favoriteIds = new Set(favorites.map((favorite) => favorite.menuItemId));
  const noHistory = studentOrders.length === 0;

  const ranked = menuItems
    .filter((item) => timeWindowsEnabled ? availableNow(item, now) : item.isAvailable)
    .map((item) => {
      const orderCount = orderedCounts.get(item.id) || 0;
      const isFavorite = favoriteIds.has(item.id);
      const matchesMealPeriod = period !== 'CLOSED'
        && (item.mealTimes.includes('ALL_DAY') || item.mealTimes.includes(period));
      const popularityCount = popularCounts.get(item.id) || 0;
      const reasonFacts = {
        orderCount,
        isFavorite,
        matchesMealPeriod,
        isSpecial: item.isSpecial,
        popularity: popularityCount,
      };
      const score = orderCount * 10
        + Number(isFavorite) * 8
        + Number(matchesMealPeriod) * 4
        + Number(item.isSpecial) * 6
        + popularityCount / 1000;
      return {
        id: item.id,
        name: item.name,
        tags: item.tags,
        reasonFacts,
        score,
        popularityCount,
        item: formatMenuItem(item, now, timeWindowsEnabled),
        label: isFavorite || orderCount > 0 || item.isSpecial ? 'Smart pick' as const : 'Popular now' as const,
        reason: fallbackReason(reasonFacts, period, noHistory),
      };
    })
    .sort((left, right) => right.score - left.score || right.popularityCount - left.popularityCount)
    .slice(0, 6);

  const aiOrder = await getAiRecommendations(ranked.map(({ id, name, tags, reasonFacts }) => ({
    id,
    name,
    tags,
    reasonFacts,
  })));
  let recommendations: Recommendation[];
  if (aiOrder) {
    const rankedById = new Map(ranked.map((entry) => [entry.id, entry]));
    recommendations = aiOrder.map(({ id, reason }) => {
      const candidate = rankedById.get(id)!;
      return { item: candidate.item, label: candidate.label, reason };
    });
  } else {
    recommendations = ranked.map(({ item, label, reason }) => ({ item, label, reason }));
  }

  recommendationCache.set(cacheKey, { recommendations, expiresAt: Date.now() + CACHE_TTL_MS });
  while (recommendationCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = recommendationCache.keys().next().value;
    if (oldestKey === undefined) break;
    recommendationCache.delete(oldestKey);
  }
  return recommendations;
}
