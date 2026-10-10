import { vi } from 'vitest';

process.env.AI_PROVIDER = 'mock';
process.env.GEMINI_API_KEY = '';

vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network access is disabled during tests.'))));
