import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables before validation
dotenv.config();

const FORBIDDEN_SECRET_SUBSTRINGS = [
  'REPLACE_ME',
  'change-in-production',
  'super-secret',
];

const createSecretSchema = (varName: string) =>
  z
    .string({ required_error: `${varName} is required` })
    .min(32, `${varName} must be at least 32 characters long`)
    .refine(
      (val) => !FORBIDDEN_SECRET_SUBSTRINGS.some((sub) => val.includes(sub)),
      {
        message: `${varName} contains default/insecure placeholder text`,
      }
    );

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z
    .string()
    .default('http://localhost:5173')
    .transform((val) =>
      val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL is required' })
    .min(1, 'DATABASE_URL cannot be empty'),
  JWT_SECRET: createSecretSchema('JWT_SECRET'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  AI_PROVIDER: z.enum(['mock', 'gemini']).default('mock'),
  GEMINI_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates an environment record without terminating the process.
 * Useful for unit testing.
 */
export function validateEnv(rawEnv: Record<string, any> = process.env): {
  success: boolean;
  data?: Env;
  errors?: string[];
} {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const errorKeys = Array.from(
      new Set(result.error.errors.map((e) => e.path.join('.') || 'configuration'))
    );
    return { success: false, errors: errorKeys };
  }
  return { success: true, data: result.data };
}

// Perform startup validation (only exit if not in test suite execution)
let parsedEnv: Env;
const validation = validateEnv(process.env);

if (!validation.success) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ Environment configuration validation failed:');
    validation.errors?.forEach((key) => {
      console.error(`   - Missing or invalid environment variable: ${key}`);
    });
    console.error('Exiting process due to invalid configuration.');
    process.exit(1);
  } else {
    // In test environment with missing env vars, provide minimal safe defaults for mock test runs
    parsedEnv = {
      NODE_ENV: 'test',
      PORT: 5000,
      CLIENT_URL: ['http://localhost:5173'],
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/smart_canteen_test?schema=public',
      JWT_SECRET: '0123456789abcdef0123456789abcdef0123456789abcdef',
      JWT_EXPIRES_IN: '7d',
      AI_PROVIDER: 'mock',
    };
  }
} else {
  parsedEnv = validation.data!;
}

export const env = parsedEnv;
export default env;