import type { GameState, BotAccount, ActivityId, SkillName, EventLogEntry } from './types';
import { ACTIVITIES } from './activities';
import { computeUpgradeEffects } from './upgrades';
import {
  getDetectionChancePerTick,
  rollDetection,
  getDetectionOutcome,
  applyDetectionOutcome,
} from './detection';

export const TICK_MS = 6000; // 6 seconds per tick
export const OFFLINE_EFFICIENCY = 0.75; // 75% efficiency while offline
export const MAX_OFFLINE_TICKS = (72 * 3600) / 6; // 72 hours cap
export const MEMBERS_COST_PER_MONTH = 7000; // GP
export const PREMIUM_COST_PER_MONTH = 18000; // GP
export const BILLING_INTERVAL_MS = 10 * 60 * 1000; // 10 min in-game = 1 "month"

// XP table: returns level from XP
const XP_TABLE = (() => {
  const table: number[] = [0];
  for (let lvl = 1; lvl <= 99; lvl++) {
    const prev = table[lvl - 1];
    const points = Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
    table[lvl] = prev + Math.floor(points / 4);
  }
  return table;
})();

const XP_PER_LEVEL: number[] = XP_TABLE; // cumulative XP needed for each level

export function xpToLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i <= 99; i++) {
    if (XP_PER_LEVEL[i] <= xp) level = i;
    else break;
  }
  return level;
}

export function levelToXp(level: number): number {
  return XP_PER_LEVEL[Math.max(0, level - 1)] ?? 0;
}

// Returns total level of a bot
export function getTotalLevel(bot: BotAccount): number {
  return Object.values(bot.skills).reduce((sum, lvl) => sum + lvl, 0);
}

// Skill requirements check
export function meetsSkillRequirements(bot: BotAccount, activityId: ActivityId): boolean {
  const activity = ACTIVITIES[activityId];
  for (const [skill, req] of Object.entries(activity.skillRequirements)) {
    if ((bot.skills[skill as SkillName] ?? 1) < (req as number)) return false;
  }
  return true;
}

// Check if account tier allows activity
export function meetsAccountRequirements(bot: BotAccount, activityId: ActivityId): boolean {
  const activity = ACTIVITIES[activityId];
  if (activity.requiresPremium && bot.tier !== 'premium') return false;
  if (activity.requiresMembers && bot.tier === 'f2p') return false;
  return true;
}

function makeEventId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function addEvent(state: GameState, entry: Omit<EventLogEntry, 'id'>): void {
  const log = [...state.eventLog, { ...entry, id: makeEventId() }];
  state.eventLog = log.slice(-60); // keep last 60 events
}

// Process a single bot for one tick
function processBotTick(
  bot: BotAccount,
  state: GameState,
  effects: ReturnType<typeof computeUpgradeEffects>,
  prestigeEffects: { suspicionRateReduction: number; xpMultiplier: number },
  now: number,
  isOffline: boolean,
): { bot: BotAccount; events: Omit<EventLogEntry, 'id'>[] } {
  const events: Omit<EventLogEntry, 'id'>[] = [];
  let b = { ...bot, skills: { ...bot.skills } };

  // Lift temp ban if expired
  if (b.status === 'temp_banned') {
    if (b.bannedUntil && now >= b.bannedUntil) {
      b.status = 'idle';
      b.bannedUntil = null;
      events.push({
        timestamp: now, botId: b.id, botName: b.name,
        type: 'system' as const,
        message: `Temp ban expired. Bot is back online.`,
      });
    } else {
      return { bot: b, events };
    }
  }

  // Skip perm banned, idle, or on-break bots
  if (b.status === 'perm_banned' || b.status === 'idle') return { bot: b, events };

  if (b.status === 'on_break') {
    // Reduce suspicion while on break
    const tickHours = TICK_MS / 3_600_000;
    const reduction = (effects.suspicionReductionPerHour || 15) * tickHours;
    b.suspicion = Math.max(0, b.suspicion - reduction);
    // Auto-return from break if suspicion low enough
    if (b.breakUntil && now >= b.breakUntil) {
      b.status = 'idle'; // player needs to re-assign or will stay idle
      b.breakUntil = null;
    }
    return { bot: b, events };
  }

  // Active bot with an activity
  if (!b.activity) return { bot: b, events };

  const activity = ACTIVITIES[b.activity];
  if (!activity) return { bot: b, events };

  // Check requirements still met
  if (!meetsSkillRequirements(b, b.activity) || !meetsAccountRequirements(b, b.activity)) {
    b.activity = null;
    b.status = 'idle';
    events.push({
      timestamp: now, botId: b.id, botName: b.name,
      type: 'system' as const,
      message: `No longer meets requirements for activity. Switched to idle.`,
    });
    return { bot: b, events };
  }

  const tickHours = TICK_MS / 3_600_000;
  const efficiencyMult = isOffline ? (OFFLINE_EFFICIENCY + effects.offlineEfficiencyBonus) : 1.0;

  // Earn GP
  const gpEarned = activity.gpPerHour * tickHours * effects.gpRateMultiplier * efficiencyMult;
  b.heldGp += Math.floor(gpEarned);

  // Earn XP + check level-ups
  for (const [skill, xpPerHour] of Object.entries(activity.xpPerHour)) {
    const sk = skill as SkillName;
    const oldLevel = b.skills[sk];
    const xpGained = (xpPerHour as number) * tickHours * effects.xpRateMultiplier * prestigeEffects.xpMultiplier;
    // We track level directly (simplified — not full XP tracking per skill for performance)
    // Accumulate via totalXp proxy: convert xp gained to fractional level increase
    const xpForNextLevel = levelToXp(oldLevel + 1) - levelToXp(oldLevel);
    if (xpForNextLevel > 0) {
      const levelProgress = xpGained / xpForNextLevel;
      // We store levels as floats internally, display as floor
      const newRawLevel = Math.min(99, oldLevel + levelProgress);
      if (Math.floor(newRawLevel) > Math.floor(oldLevel)) {
        events.push({
          timestamp: now, botId: b.id, botName: b.name,
          type: 'level_up' as const,
          message: `Level up! ${capitalize(sk)} is now ${Math.floor(newRawLevel)}.`,
        });
      }
      b.skills[sk] = Math.min(99, newRawLevel);
    }
  }

  b.totalXp += Object.values(activity.xpPerHour).reduce((s, v) => s + (v ?? 0), 0) * tickHours;

  // Suspicion builds
  const suspicionGain = activity.suspicionPerHour * tickHours * (1 - prestigeEffects.suspicionRateReduction);
  b.suspicion = Math.min(100, b.suspicion + suspicionGain);

  // Auto-break if advanced break handler purchased
  if (effects.autoBreak && b.suspicion >= 70 && b.status === 'active') {
    b.status = 'on_break';
    b.breakUntil = now + 15 * 60 * 1000; // 15 min break
    events.push({
      timestamp: now, botId: b.id, botName: b.name,
      type: 'system' as const,
      message: `Auto-break triggered (suspicion ${Math.floor(b.suspicion)}). Taking 15 min break.`,
    });
    return { bot: b, events };
  }

  // Detection check
  const detectionChance = getDetectionChancePerTick(
    b, activity,
    effects.detectionRateMultiplier,
    prestigeEffects.suspicionRateReduction,
  );

  if (rollDetection(detectionChance)) {
    const outcome = getDetectionOutcome(b);
    const { bot: punishedBot, message } = applyDetectionOutcome(b, outcome, now);
    b = punishedBot;
    events.push({
      timestamp: now, botId: b.id, botName: b.name,
      type: 'detection' as const,
      message: `[${outcome.toUpperCase().replace('_', ' ')}] ${message}`,
    });
  }

  return { bot: b, events };
}

// Main tick function — called every 6 seconds (or many times for offline catch-up)
export function processTick(state: GameState, now: number, isOffline = false): GameState {
  const s: GameState = {
    ...state,
    bots: [...state.bots],
    eventLog: [...state.eventLog],
    purchasedPrestigeUpgrades: [...state.purchasedPrestigeUpgrades],
  };

  const effects = computeUpgradeEffects(s.purchasedUpgrades);

  // Prestige effects
  const prestigeEffects = {
    suspicionRateReduction: s.purchasedPrestigeUpgrades.includes('reduced_suspicion') ? 0.10 : 0,
    xpMultiplier: s.purchasedPrestigeUpgrades.includes('faster_training') ? 1.20 : 1.0,
  };

  const newBots: BotAccount[] = [];
  for (const bot of s.bots) {
    const { bot: updated, events } = processBotTick(bot, s, effects, prestigeEffects, now, isOffline);
    newBots.push(updated);
    for (const ev of events) {
      addEvent(s, ev);
    }
  }
  s.bots = newBots;

  // Members billing
  if (now >= s.membersMonthlyBilling) {
    let totalCost = 0;
    s.bots = s.bots.map(b => {
      if (b.tier === 'members') {
        totalCost += MEMBERS_COST_PER_MONTH;
      } else if (b.tier === 'premium') {
        totalCost += PREMIUM_COST_PER_MONTH;
      }
      return b;
    });
    if (totalCost > 0) {
      if (s.gp >= totalCost) {
        s.gp -= totalCost;
        addEvent(s, {
          timestamp: now, botId: null, botName: null,
          type: 'system' as const,
          message: `Monthly subscription renewed for ${s.bots.filter(b => b.tier !== 'f2p').length} bots. (-${totalCost.toLocaleString()} GP)`,
        });
      } else {
        // Can't afford — downgrade members bots to F2P
        s.bots = s.bots.map(b => {
          if (b.tier !== 'f2p') {
            addEvent(s, {
              timestamp: now, botId: b.id, botName: b.name,
              type: 'system' as const,
              message: `Membership lapsed — can't afford subscription. Downgraded to F2P.`,
            });
            return { ...b, tier: 'f2p' as const };
          }
          return b;
        });
      }
    }
    s.membersMonthlyBilling = now + BILLING_INTERVAL_MS;
  }

  s.lastTickTime = now;
  return s;
}

// Offline catch-up: apply multiple ticks efficiently
export function applyOfflineProgress(state: GameState): GameState {
  const now = Date.now();
  const secondsElapsed = (now - state.lastTickTime) / 1000;
  const ticksElapsed = Math.min(
    Math.floor(secondsElapsed / (TICK_MS / 1000)),
    MAX_OFFLINE_TICKS,
  );

  if (ticksElapsed < 1) return state;

  let s = state;
  // Apply in chunks to avoid excessive event spam
  const CHUNK = 100;
  for (let i = 0; i < ticksElapsed; i += CHUNK) {
    const batch = Math.min(CHUNK, ticksElapsed - i);
    for (let j = 0; j < batch; j++) {
      s = processTick(s, state.lastTickTime + (i + j) * TICK_MS, true);
    }
  }

  // Single summary event
  const hoursAway = (ticksElapsed * TICK_MS) / 3_600_000;
  const gpBefore = state.bots.reduce((sum, b) => sum + b.heldGp, 0);
  const gpAfter = s.bots.reduce((sum, b) => sum + b.heldGp, 0);
  const gpEarned = gpAfter - gpBefore;

  s = {
    ...s,
    eventLog: [
      ...s.eventLog,
      {
        id: makeEventId(),
        timestamp: now,
        botId: null, botName: null,
        type: 'system' as const,
        message: `Welcome back! ${hoursAway.toFixed(1)}h offline. ${ticksElapsed} ticks processed. +${Math.floor(gpEarned).toLocaleString()} GP earned while away.`,
      },
    ].slice(-60),
  };

  return s;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
