// ─── Core Types ───────────────────────────────────────────────────────────────

export type SkillName =
  | 'attack' | 'strength' | 'defence' | 'hitpoints' | 'prayer'
  | 'ranged' | 'magic' | 'woodcutting' | 'fishing' | 'mining'
  | 'thieving' | 'runecrafting' | 'agility' | 'smithing' | 'slayer';

export type Skills = Record<SkillName, number>; // level 1-99

export type ActivityId =
  // Tier 1 - F2P
  | 'wc_oaks' | 'wc_yews'
  | 'fish_lobsters' | 'fish_sharks'
  | 'mine_iron' | 'mine_coal'
  | 'combat_cows' | 'combat_hill_giants'
  // Tier 2 - Members
  | 'green_dragons' | 'blast_furnace' | 'nmz_afk' | 'nature_runes' | 'thieving_blackjack'
  // Tier 3 - Late game
  | 'zulrah' | 'vorkath' | 'high_alching' | 'chambers_of_xeric'
  // Tier 4 - Endgame raids
  | 'tombs_of_amascut' | 'theatre_of_blood';

export type UpgradeId =
  | 'vpn_t1' | 'vpn_t2'
  | 'break_handler_basic' | 'break_handler_advanced'
  | 'human_pattern_script' | 'mirror_client_t1' | 'mirror_client_t2'
  | 'zulrah_script' | 'blast_furnace_script' | 'rc_abyss_script'
  | 'offline_efficiency_t1' | 'offline_efficiency_t2'
  | 'bot_slot_2' | 'bot_slot_3' | 'bot_slot_4' | 'bot_slot_5' | 'bot_slot_6'
  | 'account_pipeline' | 'multi_activity' | 'dedicated_server';

export type PrestigeUpgradeId =
  | 'starting_capital' | 'reduced_suspicion' | 'faster_training' | 'head_start';

export type BotStatus = 'idle' | 'active' | 'on_break' | 'temp_banned' | 'perm_banned';

export type DetectionOutcome =
  | 'warning' | 'stat_drain' | 'gp_seized' | 'temp_ban' | 'perm_ban' | 'rollback';

export type AccountTier = 'f2p' | 'members' | 'premium';

export interface BotAccount {
  id: string;
  name: string;
  tier: AccountTier;
  status: BotStatus;
  skills: Skills;
  suspicion: number;           // 0–100
  activity: ActivityId | null;
  heldGp: number;              // uncollected GP from activity
  bannedUntil: number | null;  // timestamp ms, for temp bans
  totalXp: number;
  detectionCount: number;
  breakUntil: number | null;   // timestamp ms
  createdAt: number;
}

export interface Activity {
  id: ActivityId;
  name: string;
  tier: 1 | 2 | 3 | 4;
  requiresMembers: boolean;
  requiresPremium: boolean;
  skillRequirements: Partial<Skills>;
  gpPerHour: number;
  suspicionPerHour: number;
  baseDetectionRatePerTick: number; // % per 6s tick
  xpPerHour: Partial<Skills>;
  unlockCost: number;           // one-time GP cost
  unlockDescription: string;
  teamSize: number;             // 1 for solo, >1 for raids
  flavorText: string;
}

export interface Upgrade {
  id: UpgradeId;
  name: string;
  description: string;
  cost: number;
  tree: 'evasion' | 'performance' | 'scale';
  requires: UpgradeId[];
  effect: UpgradeEffect;
}

export interface UpgradeEffect {
  detectionRateMultiplier?: number;   // multiplied (e.g. 0.9 = -10%)
  suspicionReductionPerHour?: number; // added per bot per hour
  offlineEfficiencyBonus?: number;    // added (e.g. 0.15 = +15%)
  gpRateMultiplier?: number;          // multiplied
  xpRateMultiplier?: number;          // multiplied
  botSlotsUnlocked?: number;          // absolute new max
  autoBreak?: boolean;
  startingCombatBonus?: number;
}

export interface PrestigeUpgrade {
  id: PrestigeUpgradeId;
  name: string;
  description: string;
  ppCost: number;
  effect: {
    startingGp?: number;
    suspicionRateReduction?: number;
    xpMultiplier?: number;
    startWithMembers?: boolean;
  };
}

export interface EventLogEntry {
  id: string;
  timestamp: number;
  botId: string | null;
  botName: string | null;
  type: 'detection' | 'level_up' | 'system' | 'sale' | 'prestige';
  message: string;
}

export interface GameState {
  version: number;
  gp: number;
  prestigePoints: number;
  totalEarned: number;
  prestige: number;
  bots: BotAccount[];
  maxBotSlots: number;
  unlockedActivities: ActivityId[];
  purchasedUpgrades: UpgradeId[];
  purchasedPrestigeUpgrades: PrestigeUpgradeId[];
  eventLog: EventLogEntry[];
  lastSaveTime: number;
  lastTickTime: number;
  tutorialStep: number;
  membersMonthlyBilling: number; // ms timestamp of next billing
}
