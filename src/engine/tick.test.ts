import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processTick, xpToLevel, levelToXp, TICK_MS } from './tick';
import type { GameState, BotAccount, Skills } from './types';

function makeSkills(overrides: Partial<Skills> = {}): Skills {
  const base: Skills = {
    attack: 1, strength: 1, defence: 1, hitpoints: 10, prayer: 1,
    ranged: 1, magic: 1, woodcutting: 1, fishing: 1, mining: 1,
    thieving: 1, runecrafting: 1, agility: 1, smithing: 1, slayer: 1,
  };
  return { ...base, ...overrides };
}

function makeBot(overrides: Partial<BotAccount> = {}): BotAccount {
  return {
    id: 'bot-1',
    name: 'TestBot',
    tier: 'f2p',
    status: 'active',
    skills: makeSkills({ woodcutting: 20 }),
    suspicion: 0,
    activity: 'wc_oaks',
    heldGp: 0,
    bannedUntil: null,
    totalXp: 0,
    detectionCount: 0,
    breakUntil: null,
    createdAt: 0,
    ...overrides,
  };
}

function makeState(bot: BotAccount): GameState {
  return {
    version: 1,
    gp: 0,
    prestigePoints: 0,
    totalEarned: 0,
    prestige: 0,
    bots: [bot],
    maxBotSlots: 1,
    unlockedActivities: ['wc_oaks'],
    purchasedUpgrades: [],
    purchasedPrestigeUpgrades: [],
    eventLog: [],
    lastSaveTime: 0,
    lastTickTime: 0,
    tutorialStep: 0,
    membersMonthlyBilling: Number.MAX_SAFE_INTEGER,
  };
}

describe('xpToLevel / levelToXp', () => {
  it('xpToLevel(0) returns 1', () => {
    expect(xpToLevel(0)).toBe(1);
  });

  it('levelToXp(1) returns 0', () => {
    expect(levelToXp(1)).toBe(0);
  });

  it('levelToXp is strictly increasing', () => {
    let prev = levelToXp(1);
    for (let lvl = 2; lvl <= 99; lvl++) {
      const cur = levelToXp(lvl);
      expect(cur).toBeGreaterThan(prev);
      prev = cur;
    }
  });
});

describe('processTick', () => {
  // Make detection rolls deterministically fail so smoke tests don't flake.
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('earns GP for an active bot with a valid activity', () => {
    const state = makeState(makeBot());
    const next = processTick(state, TICK_MS);
    expect(next.bots[0].heldGp).toBeGreaterThan(0);
    expect(next.lastTickTime).toBe(TICK_MS);
  });

  it('does not earn GP for an idle bot', () => {
    const state = makeState(makeBot({ status: 'idle', activity: null }));
    const next = processTick(state, TICK_MS);
    expect(next.bots[0].heldGp).toBe(0);
  });
});
