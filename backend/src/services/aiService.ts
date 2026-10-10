import { env } from '../config/env';

export interface FeedbackInput {
  rating: number;
  comment?: string | null;
  createdAt: Date;
}

export interface AIFeedbackSummaryProvider {
  generateSummary(feedbacks: FeedbackInput[]): Promise<string | null>;
}

export class MockAIFeedbackProvider implements AIFeedbackSummaryProvider {
  async generateSummary(feedbacks: FeedbackInput[]): Promise<string> {
    if (feedbacks.length === 0) {
      return 'No student feedback has been submitted yet to generate an AI summary.';
    }

    const ratings = feedbacks.map((f) => f.rating);
    const avgRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
    const positiveCount = ratings.filter((r) => r >= 4).length;
    const criticalCount = ratings.filter((r) => r <= 2).length;

    const comments = feedbacks.map((f) => f.comment).filter(Boolean);

    let summary = `Executive Feedback Analysis (${feedbacks.length} submissions | Average Rating: ${avgRating}/5.0):\n`;
    summary += `- Satisfaction: ${positiveCount} positive rating(s) (4-5 stars), ${criticalCount} critical rating(s) (1-2 stars).\n`;

    if (comments.length > 0) {
      summary += `- Key Student Highlights: "${comments.slice(0, 3).join('", "')}"\n`;
    } else {
      summary += `- Key Student Highlights: Overall positive experience logged by students.\n`;
    }

    summary += `- Operational Recommendation: Continue maintaining kitchen prep speed and quality standards.`;
    return summary;
  }
}

export async function generateGeminiContent(
  apiKey: string,
  model: string,
  contents: Array<{ parts: Array<{ text: string }> }>,
  jsonResponse = false
): Promise<unknown | null> {
  if (!apiKey || !model) {
    console.warn(`[Gemini] status=not_configured reason=${!apiKey ? 'API key missing' : 'GEMINI_MODEL is not configured'}`);
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  let status = 'network_error';
  try {
    const modelName = model.startsWith('models/') ? model.slice('models/'.length) : model;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents,
          ...(jsonResponse ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
        }),
        signal: controller.signal,
      }
    );
    status = String(response.status);
    if (!response.ok) {
      const reason = response.status === 404
        ? 'model not found, check GEMINI_MODEL'
        : response.status === 429
          ? 'quota'
          : 'request failed';
      console.warn(`[Gemini] status=${status} reason=${reason}`);
      return null;
    }

    try {
      return await response.json();
    } catch {
      console.warn(`[Gemini] status=${status} reason=invalid JSON`);
      return null;
    }
  } catch (error) {
    const timedOut = controller.signal.aborted;
    status = timedOut ? 'timeout' : status;
    console.warn(`[Gemini] status=${status} reason=${timedOut ? 'request timed out' : 'network error'}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export class GeminiAIFeedbackProvider implements AIFeedbackSummaryProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateSummary(feedbacks: FeedbackInput[]): Promise<string | null> {
    if (feedbacks.length === 0) {
      return 'No student feedback available for AI summary generation.';
    }

    const feedbackText = feedbacks
      .map((f, i) => `${i + 1}. Rating: ${f.rating}/5 | Comment: ${f.comment || 'No text'}`)
      .join('\n');

    const prompt = `You are an AI assistant for a campus canteen administrator. Summarize the following student dining feedback into 3 concise bullet points covering sentiment, main food/service praise or complaints, and 1 actionable recommendation:\n\n${feedbackText}`;

    const data: any = await generateGeminiContent(this.apiKey, this.model, [{ parts: [{ text: prompt }] }]);
    if (!data) return null;
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof generatedText !== 'string' || !generatedText.trim()) {
      console.warn('[Gemini] status=200 reason=invalid response');
      return null;
    }
    return generatedText.trim();
  }
}

export class FailureSafeAIService {
  private primaryProvider: AIFeedbackSummaryProvider;
  private fallbackProvider: MockAIFeedbackProvider;
  private usesGemini: boolean;

  constructor() {
    this.fallbackProvider = new MockAIFeedbackProvider();

    if (env.AI_PROVIDER === 'gemini' && env.GEMINI_API_KEY && env.GEMINI_MODEL) {
      this.primaryProvider = new GeminiAIFeedbackProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL);
      this.usesGemini = true;
    } else {
      this.primaryProvider = this.fallbackProvider;
      this.usesGemini = false;
    }
  }

  async generateFeedbackSummary(feedbacks: FeedbackInput[]): Promise<{
    summary: string;
    providerUsed: string;
    isFallback: boolean;
  }> {
    try {
      const summary = await this.primaryProvider.generateSummary(feedbacks);
      if (summary === null) {
        const fallbackSummary = await this.fallbackProvider.generateSummary(feedbacks);
        return { summary: fallbackSummary, providerUsed: 'mock', isFallback: true };
      }
      return {
        summary,
        providerUsed: this.usesGemini ? 'gemini' : 'mock',
        isFallback: false,
      };
    } catch (err: any) {
      console.warn('[AIService] Primary AI provider failed, falling back to safe local provider:', err?.message || err);
      const fallbackSummary = await this.fallbackProvider.generateSummary(feedbacks);
      return {
        summary: fallbackSummary,
        providerUsed: 'mock',
        isFallback: true,
      };
    }
  }
}

export const aiService = new FailureSafeAIService();
