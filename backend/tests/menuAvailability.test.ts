import { describe, expect, it } from 'vitest';
import { availableNow, MENU_TIME_WINDOWS, unavailableReason } from '../src/config/menuAvailability';

describe('menu meal-time availability', () => {
  const breakfastItem = { isAvailable: true, mealTimes: ['BREAKFAST'] };

  it('uses the Asia/Kolkata breakfast window boundaries', () => {
    expect(MENU_TIME_WINDOWS.BREAKFAST).toEqual({ start: '07:00', end: '12:00' });
    expect(availableNow(breakfastItem, new Date('2026-10-10T01:29:00.000Z'))).toBe(false);
    expect(availableNow(breakfastItem, new Date('2026-10-10T01:30:00.000Z'))).toBe(true);
    expect(availableNow(breakfastItem, new Date('2026-10-10T06:29:00.000Z'))).toBe(true);
    expect(availableNow(breakfastItem, new Date('2026-10-10T06:30:00.000Z'))).toBe(false);
  });

  it('returns window-specific availability reasons', () => {
    expect(unavailableReason(
      breakfastItem,
      new Date('2026-10-10T00:00:00.000Z')
    )).toBe('Available from 7:00 AM');
    expect(unavailableReason(
      breakfastItem,
      new Date('2026-10-10T06:30:00.000Z')
    )).toBe('Breakfast ends at 12:00 PM');
  });

  it('keeps the staff availability switch authoritative', () => {
    const disabledItem = { isAvailable: false, mealTimes: ['ALL_DAY'] };
    expect(availableNow(disabledItem, new Date('2026-10-10T04:00:00.000Z'))).toBe(false);
    expect(unavailableReason(disabledItem, new Date('2026-10-10T04:00:00.000Z'))).toBe('Disabled by staff');
  });
});
