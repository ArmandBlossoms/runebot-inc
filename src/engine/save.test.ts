import { describe, expect, it } from 'vitest';
import { importSave, exportSave } from './save';
import { DEFAULT_UNLOCKED_ACTIVITIES } from './activities';
import type { GameState } from './types';

function buildLegacySave(): Partial<GameState> {
  // Simulates a save written before the Tier 1 expansion: only the original 4 unlocks.
  const now = Date.now();
  return {
    version: 1,
    gp: 1000,
    prestigePoints: 0,
    totalEarned: 1000,
    prestige: 0,
    bots: [],
    maxBotSlots: 1,
    unlockedActivities: ['wc_oaks', 'fish_lobsters', 'mine_iron', 'combat_cows'],
    purchasedUpgrades: [],
    purchasedPrestigeUpgrades: [],
    eventLog: [],
    lastSaveTime: now,
    lastTickTime: now,
    tutorialStep: 0,
    membersMonthlyBilling: now + 600000,
  };
}

describe('save migration — Tier 1 unlock backfill', () => {
  it('legacy saves gain all new free Tier 1 activities', () => {
    const legacy = buildLegacySave();
    const encoded = btoa(JSON.stringify(legacy));
    const restored = importSave(encoded);

    expect(restored).not.toBeNull();
    const unlocked = new Set(restored!.unlockedActivities);

    // Original 4 are still present
    expect(unlocked.has('wc_oaks')).toBe(true);
    expect(unlocked.has('fish_lobsters')).toBe(true);
    expect(unlocked.has('mine_iron')).toBe(true);
    expect(unlocked.has('combat_cows')).toBe(true);

    // New Tier 1 activities are now also present
    expect(unlocked.has('combat_chickens')).toBe(true);
    expect(unlocked.has('rc_air_runes')).toBe(true);
    expect(unlocked.has('smith_iron_bars')).toBe(true);
    expect(unlocked.has('mine_runite_wilderness')).toBe(true);
    expect(unlocked.has('tan_cowhides')).toBe(true);

    // Every default-unlocked activity is present
    for (const id of DEFAULT_UNLOCKED_ACTIVITIES) {
      expect(unlocked.has(id), `${id} missing after migration`).toBe(true);
    }
  });

  it('previously-purchased Tier 2 unlocks survive migration', () => {
    const legacy = buildLegacySave();
    legacy.unlockedActivities = [...legacy.unlockedActivities!, 'green_dragons', 'nmz_afk'];
    const restored = importSave(btoa(JSON.stringify(legacy)));

    const unlocked = new Set(restored!.unlockedActivities);
    expect(unlocked.has('green_dragons')).toBe(true);
    expect(unlocked.has('nmz_afk')).toBe(true);
  });

  it('export/import round-trips without losing data', () => {
    const legacy = buildLegacySave() as GameState;
    const encoded = exportSave(legacy);
    const restored = importSave(encoded);

    expect(restored).not.toBeNull();
    expect(restored!.gp).toBe(1000);
  });
});
