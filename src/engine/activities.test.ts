import { describe, expect, it } from 'vitest';
import {
  ACTIVITIES,
  DEFAULT_UNLOCKED_ACTIVITIES,
  TIER_1_ACTIVITIES,
  TIER_2_ACTIVITIES,
  TIER_3_ACTIVITIES,
  TIER_4_ACTIVITIES,
  getActivityGpHr,
} from './activities';
import type { ActivityId } from './types';

describe('ACTIVITIES — data integrity', () => {
  it('every entry has a matching id key', () => {
    for (const [key, act] of Object.entries(ACTIVITIES)) {
      expect(act.id, `key ${key}`).toBe(key);
    }
  });

  it('every activity has positive numeric balance fields', () => {
    for (const a of Object.values(ACTIVITIES)) {
      expect(a.gpPerHour, a.id).toBeGreaterThanOrEqual(0);
      expect(a.suspicionPerHour, a.id).toBeGreaterThan(0);
      expect(a.baseDetectionRatePerTick, a.id).toBeGreaterThan(0);
      expect(a.teamSize, a.id).toBeGreaterThanOrEqual(1);
      expect(a.unlockCost, a.id).toBeGreaterThanOrEqual(0);
    }
  });

  it('every activity has a tier between 1 and 4', () => {
    for (const a of Object.values(ACTIVITIES)) {
      expect([1, 2, 3, 4]).toContain(a.tier);
    }
  });

  it('Tier 1 has at least 60 activities', () => {
    expect(TIER_1_ACTIVITIES.length).toBeGreaterThanOrEqual(60);
  });

  it('all Tier 1 activities are F2P (no Members or Premium gate)', () => {
    for (const id of TIER_1_ACTIVITIES) {
      const a = ACTIVITIES[id];
      expect(a.requiresMembers, id).toBe(false);
      expect(a.requiresPremium, id).toBe(false);
    }
  });

  it('all Tier 1 activities have unlockCost = 0 (free)', () => {
    for (const id of TIER_1_ACTIVITIES) {
      expect(ACTIVITIES[id].unlockCost, id).toBe(0);
    }
  });

  it('every Tier 1 activity is in DEFAULT_UNLOCKED_ACTIVITIES', () => {
    const defaults = new Set(DEFAULT_UNLOCKED_ACTIVITIES);
    for (const id of TIER_1_ACTIVITIES) {
      expect(defaults.has(id), `${id} missing from DEFAULT_UNLOCKED_ACTIVITIES`).toBe(true);
    }
  });

  it('no Tier 2/3/4 activity is in DEFAULT_UNLOCKED_ACTIVITIES', () => {
    const defaults = new Set(DEFAULT_UNLOCKED_ACTIVITIES);
    const paid = [...TIER_2_ACTIVITIES, ...TIER_3_ACTIVITIES, ...TIER_4_ACTIVITIES];
    for (const id of paid) {
      expect(defaults.has(id), `${id} should not be in defaults`).toBe(false);
    }
  });

  it('all DEFAULT_UNLOCKED_ACTIVITIES IDs exist in ACTIVITIES', () => {
    for (const id of DEFAULT_UNLOCKED_ACTIVITIES) {
      expect(ACTIVITIES[id], `${id} missing from ACTIVITIES`).toBeDefined();
    }
  });

  it('Tier 2/3/4 still exist (regression — previous tests rely on them)', () => {
    expect(TIER_2_ACTIVITIES.length).toBeGreaterThanOrEqual(36); // phase 2b brings Tier 2 to 36
    expect(TIER_3_ACTIVITIES.length).toBeGreaterThanOrEqual(4);
    expect(TIER_4_ACTIVITIES.length).toBeGreaterThanOrEqual(2);
    // Anchor a few specific IDs the existing Playwright tests check
    expect(ACTIVITIES['nmz_afk' as ActivityId]).toBeDefined();
    expect(ACTIVITIES['green_dragons' as ActivityId]).toBeDefined();
  });

  it('all Tier 2 activities require Members', () => {
    for (const id of TIER_2_ACTIVITIES) {
      expect(ACTIVITIES[id].requiresMembers, id).toBe(true);
      expect(ACTIVITIES[id].requiresPremium, id).toBe(false);
    }
  });

  it('all Tier 2+ activities have unlockCost > 0 (so the locked-section UI shows them)', () => {
    const paid = [...TIER_2_ACTIVITIES, ...TIER_3_ACTIVITIES, ...TIER_4_ACTIVITIES];
    for (const id of paid) {
      expect(ACTIVITIES[id].unlockCost, id).toBeGreaterThan(0);
    }
  });

  it('Tier 1 GP/hr ladder spans a wide range (220 → 14000+)', () => {
    const rates = TIER_1_ACTIVITIES.map(id => ACTIVITIES[id].gpPerHour);
    expect(Math.min(...rates)).toBeLessThanOrEqual(400);
    expect(Math.max(...rates)).toBeGreaterThanOrEqual(11000);
  });

  it('getActivityGpHr returns gpPerHour * teamSize', () => {
    for (const a of Object.values(ACTIVITIES)) {
      expect(getActivityGpHr(a)).toBe(a.gpPerHour * a.teamSize);
    }
  });
});
