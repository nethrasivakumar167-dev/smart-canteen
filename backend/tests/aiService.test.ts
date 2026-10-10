import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateGeminiContent } from '../src/services/aiService';

describe('Gemini generateContent client', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns null for a 404 and logs a safe model configuration hint', async () => {
    const apiKey = 'secret-test-key';
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal('fetch', fetchMock);
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await generateGeminiContent(apiKey, 'missing-model', [{ parts: [{ text: 'prompt' }] }]);

    expect(result).toBeNull();
    expect(fetchMock.mock.calls[0][0]).not.toContain(apiKey);
    expect(fetchMock.mock.calls[0][1].headers['x-goog-api-key']).toBe(apiKey);
    expect(warning).toHaveBeenCalledWith('[Gemini] status=404 reason=model not found, check GEMINI_MODEL');
    expect(JSON.stringify(warning.mock.calls)).not.toContain(apiKey);
  });

  it('returns null after the eight-second request timeout and logs no credential', async () => {
    vi.useFakeTimers();
    const apiKey = 'another-secret-test-key';
    const fetchMock = vi.fn((_url: string, options: RequestInit) =>
      new Promise((_resolve, reject) => {
        options.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const resultPromise = generateGeminiContent(apiKey, 'model-name', [{ parts: [{ text: 'prompt' }] }]);
    await vi.advanceTimersByTimeAsync(8_000);
    const result = await resultPromise;

    expect(result).toBeNull();
    expect(warning).toHaveBeenCalledWith('[Gemini] status=timeout reason=request timed out');
    expect(JSON.stringify(warning.mock.calls)).not.toContain(apiKey);
  });

  it('returns null and logs the HTTP status when response JSON is malformed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => { throw new SyntaxError('invalid'); },
    }));
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await generateGeminiContent('private-key', 'model-name', [{ parts: [{ text: 'prompt' }] }]);

    expect(result).toBeNull();
    expect(warning).toHaveBeenCalledWith('[Gemini] status=200 reason=invalid JSON');
    expect(JSON.stringify(warning.mock.calls)).not.toContain('private-key');
  });
});
