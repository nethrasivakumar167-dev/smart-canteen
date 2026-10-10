export const PICKUP_SLOT_CONFIG = {
  CANTEEN_OPEN: '07:00',
  CANTEEN_CLOSE: '19:00',
  SLOT_MINUTES: 10,
  MIN_LEAD_MINUTES: 15,
  SLOT_CAPACITY: 15,
  TIMEZONE: 'Asia/Kolkata',
} as const;

export interface PickupSlot {
  start: Date;
  end: Date;
  label: string;
  remainingCapacity: number;
  bookable: boolean;
  unavailableReason: 'Full' | 'Past' | 'Inside minimum lead time' | null;
}

const minutesOfDay = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

function zonedDateTimeToUtc(date: string, minuteOfDay: number): Date {
  const [year, month, day] = date.split('-').map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, minuteOfDay));
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: PICKUP_SLOT_CONFIG.TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(utcGuess);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const actualAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  const desiredAsUtc = Date.UTC(year, month - 1, day, 0, minuteOfDay);
  return new Date(utcGuess.getTime() + desiredAsUtc - actualAsUtc);
}

export function pickupSlotDateAtMinute(date: string, minuteOfDay: number): Date {
  return zonedDateTimeToUtc(date, minuteOfDay);
}

export function pickupSlotDayBoundary(date: string, time: string): Date {
  return zonedDateTimeToUtc(date, minutesOfDay(time));
}

export function kolkataDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PICKUP_SLOT_CONFIG.TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function pickupSlotStrictEnabled(): boolean {
  const configured = process.env.PICKUP_SLOT_STRICT;
  if (configured === undefined) return true;
  if (configured.toLowerCase() === 'true') return true;
  if (configured.toLowerCase() === 'false') return false;
  throw new Error('PICKUP_SLOT_STRICT must be "true" or "false".');
}

function formatLocalTime(date: Date, includePeriod = true): { value: string; period: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PICKUP_SLOT_CONFIG.TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === 'hour')?.value || '';
  const minute = parts.find((part) => part.type === 'minute')?.value || '00';
  const period = (parts.find((part) => part.type === 'dayPeriod')?.value || '').toUpperCase();
  return { value: `${hour}:${minute}${includePeriod ? ` ${period}` : ''}`, period };
}

export function formatPickupSlotLabel(start: Date): string {
  const end = new Date(start.getTime() + PICKUP_SLOT_CONFIG.SLOT_MINUTES * 60_000);
  const startTime = formatLocalTime(start, false);
  const endTime = formatLocalTime(end, true);
  const startPeriod = formatLocalTime(start).period;
  const startLabel = startPeriod === endTime.period ? startTime.value : `${startTime.value} ${startPeriod}`;
  return `${startLabel}-${endTime.value}`;
}

export function generatePickupSlots(
  now: Date,
  usedCapacityByStart: ReadonlyMap<number, number> = new Map(),
  strict = pickupSlotStrictEnabled()
): PickupSlot[] {
  const dateKey = kolkataDateKey(now);
  const open = minutesOfDay(PICKUP_SLOT_CONFIG.CANTEEN_OPEN);
  const close = minutesOfDay(PICKUP_SLOT_CONFIG.CANTEEN_CLOSE);
  const nowMs = now.getTime();
  const minimumStart = nowMs + PICKUP_SLOT_CONFIG.MIN_LEAD_MINUTES * 60_000;
  const slots: PickupSlot[] = [];

  for (let minute = open; minute < close; minute += PICKUP_SLOT_CONFIG.SLOT_MINUTES) {
    const start = zonedDateTimeToUtc(dateKey, minute);
    const end = new Date(start.getTime() + PICKUP_SLOT_CONFIG.SLOT_MINUTES * 60_000);
    const used = usedCapacityByStart.get(start.getTime()) || 0;
    const remainingCapacity = Math.max(0, PICKUP_SLOT_CONFIG.SLOT_CAPACITY - used);
    const inLeadTime = start.getTime() < minimumStart;
    const past = start.getTime() <= nowMs;
    slots.push({
      start,
      end,
      label: formatPickupSlotLabel(start),
      remainingCapacity,
      bookable: remainingCapacity > 0 && (!strict || !inLeadTime),
      unavailableReason: remainingCapacity === 0
        ? 'Full'
        : strict && past
          ? 'Past'
          : strict && inLeadTime
            ? 'Inside minimum lead time'
            : null,
    });
  }
  return slots;
}

export function validatePickupSlotStart(
  slotStart: Date,
  now: Date,
  strict = pickupSlotStrictEnabled()
): string | null {
  if (Number.isNaN(slotStart.getTime())) return 'Pickup slot is invalid.';
  if (kolkataDateKey(slotStart) !== kolkataDateKey(now)) return 'Pickup slots must be for today.';

  const dateKey = kolkataDateKey(slotStart);
  const startMinute = (() => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: PICKUP_SLOT_CONFIG.TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(slotStart);
    return Number(parts.find((part) => part.type === 'hour')?.value) * 60
      + Number(parts.find((part) => part.type === 'minute')?.value);
  })();
  const open = minutesOfDay(PICKUP_SLOT_CONFIG.CANTEEN_OPEN);
  const close = minutesOfDay(PICKUP_SLOT_CONFIG.CANTEEN_CLOSE);
  if (
    startMinute < open ||
    startMinute >= close ||
    startMinute % PICKUP_SLOT_CONFIG.SLOT_MINUTES !== 0 ||
    slotStart.getTime() !== zonedDateTimeToUtc(dateKey, startMinute).getTime()
  ) {
    return 'Pickup slot must be within canteen hours and start on a 10-minute boundary.';
  }
  if (strict && slotStart.getTime() < now.getTime() + PICKUP_SLOT_CONFIG.MIN_LEAD_MINUTES * 60_000) {
    return 'Pickup slot must be at least 15 minutes from now.';
  }
  return null;
}

export function minutesUntilPickupSlot(slotStart: Date | null | undefined, now = new Date()): number | null {
  if (!slotStart) return null;
  return Math.max(0, Math.ceil((slotStart.getTime() - now.getTime()) / 60_000));
}
