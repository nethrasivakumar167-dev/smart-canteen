import { validateEnv } from '../src/config/env';

describe('env validation', () => {
  it('should reject a short JWT_SECRET', () => {
    const result = validateEnv({
      NODE_ENV: 'development',
      PORT: '5000',
      CLIENT_URL: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test',
      JWT_SECRET: 'short', // less than 32 chars
      JWT_EXPIRES_IN: '7d',
      QR_SECRET: '0123456789abcdef0123456789abcdef0123456789abcdef',
      AI_PROVIDER: 'mock',
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('JWT_SECRET');
  });

  it('should reject JWT_SECRET with placeholder text', () => {
    const result = validateEnv({
      NODE_ENV: 'development',
      PORT: '5000',
      CLIENT_URL: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test',
      JWT_SECRET: 'REPLACE_ME_with_a_real_secret_key_32_chars',
      JWT_EXPIRES_IN: '7d',
      QR_SECRET: '0123456789abcdef0123456789abcdef0123456789abcdef',
      AI_PROVIDER: 'mock',
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('JWT_SECRET');
  });

  it('should reject short QR_SECRET', () => {
    const result = validateEnv({
      NODE_ENV: 'development',
      PORT: '5000',
      CLIENT_URL: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test',
      JWT_SECRET: '0123456789abcdef0123456789abcdef0123456789abcdef',
      JWT_EXPIRES_IN: '7d',
      QR_SECRET: 'short',
      AI_PROVIDER: 'mock',
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('QR_SECRET');
  });

  it('should accept valid environment variables', () => {
    const result = validateEnv({
      NODE_ENV: 'development',
      PORT: '5000',
      CLIENT_URL: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test',
      JWT_SECRET: '0123456789abcdef0123456789abcdef0123456789abcdef',
      JWT_EXPIRES_IN: '7d',
      QR_SECRET: '0123456789abcdef0123456789abcdef0123456789abcdef',
      AI_PROVIDER: 'mock',
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});