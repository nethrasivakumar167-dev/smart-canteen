export const MENU_TIME_WINDOWS = {
  BREAKFAST: { start: '07:00', end: '12:00' },
  LUNCH: { start: '12:00', end: '16:00' },
  DINNER: { start: '16:00', end: '19:00' },
} as const;

type MealTime = keyof typeof MENU_TIME_WINDOWS | 'ALL_DAY';

export interface TimeAvailableMenuItem {
  isAvailable: boolean;
  mealTimes: string[];
}

function minutesSinceMidnight(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function getKolkataMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);
  return hour * 60 + minute;
}

export function availableNow(item: TimeAvailableMenuItem, now: Date): boolean {
  if (!item.isAvailable) return false;
  const mealTimes = item.mealTimes || [];
  if (mealTimes.includes('ALL_DAY')) return true;
  const current = getKolkataMinutes(now);
  return mealTimes.some((mealTime) => {
    if (!(mealTime in MENU_TIME_WINDOWS)) return false;
    const window = MENU_TIME_WINDOWS[mealTime as MealTime & keyof typeof MENU_TIME_WINDOWS];
    return current >= minutesSinceMidnight(window.start) && current < minutesSinceMidnight(window.end);
  });
}

export function unavailableReason(item: TimeAvailableMenuItem, now: Date): string | null {
  if (!item.isAvailable) return 'Disabled by staff';
  if (availableNow(item, now)) return null;
  const mealTimes = item.mealTimes || [];
  if (mealTimes.includes('ALL_DAY') || mealTimes.length === 0) return null;

  const current = getKolkataMinutes(now);
  const windows = mealTimes
    .filter((mealTime): mealTime is keyof typeof MENU_TIME_WINDOWS => mealTime in MENU_TIME_WINDOWS)
    .map((mealTime) => ({
      mealTime,
      start: minutesSinceMidnight(MENU_TIME_WINDOWS[mealTime].start),
      end: minutesSinceMidnight(MENU_TIME_WINDOWS[mealTime].end),
    }))
    .sort((left, right) => left.start - right.start);

  const nextWindow = windows.find((window) => current < window.start);
  if (nextWindow) return `Available from ${formatTime(nextWindow.start)}`;
  const previousWindow = [...windows].reverse().find((window) => current >= window.end);
  if (previousWindow) {
    return `${capitalize(previousWindow.mealTime.toLowerCase())} ends at ${formatTime(previousWindow.end)}`;
  }
  return null;
}

export function menuTimeWindowsEnabled(): boolean {
  const configured = process.env.MENU_TIME_WINDOWS;
  if (configured === undefined) return process.env.NODE_ENV !== 'test';
  if (configured.toLowerCase() === 'true') return true;
  if (configured.toLowerCase() === 'false') return false;
  throw new Error('MENU_TIME_WINDOWS must be "true" or "false".');
}

function formatTime(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
