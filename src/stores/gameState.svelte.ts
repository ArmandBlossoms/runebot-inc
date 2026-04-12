import { loadGame, saveGame, createInitialState, createNewBot, exportSave, importSave } from '../engine/save';
import { processTick, applyOfflineProgress, TICK_MS, meetsSkillRequirements, meetsAccountRequirements, getTotalLevel } from '../engine/tick';
import { computeUpgradeEffects, UPGRADES, PRESTIGE_UPGRADES } from '../engine/upgrades';
import { ACTIVITIES, DEFAULT_UNLOCKED_ACTIVITIES } from '../engine/activities';
import { formatGp } from '../engine/detection';
import type { GameState, ActivityId, UpgradeId, PrestigeUpgradeId, BotAccount } from '../engine/types';

// ─── Reactive State ──────────────────────────────────────────────────────────
let _state = $state<GameState>((() => {
  const loaded = loadGame();
  if (loaded) {
    return applyOfflineProgress(loaded);
  }
  return createInitialState();
})());

let _tickInterval: ReturnType<typeof setInterval> | null = null;
let _saveInterval: ReturnType<typeof setInterval> | null = null;

// ─── Derived Values ───────────────────────────────────────────────────────────
export const gameState = {
  get raw() { return _state; },
  get gp() { return _state.gp; },
  get prestigePoints() { return _state.prestigePoints; },
  get bots() { return _state.bots; },
  get eventLog() { return [..._state.eventLog].reverse(); }, // newest first
  get unlockedActivities() { return _state.unlockedActivities; },
  get purchasedUpgrades() { return _state.purchasedUpgrades; },
  get maxBotSlots() { return _state.maxBotSlots; },
  get totalGpPerHour() {
    return _state.bots
      .filter(b => b.status === 'active' && b.activity)
      .reduce((sum, b) => {
        const act = ACTIVITIES[b.activity!];
        const effects = computeUpgradeEffects(_state.purchasedUpgrades);
        return sum + (act?.gpPerHour ?? 0) * effects.gpRateMultiplier;
      }, 0);
  },
  get activeBotCount() { return _state.bots.filter(b => b.status === 'active').length; },
  get totalEarned() { return _state.totalEarned; },
};

// ─── Actions ─────────────────────────────────────────────────────────────────

export function assignActivity(botId: string, activityId: ActivityId | null) {
  _state = {
    ..._state,
    bots: _state.bots.map(b => {
      if (b.id !== botId) return b;
      if (!activityId) return { ...b, activity: null, status: 'idle' };
      const activity = ACTIVITIES[activityId];
      if (!activity) return b;
      if (!meetsSkillRequirements(b, activityId)) return b;
      if (!meetsAccountRequirements(b, activityId)) return b;
      return { ...b, activity: activityId, status: 'active' };
    }),
  };
}

export function collectGp(botId: string) {
  _state = {
    ..._state,
    bots: _state.bots.map(b => {
      if (b.id !== botId) return b;
      const gp = Math.floor(b.heldGp);
      return { ...b, heldGp: 0 };
    }),
    gp: _state.gp + Math.floor(_state.bots.find(b => b.id === botId)?.heldGp ?? 0),
    totalEarned: _state.totalEarned + Math.floor(_state.bots.find(b => b.id === botId)?.heldGp ?? 0),
  };
}

export function collectAllGp() {
  const total = _state.bots.reduce((sum, b) => sum + Math.floor(b.heldGp), 0);
  _state = {
    ..._state,
    gp: _state.gp + total,
    totalEarned: _state.totalEarned + total,
    bots: _state.bots.map(b => ({ ...b, heldGp: 0 })),
  };
}

export function sendBotOnBreak(botId: string) {
  const breakDuration = 15 * 60 * 1000; // 15 minutes
  _state = {
    ..._state,
    bots: _state.bots.map(b => {
      if (b.id !== botId || b.status !== 'active') return b;
      return { ...b, status: 'on_break', breakUntil: Date.now() + breakDuration };
    }),
  };
}

export function returnFromBreak(botId: string) {
  _state = {
    ..._state,
    bots: _state.bots.map(b => {
      if (b.id !== botId || b.status !== 'on_break') return b;
      return { ...b, status: b.activity ? 'active' : 'idle', breakUntil: null };
    }),
  };
}

export function dismissBannedBot(botId: string) {
  _state = {
    ..._state,
    bots: _state.bots.filter(b => b.id !== botId),
    eventLog: [..._state.eventLog, {
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
      botId, botName: _state.bots.find(b => b.id === botId)?.name ?? null,
      type: 'system' as const,
      message: 'Perma-banned bot dismissed. Slot is now available.',
    }].slice(-60),
  };
}

export function renameBot(botId: string, newName: string) {
  if (!newName.trim()) return;
  if (_state.gp < 500) return;
  _state = {
    ..._state,
    gp: _state.gp - 500,
    bots: _state.bots.map(b => b.id === botId ? { ...b, name: newName.trim() } : b),
  };
}

export function createBot() {
  if (_state.bots.length >= _state.maxBotSlots) return;
  const effects = computeUpgradeEffects(_state.purchasedUpgrades);
  const startWithMembers = _state.purchasedPrestigeUpgrades.includes('head_start') && _state.bots.length === 0;
  const bot = createNewBot(startWithMembers, effects.startingCombatBonus);
  _state = {
    ..._state,
    bots: [..._state.bots, bot],
    eventLog: [..._state.eventLog, {
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
      botId: bot.id, botName: bot.name,
      type: 'system' as const,
      message: `New bot account created: ${bot.name}. Assign it an activity.`,
    }].slice(-60),
  };
}

export function upgradeAccountTier(botId: string) {
  const bot = _state.bots.find(b => b.id === botId);
  if (!bot) return;
  const cost = bot.tier === 'f2p' ? 7000 : 18000;
  const nextTier = bot.tier === 'f2p' ? 'members' : 'premium';
  if (bot.tier === 'premium') return;
  if (_state.gp < cost) return;
  _state = {
    ..._state,
    gp: _state.gp - cost,
    bots: _state.bots.map(b => b.id === botId ? { ...b, tier: nextTier as BotAccount['tier'] } : b),
  };
}

export function sellBot(botId: string) {
  const bot = _state.bots.find(b => b.id === botId);
  if (!bot || bot.status === 'perm_banned') return;
  const totalLevel = getTotalLevel(bot);
  const combatLevel = Math.floor((bot.skills.attack + bot.skills.strength + bot.skills.defence) / 3);
  const saleGp = Math.floor(totalLevel * 150 + combatLevel * 2000);
  const salePp = Math.floor(combatLevel / 2);
  _state = {
    ..._state,
    gp: _state.gp + saleGp,
    totalEarned: _state.totalEarned + saleGp,
    prestigePoints: _state.prestigePoints + salePp,
    bots: _state.bots.filter(b => b.id !== botId),
    eventLog: [..._state.eventLog, {
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
      botId, botName: bot.name,
      type: 'sale' as const,
      message: `Account sold: ${bot.name} (Total Level ${totalLevel}). +${formatGp(saleGp)} GP, +${salePp} PP.`,
    }].slice(-60),
  };
}

export function purchaseUpgrade(upgradeId: UpgradeId) {
  if (_state.purchasedUpgrades.includes(upgradeId)) return;
  const upgrade = UPGRADES[upgradeId];
  if (!upgrade) return;
  if (_state.gp < upgrade.cost) return;
  if (upgrade.requires.some(r => !_state.purchasedUpgrades.includes(r))) return;

  const newPurchased = [..._state.purchasedUpgrades, upgradeId];
  const newEffects = computeUpgradeEffects(newPurchased);

  _state = {
    ..._state,
    gp: _state.gp - upgrade.cost,
    purchasedUpgrades: newPurchased,
    maxBotSlots: newEffects.botSlotsUnlocked,
    eventLog: [..._state.eventLog, {
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
      botId: null, botName: null,
      type: 'system' as const,
      message: `Upgrade purchased: ${upgrade.name}.`,
    }].slice(-60),
  };
}

export function purchasePrestigeUpgrade(upgradeId: PrestigeUpgradeId) {
  if (_state.purchasedPrestigeUpgrades.includes(upgradeId)) return;
  const upgrade = PRESTIGE_UPGRADES[upgradeId];
  if (!upgrade) return;
  if (_state.prestigePoints < upgrade.ppCost) return;
  _state = {
    ..._state,
    prestigePoints: _state.prestigePoints - upgrade.ppCost,
    purchasedPrestigeUpgrades: [..._state.purchasedPrestigeUpgrades, upgradeId],
  };
}

export function unlockActivity(activityId: ActivityId) {
  const activity = ACTIVITIES[activityId];
  if (!activity) return;
  if (_state.unlockedActivities.includes(activityId)) return;
  if (_state.gp < activity.unlockCost) return;
  _state = {
    ..._state,
    gp: _state.gp - activity.unlockCost,
    unlockedActivities: [..._state.unlockedActivities, activityId],
    eventLog: [..._state.eventLog, {
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
      botId: null, botName: null,
      type: 'system' as const,
      message: `Activity unlocked: ${activity.name}.`,
    }].slice(-60),
  };
}

export function getExportCode(): string {
  return exportSave(_state);
}

export function doImportSave(code: string): boolean {
  const loaded = importSave(code);
  if (!loaded) return false;
  _state = loaded;
  return true;
}

// ─── Game Loop ────────────────────────────────────────────────────────────────

export function startGameLoop() {
  if (_tickInterval) return;
  _tickInterval = setInterval(() => {
    _state = processTick(_state, Date.now());
  }, TICK_MS);

  _saveInterval = setInterval(() => {
    saveGame(_state);
  }, 30_000);

  // Save on tab close
  window.addEventListener('beforeunload', () => saveGame(_state));
}

export function stopGameLoop() {
  if (_tickInterval) { clearInterval(_tickInterval); _tickInterval = null; }
  if (_saveInterval) { clearInterval(_saveInterval); _saveInterval = null; }
}

// Helpers exposed for components
export { meetsSkillRequirements, meetsAccountRequirements, getTotalLevel, formatGp, ACTIVITIES, UPGRADES, PRESTIGE_UPGRADES };
