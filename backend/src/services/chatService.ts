import { env } from '../config/env';
import { availableNow, MENU_TIME_WINDOWS, unavailableReason } from '../config/menuAvailability';
import { generateGeminiContent } from './aiService';

export interface ChatMenuItem {
  id: string;
  name: string;
  category: { name: string; isAvailable: boolean } | null;
  cuisines: string[];
  mealTimes: string[];
  dietaryTags: string[];
  allergens: string[];
  allergenNote: string | null;
  spiceLevel: string | null;
  price: number | string | { toString(): string };
  isAvailable: boolean;
  isSpecial: boolean;
  imageUrl: string | null;
}

function getDietaryFilter(message: string): string[] {
  const query = normalize(message);
  const dietAliases: Record<string, string[]> = {
    vegetarian: ['veg', 'vegetarian'],
    veg: ['veg', 'vegetarian'],
    vegan: ['vegan'],
    'gluten free': ['gluten free', 'gluten-free'],
    halal: ['halal'],
    keto: ['keto'],
    healthy: ['healthy'],
  };
  const matched = Object.entries(dietAliases)
    .find(([keyword]) => new RegExp(`\\b${keyword.replace(' ', '\\s+')}\\b`, 'i').test(query));
  return matched?.[1] || [];
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface ChatResultItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
  imageUrl?: string;
}

export type ChatIntent = 'greeting' | 'specials' | 'recommendation' | 'dairy_free' | 'lunch' | 'redirect';

interface GroundedItem extends ChatResultItem {
  category: string;
  cuisines: string[];
  mealTimes: string[];
  dietaryTags: string[];
  allergens: string[];
  allergenNote: string | null;
  spiceLevel: string | null;
  isAvailable: boolean;
  isSpecial: boolean;
}

interface ChatContext {
  currentDateTime: string;
  mealPeriod: string;
  specials: GroundedItem[];
  availableItems: GroundedItem[];
  relevantItems: GroundedItem[];
}

interface RuleResult {
  intent: ChatIntent;
  reply: string;
  items: GroundedItem[];
  safetyLine?: string;
  useAI: boolean;
}

type GeminiGenerator = typeof generateGeminiContent;

const DAIRY_SAFETY_LINE = 'Please check allergens on the item page or ask the counter before ordering.';
const REDIRECT_REPLY = 'I can help with today’s canteen menu, specials, and availability.';
const UNRELATED_WORDS = /\b(weather|homework|exam|movie|politics|stock market|news|football|cricket score)\b/i;
const SAFETY_CLAIM_WORDS = /\b(allergen|allergens|dairy|milk|gluten|nut|nuts|peanut|vegan|lactose)\b/i;

function getKolkataParts(now: Date): { dateTime: string; minutes: number } {
  const dateTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(now);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);
  return { dateTime, minutes: hour * 60 + minute };
}

function getMealPeriod(minutes: number): string {
  const toMinutes = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  };
  if (minutes >= toMinutes(MENU_TIME_WINDOWS.BREAKFAST.start) && minutes < toMinutes(MENU_TIME_WINDOWS.BREAKFAST.end)) {
    return 'breakfast';
  }
  if (minutes >= toMinutes(MENU_TIME_WINDOWS.LUNCH.start) && minutes < toMinutes(MENU_TIME_WINDOWS.LUNCH.end)) {
    return 'lunch';
  }
  if (minutes >= toMinutes(MENU_TIME_WINDOWS.DINNER.start) && minutes < toMinutes(MENU_TIME_WINDOWS.DINNER.end)) {
    return 'dinner';
  }
  return 'between meal periods';
}

function toGroundedItem(item: ChatMenuItem, now: Date): GroundedItem {
  const isAvailable = item.isAvailable && item.category?.isAvailable !== false;
  const availabilityInput = { isAvailable, mealTimes: item.mealTimes || [] };
  return {
    id: item.id,
    name: item.name,
    category: item.category?.name || '',
    cuisines: item.cuisines || [],
    mealTimes: item.mealTimes || [],
    dietaryTags: item.dietaryTags || [],
    allergens: item.allergens || [],
    allergenNote: item.allergenNote || null,
    spiceLevel: item.spiceLevel || null,
    price: Number(item.price),
    isAvailable,
    isSpecial: item.isSpecial,
    available: availableNow(availabilityInput, now),
    ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
  };
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[-_]+/g, ' ').trim();
}

function isDairyFree(item: GroundedItem): boolean {
  const explicitDairyFree = [...item.dietaryTags, ...item.allergens]
    .map(normalize)
    .some((tag) => ['dairy free', 'milk free', 'no dairy', 'no milk'].includes(tag));
  const containsDairy = item.allergens.some((allergen) => {
    const value = normalize(allergen);
    return !/\b(no|free)\b/.test(value) && /\b(milk|dairy|lactose)\b/.test(value);
  });
  return explicitDairyFree && !containsDairy;
}

function getMealReason(item: GroundedItem, now: Date): string {
  if (!item.isAvailable) return 'Disabled by staff';
  const detail = unavailableReason({ isAvailable: item.isAvailable, mealTimes: item.mealTimes }, now);
  return `Outside meal window${detail ? ` - ${detail}` : ''}`;
}

function getCategoryAndCuisineMatches(message: string, items: GroundedItem[]): Set<string> {
  const normalizedMessage = normalize(message);
  const matches = new Set<string>();
  for (const item of items) {
    const values = [item.category, ...item.cuisines].filter(Boolean);
    if (values.some((value) => {
      const normalizedValue = normalize(value);
      return normalizedValue.length > 1 && normalizedMessage.includes(normalizedValue);
    })) {
      matches.add(item.category);
      item.cuisines.forEach((cuisine) => matches.add(cuisine));
    }
  }
  return matches;
}

function isGreeting(message: string): boolean {
  return /^(hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you|how are you)[!.?,\s]*$/i.test(message.trim());
}

function isCanteenQuestion(message: string, items: GroundedItem[]): boolean {
  if (UNRELATED_WORDS.test(message)) return false;
  if (/\b(canteen|menu|food|dish|dishes|eat|order|special|available|availability|recommend|suggest|breakfast|lunch|dinner|dessert|chaat|chinese|meal|price|₹|rupees?)\b/i.test(message)) {
    return true;
  }
  return getCategoryAndCuisineMatches(message, items).size > 0;
}

function buildContext(items: ChatMenuItem[], message: string, now: Date): ChatContext {
  const current = getKolkataParts(now);
  const allItems = items.map((item) => toGroundedItem(item, now));
  const lunchQuestion = /\blunch\b/i.test(message);
  const dairyQuestion = /\b(dairy|milk)[ -]?free\b/i.test(message);
  const specialQuestion = /\b(special|today'?s special|today special)\b/i.test(message);
  const availableItems = allItems.filter((item) => item.available);
  let relevantItems: GroundedItem[];

  if (dairyQuestion) {
    relevantItems = availableItems.filter((item) =>
      /\bdessert(s)?\b/i.test(item.category) && isDairyFree(item)
    );
  } else if (specialQuestion) {
    relevantItems = allItems.filter((item) => item.isSpecial);
  } else if (lunchQuestion) {
    relevantItems = allItems.filter((item) => item.mealTimes.some((meal) => normalize(meal) === 'lunch'));
  } else {
    const matches = getCategoryAndCuisineMatches(message, allItems);
    const meal = ['breakfast', 'dinner'].find((period) => new RegExp(`\\b${period}\\b`, 'i').test(message));
    const diet = getDietaryFilter(message);
    relevantItems = availableItems.filter((item) => {
      const matchesCategoryOrCuisine = matches.size === 0
        || matches.has(item.category)
        || item.cuisines.some((cuisine) => matches.has(cuisine));
      const matchesMeal = !meal || item.mealTimes.some((value) => normalize(value) === meal);
      const matchesDiet = diet.length === 0
        || item.dietaryTags.some((tag) => diet.includes(normalize(tag)));
      return matchesCategoryOrCuisine && matchesMeal && matchesDiet;
    });
  }

  return {
    currentDateTime: `${current.dateTime} (Asia/Kolkata)`,
    mealPeriod: getMealPeriod(current.minutes),
    specials: allItems.filter((item) => item.isSpecial).slice(0, 25),
    availableItems: availableItems.slice(0, 25),
    relevantItems: relevantItems.slice(0, 25),
  };
}

function runRules(message: string, context: ChatContext, now: Date): RuleResult {
  const query = message.toLowerCase();
  if (isGreeting(message)) {
    return { intent: 'greeting', reply: 'Hi! How can I help with the canteen today?', items: [], useAI: false };
  }
  if (!isCanteenQuestion(message, context.relevantItems)) {
    return { intent: 'redirect', reply: REDIRECT_REPLY, items: [], useAI: false };
  }
  if (/\b(dairy|milk)[ -]?free\b/i.test(query)) {
    const items = context.relevantItems.filter(isDairyFree);
    const reply = items.length
      ? `Dairy-free desserts available now: ${items.slice(0, 5).map((item) => item.name).join(', ')}.`
      : 'I could not confirm any dairy-free desserts available now.';
    return { intent: 'dairy_free', reply: `${reply}\n${DAIRY_SAFETY_LINE}`, items, safetyLine: DAIRY_SAFETY_LINE, useAI: true };
  }
  if (/\b(special|today'?s special|today special)\b/i.test(query)) {
    const items = context.relevantItems;
    const names = items.slice(0, 5).map((item) => item.name).join(', ');
    const reply = items.length ? `Today’s special${items.length === 1 ? ' is' : 's are'} ${names}.` : 'There are no special items listed today.';
    return { intent: 'specials', reply, items, useAI: true };
  }
  if (/\blunch\b/i.test(query)) {
    const items = context.relevantItems;
    const available = items.filter((item) => item.available);
    const unavailable = items.filter((item) => !item.available);
    const availableText = available.length ? `Available: ${available.slice(0, 4).map((item) => item.name).join(', ')}.` : 'Available: none right now.';
    const unavailableText = unavailable.length
      ? `Unavailable: ${unavailable.slice(0, 4).map((item) => `${item.name} (${getMealReason(item, now).toLowerCase()})`).join(', ')}.`
      : 'Unavailable: none.';
    return { intent: 'lunch', reply: `${availableText} ${unavailableText}`, items, useAI: true };
  }

  const items = context.relevantItems.filter((item) => item.available);
  const description = items.length ? items.slice(0, 5).map((item) => item.name).join(', ') : 'nothing matching that request right now';
  return {
    intent: 'recommendation',
    reply: items.length ? `Here are a few options: ${description}.` : `I couldn’t find ${description}.`,
    items,
    useAI: true,
  };
}

function readGeneratedReply(result: unknown): unknown {
  if (!result || typeof result !== 'object') return null;
  const candidates = (result as { candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }> }).candidates;
  return candidates?.[0]?.content?.parts?.[0]?.text;
}

async function generateFriendlyReply(
  message: string,
  history: ChatTurn[],
  context: ChatContext,
  allowedIds: Set<string>,
  generator: GeminiGenerator
): Promise<{ reply: string; itemIds: string[] } | null> {
  const prompt = [
    'You are a friendly student assistant for a campus canteen. Use only the supplied structured context.',
    'Return JSON only with exactly this shape: {"reply":"...","itemIds":["..."]}.',
    'Keep reply under 600 characters. Select only item IDs from relevantItems. Never make dietary, allergen, ingredient, or safety claims.',
    `Student message: ${message}`,
    `Recent conversation: ${JSON.stringify(history.slice(-6))}`,
    `Context: ${JSON.stringify({
      currentDateTime: context.currentDateTime,
      mealPeriod: context.mealPeriod,
      relevantItems: context.relevantItems,
    })}`,
  ].join('\n');
  try {
    const generated = await generator(env.GEMINI_API_KEY || '', env.GEMINI_MODEL || '', [{ parts: [{ text: prompt }] }], true);
    const text = readGeneratedReply(generated);
    if (typeof text !== 'string') return null;
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return null;
    const payload = parsed as { reply?: unknown; itemIds?: unknown };
    if (
      typeof payload.reply !== 'string'
      || !payload.reply.trim()
      || payload.reply.length > 600
      || !Array.isArray(payload.itemIds)
      || !payload.itemIds.every((id) => typeof id === 'string' && allowedIds.has(id))
      || SAFETY_CLAIM_WORDS.test(payload.reply)
    ) {
      return null;
    }
    return { reply: payload.reply.trim(), itemIds: [...new Set(payload.itemIds as string[])] };
  } catch {
    return null;
  }
}

export async function answerChat(
  message: string,
  history: ChatTurn[],
  menuItems: ChatMenuItem[],
  now = new Date(),
  generator: GeminiGenerator = generateGeminiContent,
  aiEnabled = env.NODE_ENV !== 'test' && env.AI_PROVIDER === 'gemini',
): Promise<{ intent: ChatIntent; reply: string; items: ChatResultItem[]; outcome: string }> {
  const context = buildContext(menuItems, message, now);
  const rules = runRules(message, context, now);
  let reply = rules.reply;
  let selectedItems = rules.items;
  let outcome = 'rule';

  if (rules.useAI && aiEnabled) {
    const allowedIds = new Set(rules.items.map((item) => item.id));
    const generated = await generateFriendlyReply(message, history, context, allowedIds, generator);
    const generatedReply = generated
      ? `${generated.reply}${rules.safetyLine ? `\n${rules.safetyLine}` : ''}`
      : '';
    if (generated && generatedReply.length <= 600) {
      reply = generatedReply;
      selectedItems = generated.itemIds
        .map((id) => rules.items.find((item) => item.id === id))
        .filter((item): item is GroundedItem => item !== undefined);
      outcome = 'ai';
    } else {
      outcome = 'fallback';
    }
  }
  if (reply.length > 600) {
    reply = rules.safetyLine
      ? `Please check allergens on the item page or ask the counter before ordering.`
      : `${reply.slice(0, 597)}...`;
  }

  return {
    intent: rules.intent,
    reply,
    items: selectedItems.map(({ id, name, price, available, imageUrl }) => ({
      id,
      name,
      price: Number(price),
      available,
      ...(imageUrl ? { imageUrl } : {}),
    })),
    outcome,
  };
}

export { DAIRY_SAFETY_LINE };
