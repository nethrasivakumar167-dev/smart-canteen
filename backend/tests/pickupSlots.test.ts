import { describe, expect, it } from 'vitest';
import {
  formatPickupSlotLabel,
  generatePickupSlots,
  minutesUntilPickupSlot,
  pickupSlotDayBoundary,
  validatePickupSlotStart,
} from '../src/config/pickupSlots';

describe('Pickup slot scheduling', () => {
  const localTime = (time: string) => pickupSlotDayBoundary('2026-10-10', time);

  it('generates the 72 ten-minute slots in canteen hours with readable labels', () => {
    const slots = generatePickupSlots(localTime('06:00'), new Map(), false);

    expect(slots).toHaveLength(72);
    expect(slots[0].label).toBe('7:00-7:10 AM');
    expect(slots.find((slot) => slot.start.getTime() === localTime('12:10').getTime())?.label)
      .toBe('12:10-12:20 PM');
    expect(slots[71].label).toBe('6:50-7:00 PM');
  });

  it('enforces lead time and capacity in strict mode but skips time checks when disabled', () => {
    const now = localTime('10:00');
    const leadSlot = localTime('10:10');
    const fullSlot = localTime('10:30');
    const capacity = new Map([[fullSlot.getTime(), 15]]);
    const strictSlots = generatePickupSlots(now, capacity, true);
    const relaxedSlots = generatePickupSlots(now, capacity, false);

    expect(strictSlots.find((slot) => slot.start.getTime() === leadSlot.getTime())?.bookable).toBe(false);
    expect(strictSlots.find((slot) => slot.start.getTime() === fullSlot.getTime())?.unavailableReason).toBe('Full');
    expect(relaxedSlots.find((slot) => slot.start.getTime() === leadSlot.getTime())?.bookable).toBe(true);
    expect(validatePickupSlotStart(leadSlot, now, true)).toContain('at least 15 minutes');
    expect(validatePickupSlotStart(leadSlot, now, false)).toBeNull();
  });

  it('rejects past slots in strict mode and permits them when strict checks are disabled', () => {
    const now = localTime('10:20');
    const pastSlot = localTime('10:10');

    expect(validatePickupSlotStart(pastSlot, now, true)).toContain('at least 15 minutes');
    expect(validatePickupSlotStart(pastSlot, now, false)).toBeNull();
  });

  it('calculates non-negative ETA and nulls for missing slots', () => {
    const now = localTime('10:00');

    expect(minutesUntilPickupSlot(localTime('10:11'), now)).toBe(11);
    expect(minutesUntilPickupSlot(localTime('09:59'), now)).toBe(0);
    expect(minutesUntilPickupSlot(null, now)).toBeNull();
    expect(formatPickupSlotLabel(localTime('12:10'))).toBe('12:10-12:20 PM');
  });
});
