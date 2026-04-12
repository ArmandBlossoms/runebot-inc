import type { Upgrade, UpgradeId, PrestigeUpgrade, PrestigeUpgradeId } from './types';

export const UPGRADES: Record<UpgradeId, Upgrade> = {
  // ─── Tree 1: Detection Evasion ───────────────────────────────────────────────
  vpn_t1: {
    id: 'vpn_t1', name: 'VPN Rotation T1', tree: 'evasion',
    description: 'Route bot traffic through rotating proxies. -10% base detection rate.',
    cost: 5000, requires: [],
    effect: { detectionRateMultiplier: 0.90 },
  },
  vpn_t2: {
    id: 'vpn_t2', name: 'VPN Rotation T2', tree: 'evasion',
    description: 'Premium residential proxies. Undetectable IP rotation. -20% base detection rate.',
    cost: 25000, requires: ['vpn_t1'],
    effect: { detectionRateMultiplier: 0.80 },
  },
  break_handler_basic: {
    id: 'break_handler_basic', name: 'Break Handler (Basic)', tree: 'evasion',
    description: 'Bots take scheduled breaks. Manually trigger breaks. Suspicion -15/hr while on break.',
    cost: 2000, requires: [],
    effect: { suspicionReductionPerHour: 15 },
  },
  break_handler_advanced: {
    id: 'break_handler_advanced', name: 'Break Handler (Advanced)', tree: 'evasion',
    description: 'Automated break scheduling with randomised intervals. Auto-breaks when suspicion hits 70. Suspicion -30/hr.',
    cost: 15000, requires: ['break_handler_basic'],
    effect: { suspicionReductionPerHour: 30, autoBreak: true },
  },
  human_pattern_script: {
    id: 'human_pattern_script', name: 'Human Pattern Script', tree: 'evasion',
    description: 'Randomised mouse movement and click timing. -15% detection rate.',
    cost: 30000, requires: ['vpn_t1'],
    effect: { detectionRateMultiplier: 0.85 },
  },
  mirror_client_t1: {
    id: 'mirror_client_t1', name: 'Mirror Client T1', tree: 'evasion',
    description: 'Hooks into the game client differently — Jagex anti-cheat reads clean memory. -40% detection rate.',
    cost: 50000, requires: ['vpn_t2', 'human_pattern_script'],
    effect: { detectionRateMultiplier: 0.60 },
  },
  mirror_client_t2: {
    id: 'mirror_client_t2', name: 'Mirror Client T2', tree: 'evasion',
    description: 'Military-grade obfuscation. Your bots look completely legitimate. -60% detection rate.',
    cost: 200000, requires: ['mirror_client_t1'],
    effect: { detectionRateMultiplier: 0.40 },
  },

  // ─── Tree 2: Bot Performance ─────────────────────────────────────────────────
  zulrah_script: {
    id: 'zulrah_script', name: 'Zulrah Rotation Script', tree: 'performance',
    description: 'Perfect Zulrah rotations. +30% GP/hr for all Zulrah bots.',
    cost: 50000, requires: [],
    effect: { gpRateMultiplier: 1.30 },
  },
  blast_furnace_script: {
    id: 'blast_furnace_script', name: 'Blast Furnace Script', tree: 'performance',
    description: 'Optimised BF workflow. +25% efficiency for Blast Furnace bots.',
    cost: 5000, requires: [],
    effect: { gpRateMultiplier: 1.25 },
  },
  rc_abyss_script: {
    id: 'rc_abyss_script', name: 'Abyss RC Script', tree: 'performance',
    description: 'Optimal abyss pathing. +20% RC XP/hr, -10% detection for RC activities.',
    cost: 12000, requires: [],
    effect: { xpRateMultiplier: 1.20, detectionRateMultiplier: 0.90 },
  },
  offline_efficiency_t1: {
    id: 'offline_efficiency_t1', name: 'Offline Efficiency T1', tree: 'performance',
    description: 'Bots earn 15% more GP while you\'re away.',
    cost: 15000, requires: [],
    effect: { offlineEfficiencyBonus: 0.15 },
  },
  offline_efficiency_t2: {
    id: 'offline_efficiency_t2', name: 'Offline Efficiency T2', tree: 'performance',
    description: 'Bots earn 30% more GP while you\'re away.',
    cost: 80000, requires: ['offline_efficiency_t1'],
    effect: { offlineEfficiencyBonus: 0.30 },
  },

  // ─── Tree 3: Scale ───────────────────────────────────────────────────────────
  bot_slot_2: {
    id: 'bot_slot_2', name: 'Bot Slot 2', tree: 'scale',
    description: 'Unlock a second bot account slot.',
    cost: 5000, requires: [],
    effect: { botSlotsUnlocked: 2 },
  },
  bot_slot_3: {
    id: 'bot_slot_3', name: 'Bot Slot 3', tree: 'scale',
    description: 'Unlock a third bot account slot.',
    cost: 12000, requires: ['bot_slot_2'],
    effect: { botSlotsUnlocked: 3 },
  },
  bot_slot_4: {
    id: 'bot_slot_4', name: 'Bot Slot 4', tree: 'scale',
    description: 'Four bots running simultaneously.',
    cost: 30000, requires: ['bot_slot_3'],
    effect: { botSlotsUnlocked: 4 },
  },
  bot_slot_5: {
    id: 'bot_slot_5', name: 'Bot Slot 5', tree: 'scale',
    description: 'Five bots. This is a proper operation.',
    cost: 80000, requires: ['bot_slot_4'],
    effect: { botSlotsUnlocked: 5 },
  },
  bot_slot_6: {
    id: 'bot_slot_6', name: 'Bot Slot 6', tree: 'scale',
    description: 'Six bots. You are no longer a hobbyist.',
    cost: 200000, requires: ['bot_slot_5'],
    effect: { botSlotsUnlocked: 6 },
  },
  account_pipeline: {
    id: 'account_pipeline', name: 'Account Pipeline', tree: 'scale',
    description: 'New bots start with Combat 20 pre-trained. Saves hours of early grinding.',
    cost: 500000, requires: ['bot_slot_4'],
    effect: { startingCombatBonus: 20 },
  },
  multi_activity: {
    id: 'multi_activity', name: 'Multi-Activity Bots', tree: 'scale',
    description: 'One bot can run two activities simultaneously.',
    cost: 250000, requires: ['bot_slot_5'],
    effect: { gpRateMultiplier: 1.15 }, // approximated as 15% overall throughput boost
  },
  dedicated_server: {
    id: 'dedicated_server', name: 'Dedicated Server', tree: 'scale',
    description: 'Run your own game client server. +10% all bot earnings permanently.',
    cost: 1000000, requires: ['bot_slot_6'],
    effect: { gpRateMultiplier: 1.10 },
  },
};

export const PRESTIGE_UPGRADES: Record<PrestigeUpgradeId, PrestigeUpgrade> = {
  starting_capital: {
    id: 'starting_capital', name: 'Starting Capital',
    description: 'Start each new run with 15,000 GP already in the bank.',
    ppCost: 50,
    effect: { startingGp: 15000 },
  },
  reduced_suspicion: {
    id: 'reduced_suspicion', name: 'Reduced Heat',
    description: 'All bots start with -10% suspicion gain rate. They\'ve learned from last time.',
    ppCost: 100,
    effect: { suspicionRateReduction: 0.10 },
  },
  faster_training: {
    id: 'faster_training', name: 'Optimised Scripts',
    description: 'All skill XP rates permanently +20% across all runs.',
    ppCost: 150,
    effect: { xpMultiplier: 1.20 },
  },
  head_start: {
    id: 'head_start', name: 'Head Start',
    description: 'Your first bot starts as Members. No need to grind for it.',
    ppCost: 200,
    effect: { startWithMembers: true },
  },
};

// Compute combined upgrade effects from a list of purchased upgrade IDs
export function computeUpgradeEffects(purchased: UpgradeId[]) {
  let detectionRateMultiplier = 1.0;
  let suspicionReductionPerHour = 0;
  let offlineEfficiencyBonus = 0;
  let gpRateMultiplier = 1.0;
  let xpRateMultiplier = 1.0;
  let botSlotsUnlocked = 1;
  let autoBreak = false;
  let startingCombatBonus = 0;

  for (const id of purchased) {
    const u = UPGRADES[id];
    if (!u) continue;
    const e = u.effect;
    if (e.detectionRateMultiplier) detectionRateMultiplier *= e.detectionRateMultiplier;
    if (e.suspicionReductionPerHour) suspicionReductionPerHour += e.suspicionReductionPerHour;
    if (e.offlineEfficiencyBonus) offlineEfficiencyBonus += e.offlineEfficiencyBonus;
    if (e.gpRateMultiplier) gpRateMultiplier *= e.gpRateMultiplier;
    if (e.xpRateMultiplier) xpRateMultiplier *= e.xpRateMultiplier;
    if (e.botSlotsUnlocked && e.botSlotsUnlocked > botSlotsUnlocked) botSlotsUnlocked = e.botSlotsUnlocked;
    if (e.autoBreak) autoBreak = true;
    if (e.startingCombatBonus) startingCombatBonus = Math.max(startingCombatBonus, e.startingCombatBonus);
  }

  return {
    detectionRateMultiplier,
    suspicionReductionPerHour,
    offlineEfficiencyBonus,
    gpRateMultiplier,
    xpRateMultiplier,
    botSlotsUnlocked,
    autoBreak,
    startingCombatBonus,
  };
}
