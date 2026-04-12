import type { Activity, ActivityId } from './types';

export const ACTIVITIES: Record<ActivityId, Activity> = {
  // ─── Tier 1 — F2P ───────────────────────────────────────────────────────────
  wc_oaks: {
    id: 'wc_oaks', name: 'Woodcutting — Oak Trees', tier: 1,
    requiresMembers: false, requiresPremium: false,
    skillRequirements: { woodcutting: 15 },
    gpPerHour: 1800, suspicionPerHour: 1.2,
    baseDetectionRatePerTick: 0.0005,
    xpPerHour: { woodcutting: 22000 },
    unlockCost: 0, teamSize: 1,
    unlockDescription: 'Available from the start.',
    flavorText: 'Slow but safe. Oaks near the bank. Very human-looking... probably.',
  },
  wc_yews: {
    id: 'wc_yews', name: 'Woodcutting — Yew Trees', tier: 1,
    requiresMembers: false, requiresPremium: false,
    skillRequirements: { woodcutting: 60 },
    gpPerHour: 8500, suspicionPerHour: 1.8,
    baseDetectionRatePerTick: 0.0008,
    xpPerHour: { woodcutting: 65000 },
    unlockCost: 0, teamSize: 1,
    unlockDescription: 'Requires Woodcutting 60.',
    flavorText: 'The classic F2P bot spot. Jagex has seen a million of these.',
  },
  fish_lobsters: {
    id: 'fish_lobsters', name: 'Fishing — Lobsters', tier: 1,
    requiresMembers: false, requiresPremium: false,
    skillRequirements: { fishing: 40 },
    gpPerHour: 7000, suspicionPerHour: 1.5,
    baseDetectionRatePerTick: 0.0006,
    xpPerHour: { fishing: 30000 },
    unlockCost: 0, teamSize: 1,
    unlockDescription: 'Requires Fishing 40.',
    flavorText: 'Karamja dock bots. A tale as old as time.',
  },
  fish_sharks: {
    id: 'fish_sharks', name: 'Fishing — Sharks', tier: 1,
    requiresMembers: false, requiresPremium: false,
    skillRequirements: { fishing: 76 },
    gpPerHour: 11000, suspicionPerHour: 2.0,
    baseDetectionRatePerTick: 0.0010,
    xpPerHour: { fishing: 30000 },
    unlockCost: 0, teamSize: 1,
    unlockDescription: 'Requires Fishing 76.',
    flavorText: 'Higher value, higher risk. Worth it if your break handler is good.',
  },
  mine_iron: {
    id: 'mine_iron', name: 'Mining — Iron Ore', tier: 1,
    requiresMembers: false, requiresPremium: false,
    skillRequirements: { mining: 15 },
    gpPerHour: 3200, suspicionPerHour: 1.6,
    baseDetectionRatePerTick: 0.0007,
    xpPerHour: { mining: 40000 },
    unlockCost: 0, teamSize: 1,
    unlockDescription: 'Requires Mining 15.',
    flavorText: '3 rocks. Power mine. Repeat. The bot is indistinguishable from a real player.',
  },
  mine_coal: {
    id: 'mine_coal', name: 'Mining — Coal', tier: 1,
    requiresMembers: false, requiresPremium: false,
    skillRequirements: { mining: 30 },
    gpPerHour: 4800, suspicionPerHour: 1.8,
    baseDetectionRatePerTick: 0.0009,
    xpPerHour: { mining: 22000 },
    unlockCost: 0, teamSize: 1,
    unlockDescription: 'Requires Mining 30.',
    flavorText: 'Dwarven mines are always full of bots. Yours will fit right in.',
  },
  combat_cows: {
    id: 'combat_cows', name: 'Combat — Cows', tier: 1,
    requiresMembers: false, requiresPremium: false,
    skillRequirements: { attack: 1 },
    gpPerHour: 600, suspicionPerHour: 1.4,
    baseDetectionRatePerTick: 0.0006,
    xpPerHour: { attack: 3000, strength: 3000, defence: 2000 },
    unlockCost: 0, teamSize: 1,
    unlockDescription: 'Available from the start. Hides + bones.',
    flavorText: 'Every account starts here. Even the non-bots.',
  },
  combat_hill_giants: {
    id: 'combat_hill_giants', name: 'Combat — Hill Giants', tier: 1,
    requiresMembers: false, requiresPremium: false,
    skillRequirements: { attack: 40, strength: 40, defence: 40 },
    gpPerHour: 9000, suspicionPerHour: 2.0,
    baseDetectionRatePerTick: 0.0010,
    xpPerHour: { attack: 8000, strength: 8000, defence: 6000 },
    unlockCost: 0, teamSize: 1,
    unlockDescription: 'Requires Combat 40+.',
    flavorText: 'Big bones + limpwurt roots. Real money. Real risk.',
  },

  // ─── Tier 2 — Members ───────────────────────────────────────────────────────
  green_dragons: {
    id: 'green_dragons', name: 'Green Dragon Farming', tier: 2,
    requiresMembers: true, requiresPremium: false,
    skillRequirements: { attack: 70, strength: 70, defence: 70 },
    gpPerHour: 35000, suspicionPerHour: 3.8,
    baseDetectionRatePerTick: 0.0018,
    xpPerHour: { attack: 15000, strength: 15000, defence: 15000 },
    unlockCost: 15000, teamSize: 1,
    unlockDescription: 'Requires Members + Combat 70+. Auto-purchases Anti-Dragon Shield.',
    flavorText: 'Wilderness dragons. PKers are the least of your problems.',
  },
  blast_furnace: {
    id: 'blast_furnace', name: 'Blast Furnace — Steel Bars', tier: 2,
    requiresMembers: true, requiresPremium: false,
    skillRequirements: { smithing: 30 },
    gpPerHour: 28000, suspicionPerHour: 3.2,
    baseDetectionRatePerTick: 0.0015,
    xpPerHour: { smithing: 55000 },
    unlockCost: 20000, teamSize: 1,
    unlockDescription: 'Requires Members + Smithing 30. Blast Furnace Script recommended.',
    flavorText: 'The Blast Furnace minigame. Your bot looks suspicious because it never talks.',
  },
  nmz_afk: {
    id: 'nmz_afk', name: 'Nightmare Zone — AFK Melee', tier: 2,
    requiresMembers: true, requiresPremium: false,
    skillRequirements: { attack: 75, strength: 75, defence: 75 },
    gpPerHour: 20000, suspicionPerHour: 2.8,
    baseDetectionRatePerTick: 0.0012,
    xpPerHour: { attack: 25000, strength: 25000, defence: 25000 },
    unlockCost: 8000, teamSize: 1,
    unlockDescription: 'Requires Members + Combat 75+ + NMZ Access (8,000 GP one-time).',
    flavorText: 'AFK training paradise. Your bot sits in a corner absorbing hits. Natural.',
  },
  nature_runes: {
    id: 'nature_runes', name: 'Nature Rune Crafting', tier: 2,
    requiresMembers: true, requiresPremium: false,
    skillRequirements: { runecrafting: 44 },
    gpPerHour: 25000, suspicionPerHour: 3.5,
    baseDetectionRatePerTick: 0.0016,
    xpPerHour: { runecrafting: 28000 },
    unlockCost: 12000, teamSize: 1,
    unlockDescription: 'Requires Members + Runecrafting 44.',
    flavorText: 'Abyss running. High traffic area. Try not to stand out.',
  },
  thieving_blackjack: {
    id: 'thieving_blackjack', name: 'Thieving — Blackjacking', tier: 2,
    requiresMembers: true, requiresPremium: false,
    skillRequirements: { thieving: 65 },
    gpPerHour: 40000, suspicionPerHour: 4.5,
    baseDetectionRatePerTick: 0.0022,
    xpPerHour: { thieving: 200000 },
    unlockCost: 18000, teamSize: 1,
    unlockDescription: 'Requires Members + Thieving 65. High XP, high suspicion.',
    flavorText: 'Blackjacking bandits in Pollnivneach. The click pattern is... robotic.',
  },

  // ─── Tier 3 — Late Game ─────────────────────────────────────────────────────
  zulrah: {
    id: 'zulrah', name: 'Zulrah', tier: 3,
    requiresMembers: true, requiresPremium: false,
    skillRequirements: { magic: 75, ranged: 75, hitpoints: 70 },
    gpPerHour: 120000, suspicionPerHour: 6.0,
    baseDetectionRatePerTick: 0.0035,
    xpPerHour: { magic: 30000, ranged: 20000 },
    unlockCost: 50000, teamSize: 1,
    unlockDescription: 'Requires Members + Magic 75 + Ranged 75. Zulrah Script highly recommended.',
    flavorText: 'The snake boss that prints gold. Jagex has a special detector for Zulrah bots.',
  },
  vorkath: {
    id: 'vorkath', name: 'Vorkath', tier: 3,
    requiresMembers: true, requiresPremium: true,
    skillRequirements: { ranged: 85, hitpoints: 80, magic: 65 },
    gpPerHour: 160000, suspicionPerHour: 6.5,
    baseDetectionRatePerTick: 0.0040,
    xpPerHour: { ranged: 35000 },
    unlockCost: 75000, teamSize: 1,
    unlockDescription: 'Requires Premium Members + Ranged 85. The best single-target gold farm.',
    flavorText: 'After Recipe for Disaster. Your bot somehow completed all the quests. Interesting.',
  },
  high_alching: {
    id: 'high_alching', name: 'High Alchemy', tier: 3,
    requiresMembers: true, requiresPremium: false,
    skillRequirements: { magic: 55 },
    gpPerHour: 45000, suspicionPerHour: 4.0,
    baseDetectionRatePerTick: 0.0020,
    xpPerHour: { magic: 78000 },
    unlockCost: 30000, teamSize: 1,
    unlockDescription: 'Requires Members + Magic 55. Low risk, consistent gold.',
    flavorText: 'Click. Alch. Click. Alch. One click per 3 seconds for hours. Very human.',
  },
  chambers_of_xeric: {
    id: 'chambers_of_xeric', name: 'Chambers of Xeric (Solo)', tier: 3,
    requiresMembers: true, requiresPremium: true,
    skillRequirements: { attack: 90, strength: 90, defence: 85, magic: 80, ranged: 85 },
    gpPerHour: 200000, suspicionPerHour: 7.0,
    baseDetectionRatePerTick: 0.0045,
    xpPerHour: { attack: 40000, strength: 40000, magic: 25000 },
    unlockCost: 150000, teamSize: 1,
    unlockDescription: 'Requires Premium Members + Combat 90+. Raid bot. Extremely profitable.',
    flavorText: 'A bot soloing CoX. No one believes it\'s human. No one is reporting it fast enough.',
  },

  // ─── Tier 4 — Endgame Raids ─────────────────────────────────────────────────
  tombs_of_amascut: {
    id: 'tombs_of_amascut', name: 'Tombs of Amascut', tier: 4,
    requiresMembers: true, requiresPremium: true,
    skillRequirements: { attack: 90, strength: 90, defence: 90, magic: 85, ranged: 90 },
    gpPerHour: 200000, // per bot, 600k total for 3-bot team
    suspicionPerHour: 3.0, // per bot (9.0 combined)
    baseDetectionRatePerTick: 0.0050,
    xpPerHour: { attack: 50000, strength: 50000, magic: 30000 },
    unlockCost: 500000, teamSize: 3,
    unlockDescription: 'Requires 3 Premium bots at Combat 90+. Team raid. 600k GP/hr total.',
    flavorText: 'Three bots perfectly synchronised. Tobias Jagex doesn\'t sleep. Neither do you.',
  },
  theatre_of_blood: {
    id: 'theatre_of_blood', name: 'Theatre of Blood', tier: 4,
    requiresMembers: true, requiresPremium: true,
    skillRequirements: { attack: 100, strength: 100, defence: 95, magic: 90, ranged: 95 },
    gpPerHour: 240000, // per bot, 1.2m total for 5-bot team
    suspicionPerHour: 2.4, // per bot (12.0 combined)
    baseDetectionRatePerTick: 0.0060,
    xpPerHour: { attack: 60000, strength: 60000 },
    unlockCost: 1500000, teamSize: 5,
    unlockDescription: 'Requires 5 Premium bots at Combat 100+. The ultimate bot farm.',
    flavorText: 'A coordinated ToB team of bots. The economy cries. You smile.',
  },
};

export const TIER_1_ACTIVITIES = Object.values(ACTIVITIES).filter(a => a.tier === 1).map(a => a.id);
export const TIER_2_ACTIVITIES = Object.values(ACTIVITIES).filter(a => a.tier === 2).map(a => a.id);
export const TIER_3_ACTIVITIES = Object.values(ACTIVITIES).filter(a => a.tier === 3).map(a => a.id);
export const TIER_4_ACTIVITIES = Object.values(ACTIVITIES).filter(a => a.tier === 4).map(a => a.id);

export const DEFAULT_UNLOCKED_ACTIVITIES: ActivityId[] = [
  'wc_oaks', 'fish_lobsters', 'mine_iron', 'combat_cows',
];

// GP/hr displayed (adjusts for team size where GP is per-bot already)
export function getActivityGpHr(activity: Activity): number {
  return activity.gpPerHour * activity.teamSize;
}
