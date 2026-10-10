import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';
import { z } from 'zod';

dotenv.config();

import { prisma } from '../src/prisma';

const adminInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  role: z.enum(['ADMIN', 'STAFF']),
  password: z.string().min(12).max(72),
});

interface AdminUserStore {
  findFirst(args: { where: { email: { equals: string; mode: 'insensitive' } } }): Promise<unknown | null>;
  create(args: {
    data: {
      name: string;
      email: string;
      passwordHash: string;
      role: 'ADMIN' | 'STAFF';
      isActive: true;
      isDemo: false;
    };
  }): Promise<{ id: string; name: string; email: string; role: string }>;
}

export async function createAdminAccount(
  input: unknown,
  userStore: AdminUserStore = prisma.user
): Promise<{ id: string; name: string; email: string; role: string }> {
  const validated = adminInputSchema.parse(input);
  const email = validated.email.toLowerCase();
  if (await userStore.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } })) {
    throw new Error('A user with this email already exists.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(validated.password, salt);
  return userStore.create({
    data: {
      name: validated.name,
      email,
      passwordHash,
      role: validated.role,
      isActive: true,
      isDemo: false,
    },
  });
}

async function readHiddenPassword(): Promise<string> {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('ADMIN_PASSWORD is unset and no interactive terminal is available.');
  }

  return new Promise((resolve, reject) => {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdout.write('Password (input hidden): ');

    let password = '';
    const restoreTerminal = () => {
      process.stdin.removeListener('keypress', onKeypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
    };
    const onKeypress = (input: string, key: readline.Key) => {
      if (key.ctrl && key.name === 'c') {
        restoreTerminal();
        reject(new Error('Password prompt cancelled.'));
      } else if (key.name === 'return' || key.name === 'enter') {
        restoreTerminal();
        resolve(password);
      } else if (key.name === 'backspace') {
        password = password.slice(0, -1);
      } else if (input && !key.ctrl && !key.meta) {
        password += input;
      }
    };

    process.stdin.on('keypress', onKeypress);
  });
}

async function main(): Promise<void> {
  const [name, email, role, ...extraArgs] = process.argv.slice(2);
  if (!name || !email || !role || extraArgs.length > 0) {
    throw new Error('Usage: npm run create-admin -- "<name>" <email> <ADMIN|STAFF>');
  }
  const password = process.env.ADMIN_PASSWORD || await readHiddenPassword();
  const user = await createAdminAccount({ name, email, role, password });
  console.log(`Created ${user.role} account ${user.email} (${user.id}).`);
}

if (require.main === module) {
  main()
    .catch((error: unknown) => {
      if (error instanceof z.ZodError) {
        const details = error.issues
          .map((issue) => `${issue.path.join('.') || 'input'}: ${issue.message}`)
          .join('; ');
        console.error(`create-admin failed: ${details}`);
      } else if (
        error instanceof Error
        && /^(Usage:|A user with this email already exists\.|ADMIN_PASSWORD is unset|Password prompt cancelled\.)/.test(error.message)
      ) {
        console.error(`create-admin failed: ${error.message}`);
      } else {
        console.error('create-admin failed because the database operation could not be completed.');
      }
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
