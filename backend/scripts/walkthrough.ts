import crypto from 'crypto';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

type JsonObject = Record<string, unknown>;

interface ApiResult {
  status: number;
  body: JsonObject | null;
}

const apiBaseUrl = (process.env.API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function report(step: string, passed: boolean, status: number): void {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${step} (HTTP ${status})`);
  if (!passed) process.exitCode = 1;
}

async function requestStep(
  step: string,
  path: string,
  options: { method?: string; token?: string; body?: JsonObject } = {},
  expectedStatus = 200
): Promise<ApiResult | null> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method || 'GET',
      headers: {
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    report(step, false, 0);
    return null;
  }

  let body: JsonObject | null = null;
  try {
    const parsed: unknown = await response.json();
    if (isObject(parsed)) body = parsed;
  } catch {
    // A non-JSON response is reported as a failed step below.
  }

  const passed = response.status === expectedStatus && body?.success === true;
  report(step, passed, response.status);
  return passed ? { status: response.status, body } : null;
}

function failStep(step: string, status: number): null {
  report(step, false, status);
  return null;
}

async function readHiddenPassword(): Promise<string> {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('DEMO_PASSWORD is unset and no interactive terminal is available.');
  }

  return new Promise((resolve, reject) => {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdout.write('Demo password (input hidden): ');

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

function readTypedOrderId(): Promise<string> {
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    prompt.question('Type the Order ID shown above to verify delivery: ', (value) => {
      prompt.close();
      resolve(value.trim());
    });
  });
}

async function main(): Promise<void> {
  const demoPassword = process.env.DEMO_PASSWORD || await readHiddenPassword();
  const uniqueId = crypto.randomUUID();
  const studentEmail = `walkthrough+${uniqueId}@example.invalid`;
  const studentPassword = crypto.randomBytes(24).toString('base64url');

  const registered = await requestStep('Register throwaway student', '/auth/register', {
    method: 'POST',
    body: {
      name: `Walkthrough ${uniqueId.slice(0, 8)}`,
      email: studentEmail,
      password: studentPassword,
    },
  }, 201);
  if (!registered) return;

  const studentLogin = await requestStep('Student login', '/auth/student/login', {
    method: 'POST',
    body: { identifier: studentEmail, password: studentPassword },
  });
  if (!studentLogin) return;
  const studentToken = studentLogin.body?.token;
  if (typeof studentToken !== 'string') {
    failStep('Read student session', studentLogin.status);
    return;
  }

  const menu = await requestStep('List menu', '/menu');
  if (!menu) return;
  const initialMenuItems = menu.body?.data;
  if (!Array.isArray(initialMenuItems) || initialMenuItems.length === 0) {
    failStep('Find menu items', menu.status);
    return;
  }

  const slots = await requestStep('List pickup slots', '/student/slots', { token: studentToken });
  if (!slots) return;
  const bookableSlots = slots.body?.data;
  if (!Array.isArray(bookableSlots)) {
    failStep('Find a bookable pickup slot', slots.status);
    return;
  }
  const slot = bookableSlots.find((entry) => isObject(entry) && entry.bookable === true);
  if (!isObject(slot) || typeof slot.start !== 'string') {
    failStep('Find a bookable pickup slot', slots.status);
    return;
  }

  const slotMenu = await requestStep(
    'Find menu items available for pickup slot',
    `/menu?availableNow=true&availableAt=${encodeURIComponent(slot.start)}`
  );
  if (!slotMenu) return;
  const slotMenuItems = slotMenu.body?.data;
  if (!Array.isArray(slotMenuItems)) {
    failStep('Find orderable menu item', slotMenu.status);
    return;
  }
  const menuItem = slotMenuItems.find((entry) =>
    isObject(entry) && typeof entry.id === 'string' && entry.isAvailable === true
  );
  if (!isObject(menuItem) || typeof menuItem.id !== 'string') {
    failStep('Find orderable menu item', slotMenu.status);
    return;
  }

  const orderResult = await requestStep('Place cash order', '/student/orders', {
    method: 'POST',
    token: studentToken,
    body: {
      items: [{ menuItemId: menuItem.id, quantity: 1 }],
      paymentMethod: 'CASH',
      pickupSlotStart: slot.start,
    },
  }, 201);
  if (!orderResult) return;
  const orderData = orderResult.body?.data;
  if (!isObject(orderData) || typeof orderData.id !== 'string') {
    failStep('Read created Order ID', orderResult.status);
    return;
  }
  const orderId = orderData.id;
  const orderNumber = typeof orderData.orderNumber === 'string' ? orderData.orderNumber : orderId;
  console.log(`Order ID for delivery: ${orderNumber}`);

  const staffLogin = await requestStep('Staff login', '/auth/staff/login', {
    method: 'POST',
    body: { identifier: 'staff@demo.com', password: demoPassword },
  });
  if (!staffLogin) return;
  const staffToken = staffLogin.body?.token;
  if (typeof staffToken !== 'string') {
    failStep('Read staff session', staffLogin.status);
    return;
  }

  for (const status of ['RECEIVED', 'PREPARING', 'READY_TO_PICK'] as const) {
    const update = await requestStep(`Set order ${status}`, `/staff/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      token: staffToken,
      body: { status },
    });
    if (!update) return;
  }

  const typedOrderId = await readTypedOrderId();
  const delivered = await requestStep('Deliver with typed Order ID', '/staff/verify-delivery', {
    method: 'POST',
    token: staffToken,
    body: { orderNumber: typedOrderId },
  });
  if (!delivered) return;

  const feedback = await requestStep(
    'Student submits feedback',
    `/student/orders/${encodeURIComponent(orderId)}/feedback`,
    {
      method: 'POST',
      token: studentToken,
      body: { rating: 5, comment: 'Walkthrough feedback.' },
    },
    201
  );
  if (!feedback) return;

  const adminLogin = await requestStep('Admin login', '/auth/admin/login', {
    method: 'POST',
    body: { identifier: 'admin@demo.com', password: demoPassword },
  });
  if (!adminLogin) return;
  const adminToken = adminLogin.body?.token;
  if (typeof adminToken !== 'string') {
    failStep('Read admin session', adminLogin.status);
    return;
  }

  await requestStep('Get admin feedback summary', '/admin/feedback/summary', { token: adminToken });
}

main()
  .catch((error: unknown) => {
    console.error(`Walkthrough stopped: ${error instanceof Error ? error.message : 'Unknown error.'}`);
    process.exitCode = 1;
  })
  .finally(() => {
    if (process.exitCode && process.exitCode !== 0) return;
    console.log('Walkthrough completed.');
  });
