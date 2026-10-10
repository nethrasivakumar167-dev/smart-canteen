import { z } from 'zod';
import { env } from '../config/env';
import { prisma } from '../prisma';
import { generateGeminiContent } from './aiService';

export interface FeedbackSummary {
  themes: string[];
  complaints: string[];
  recommendations: string[];
  generatedAt: string;
  source: 'ai' | 'rule';
}

const NEGATIVE_TAGS = [
  'too_spicy',
  'too_salty',
  'bland',
  'cold',
  'undercooked',
  'oily',
  'small_portion',
] as const;

const TAG_LABELS: Record<(typeof NEGATIVE_TAGS)[number], string> = {
  too_spicy: 'too spicy',
  too_salty: 'too salty',
  bland: 'bland',
  cold: 'cold',
  undercooked: 'undercooked',
  oily: 'oily',
  small_portion: 'small portions',
};

const COOKING_TIP_TEMPLATES: Record<(typeof NEGATIVE_TAGS)[number], string> = {
  too_spicy: 'Several students found this too spicy. Reduce chilli slightly.',
  too_salty: 'Several students found this too salty. Reduce the salt slightly.',
  bland: 'Several students found this bland. Adjust the seasoning slightly.',
  cold: 'Several students found this cold. Serve it hotter.',
  undercooked: 'Several students found this undercooked. Cook it a little longer.',
  oily: 'Several students found this oily. Use less oil.',
  small_portion: 'Several students found the portion small. Increase the portion slightly.',
};

const aiSummarySchema = z.object({
  themes: z.array(z.string().trim().min(1).max(160)).max(5),
  complaints: z.array(z.string().trim().min(1).max(160)).max(5),
  recommendations: z.array(z.string().trim().min(1).max(160)).max(5),
}).strict();

const summaryCache = new Map<string, FeedbackSummary>();
let refreshRequestedAt = 0;
const summaryInFlight = new Map<string, Promise<FeedbackSummary>>();

function kolkataDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function buildRuleSummary(
  feedbacks: Array<{
    rating: number;
    comment: string | null;
    createdAt: Date;
    items: Array<{ tags: string[]; menuItem: { id: string; name: string } }>;
  }>,
  now: Date
): Omit<FeedbackSummary, 'generatedAt' | 'source'> {
  const averageRating = feedbacks.length
    ? feedbacks.reduce((total, feedback) => total + feedback.rating, 0) / feedbacks.length
    : 0;
  const tagCounts = new Map<string, number>();
  const itemRatings = new Map<string, { name: string; total: number; count: number }>();

  for (const feedback of feedbacks) {
    for (const item of feedback.items) {
      const current = itemRatings.get(item.menuItem.id) || { name: item.menuItem.name, total: 0, count: 0 };
      current.total += feedback.rating;
      current.count += 1;
      itemRatings.set(item.menuItem.id, current);
      for (const tag of new Set(item.tags)) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
  }

  const frequentTags = Array.from(tagCounts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([tag, count]) => `${TAG_LABELS[tag as keyof typeof TAG_LABELS] || tag} (${count})`);
  const frequentComplaints = Array.from(tagCounts.entries())
    .filter(([tag]) => (NEGATIVE_TAGS as readonly string[]).includes(tag))
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([tag, count]) => `${TAG_LABELS[tag as keyof typeof TAG_LABELS]} (${count})`);
  const lowestRatedItems = Array.from(itemRatings.values())
    .sort((left, right) => left.total / left.count - right.total / right.count)
    .slice(0, 3)
    .map((item) => `${item.name} (${(item.total / item.count).toFixed(1)}/5)`);
  const recentCommentCount = feedbacks.filter((feedback) =>
    feedback.comment?.trim()
    && feedback.createdAt.getTime() >= now.getTime() - 7 * 24 * 60 * 60 * 1000
  ).length;

  return {
    themes: [
      `Average rating: ${averageRating.toFixed(1)}/5 across ${feedbacks.length} submission(s).`,
      frequentTags.length ? `Most frequent item feedback: ${frequentTags.join(', ')}.` : 'No item tags have been recorded yet.',
    ],
    complaints: frequentComplaints.length
      ? frequentComplaints.map((tag) => `Students reported ${tag}.`)
      : ['No recurring item complaints have been recorded.'],
    recommendations: [
      ...(lowestRatedItems.length ? [`Review preparation of: ${lowestRatedItems.join(', ')}.`] : []),
      `There are ${recentCommentCount} comment(s) in the last 7 days; review them for actionable feedback.`,
    ],
  };
}

async function generateAiSummary(
  feedbackCount: number,
  averageRating: number,
  frequentTags: Array<{ tag: string; count: number }>,
  lowestRatedItems: Array<{ name: string; averageRating: number; feedbackCount: number }>,
  recentCommentCount: number,
  ruleSummary: Omit<FeedbackSummary, 'generatedAt' | 'source'>
): Promise<Pick<FeedbackSummary, 'themes' | 'complaints' | 'recommendations'> | null> {
  if (env.AI_PROVIDER !== 'gemini' || !env.GEMINI_API_KEY || !env.GEMINI_MODEL) return null;

  const prompt = [
    'Write concise feedback themes, complaints, and actionable recommendations using only these aggregate statistics.',
    'Do not infer or mention student identities, comments, names, or emails. Return JSON with arrays named themes, complaints, recommendations.',
    JSON.stringify({ feedbackCount, averageRating, frequentTags, lowestRatedItems, recentCommentCount }),
  ].join('\n');
  let response: unknown | null;
  try {
    response = await generateGeminiContent(
      env.GEMINI_API_KEY,
      env.GEMINI_MODEL,
      [{ parts: [{ text: prompt }] }],
      true
    );
  } catch (error) {
    console.warn('[FeedbackSummary] Gemini summary failed; using rule summary:', error);
    return null;
  }
  const text = (response as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> } | null)
    ?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  try {
    const parsed = aiSummarySchema.parse(JSON.parse(text));
    const grounding = new Set([
      ...(`${ruleSummary.themes.join(' ')} ${ruleSummary.complaints.join(' ')} ${ruleSummary.recommendations.join(' ')}`
        .toLowerCase().match(/[a-z]+/g) || []),
      ...'a an and as at across address average based by can consider continue count feedback food for from focus found has have in improve item items last less maintain more most no of on or overall per portion preparation rating ratings recorded report reported review reviews several slightly student students the there these this to top use was were with'.split(' '),
    ]);
    const grounded = [...parsed.themes, ...parsed.complaints, ...parsed.recommendations]
      .every((entry) =>
        (entry.toLowerCase().match(/[a-z]+/g) || []).every((word) => grounding.has(word))
        && (entry.match(/\d+(?:\.\d+)?/g) || []).every((number) =>
          `${ruleSummary.themes.join(' ')} ${ruleSummary.complaints.join(' ')} ${ruleSummary.recommendations.join(' ')}`
            .includes(number)
        )
      );
    if (!grounded) {
      console.warn('[FeedbackSummary] Gemini returned unsupported claims; using rule summary.');
      return null;
    }
    return parsed;
  } catch {
    console.warn('[FeedbackSummary] Gemini returned invalid summary JSON; using rule summary.');
    return null;
  }
}

async function createFeedbackSummary(now: Date): Promise<FeedbackSummary> {
  const feedbacks = await prisma.feedback.findMany({
    select: {
      rating: true,
      comment: true,
      createdAt: true,
      studentId: true,
      items: {
        select: {
          tags: true,
          menuItem: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  const rules = buildRuleSummary(feedbacks, now);
  if (feedbacks.length === 0) {
    return { ...rules, generatedAt: now.toISOString(), source: 'rule' };
  }

  const tagCounts = new Map<string, number>();
  const itemRatings = new Map<string, { name: string; total: number; count: number }>();
  for (const feedback of feedbacks) {
    for (const item of feedback.items) {
      const current = itemRatings.get(item.menuItem.id) || { name: item.menuItem.name, total: 0, count: 0 };
      current.total += feedback.rating;
      current.count += 1;
      itemRatings.set(item.menuItem.id, current);
      for (const tag of new Set(item.tags)) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  const recentCommentCount = feedbacks.filter((feedback) =>
    feedback.comment?.trim()
    && feedback.createdAt.getTime() >= now.getTime() - 7 * 24 * 60 * 60 * 1000
  ).length;
  const ai = await generateAiSummary(
    feedbacks.length,
    feedbacks.reduce((total, feedback) => total + feedback.rating, 0) / feedbacks.length,
    Array.from(tagCounts, ([tag, count]) => ({ tag, count })),
    Array.from(itemRatings.values()).map((item) => ({
      name: item.name,
      averageRating: Number((item.total / item.count).toFixed(1)),
      feedbackCount: item.count,
    })),
    recentCommentCount,
    rules
  );
  return {
    ...(ai || rules),
    generatedAt: now.toISOString(),
    source: ai ? 'ai' : 'rule',
  };
}

export async function getFeedbackSummary(
  refresh = false,
  now = new Date()
): Promise<FeedbackSummary | null> {
  const dateKey = kolkataDateKey(now);
  if (refresh) {
    if (now.getTime() - refreshRequestedAt < 5 * 60 * 1000) return null;
    refreshRequestedAt = now.getTime();
  } else {
    const cached = summaryCache.get(dateKey);
    if (cached) return cached;
    const inFlight = summaryInFlight.get(dateKey);
    if (inFlight) return inFlight;
  }

  const pending = createFeedbackSummary(now);
  summaryInFlight.set(dateKey, pending);
  try {
    const summary = await pending;
    summaryCache.set(dateKey, summary);
    return summary;
  } finally {
    summaryInFlight.delete(dateKey);
  }
}

export async function recomputeCookingTips(menuItemIds?: string[]): Promise<number> {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const menuItems = await prisma.menuItem.findMany({
    where: menuItemIds ? { id: { in: menuItemIds } } : undefined,
    select: { id: true, cookingTip: true },
  });
  if (menuItems.length === 0) return 0;

  const itemIds = menuItems.map((item) => item.id);
  const feedbackItems = await prisma.feedbackItem.findMany({
    where: {
      menuItemId: { in: itemIds },
      feedback: { createdAt: { gte: since } },
    },
    select: {
      menuItemId: true,
      tags: true,
      feedback: { select: { studentId: true } },
    },
  });
  const studentIdsByTag = new Map<string, Map<(typeof NEGATIVE_TAGS)[number], Set<string>>>();
  for (const feedbackItem of feedbackItems) {
    const studentsByTag = studentIdsByTag.get(feedbackItem.menuItemId)
      || new Map<(typeof NEGATIVE_TAGS)[number], Set<string>>();
    for (const tag of new Set(feedbackItem.tags)) {
      if ((NEGATIVE_TAGS as readonly string[]).includes(tag)) {
        const negativeTag = tag as (typeof NEGATIVE_TAGS)[number];
        const students = studentsByTag.get(negativeTag) || new Set<string>();
        students.add(feedbackItem.feedback.studentId);
        studentsByTag.set(negativeTag, students);
      }
    }
    studentIdsByTag.set(feedbackItem.menuItemId, studentsByTag);
  }

  let changed = 0;
  for (const item of menuItems) {
    const studentsByTag: Map<(typeof NEGATIVE_TAGS)[number], Set<string>> = studentIdsByTag.get(item.id)
      || new Map<(typeof NEGATIVE_TAGS)[number], Set<string>>();
    const rankedTags = Array.from(studentsByTag.entries())
      .filter(([, students]) => students.size >= 2)
      .sort((left, right) => right[1].size - left[1].size || NEGATIVE_TAGS.indexOf(left[0]) - NEGATIVE_TAGS.indexOf(right[0]));
    const dominant = rankedTags[0];
    let tip: string | null = null;
    if (dominant) {
      tip = await rewordCookingTip(COOKING_TIP_TEMPLATES[dominant[0]]);
    }
    if (item.cookingTip !== tip || (tip === null && item.cookingTip !== null)) {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { cookingTip: tip, cookingTipUpdatedAt: tip ? new Date() : null },
      });
      changed += 1;
    }
  }
  return changed;
}

async function rewordCookingTip(template: string): Promise<string> {
  if (env.AI_PROVIDER !== 'gemini' || !env.GEMINI_API_KEY || !env.GEMINI_MODEL) return template;

  let response: unknown | null;
  try {
    response = await generateGeminiContent(
      env.GEMINI_API_KEY,
      env.GEMINI_MODEL,
      [{ parts: [{ text: `Reword this cooking tip as one short sentence without adding facts or health/allergen claims. Return only the sentence, no more than 140 characters:\n${template}` }] }]
    );
  } catch (error) {
    console.warn('[CookingTips] Gemini rewording failed; using fixed template:', error);
    return template;
  }
  const text = (response as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> } | null)
    ?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text || text.length > 140 || /[\r\n]/.test(text)) return template;
  const sentenceEndings = text.match(/[.!?](?:["')\]]*)?(?=\s|$)/g) || [];
  if (sentenceEndings.length !== 1 || !/[.!?]["')\]]?$/.test(text)) return template;
  if (/\b(allerg(?:y|ies|en)|intoleran\w*|health|healthy|safe|medical|nutrition|gluten|dairy|lactose|celiac|diabet\w*)\b/i.test(text)) {
    return template;
  }
  return text;
}

export function resetFeedbackInsightStateForTests(): void {
  summaryCache.clear();
  summaryInFlight.clear();
  refreshRequestedAt = 0;
}
