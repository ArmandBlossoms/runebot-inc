import type { GameState, Skills, ActivityId } from './types';
import { DEFAULT_UNLOCKED_ACTIVITIES } from './activities';
import { BILLING_INTERVAL_MS } from './tick';

const SAVE_KEY = 'runebot_save_v1';

const DEFAULT_SKILLS: Skills = {
  attack: 1, strength: 1, defence: 1, hitpoints: 10, prayer: 1,
  ranged: 1, magic: 1, woodcutting: 1, fishing: 1, mining: 1,
  thieving: 1, runecrafting: 1, agility: 1, smithing: 1, slayer: 1,
};

let _idCounter = 0;
function makeId(): string {
  return `bot_${Date.now()}_${++_idCounter}`;
}

const BOT_NAME_PREFIXES = ['Iron', 'Zulrah', 'Rune', 'Guthix', 'Saradomin', 'Bandos', 'Dragon', 'Infernal', 'Chaos', 'Holy'];
const BOT_NAME_SUFFIXES = ['Fisher', 'Woodcutter', 'Miner', 'Slayer', 'Knight', 'Ranger', 'Mage', 'Warrior', 'Bot', 'Farm'];

export function generateBotName(): string {
  const pattern = Math.floor(Math.random() * 4);
  const letters = () => Array.from({ length: 3 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
  const digits = () => Math.floor(Math.random() * 900 + 100).toString();

  switch (pattern) {
    case 0: return `${BOT_NAME_PREFIXES[Math.floor(Math.random() * BOT_NAME_PREFIXES.length)]}${BOT_NAME_SUFFIXES[Math.floor(Math.random() * BOT_NAME_SUFFIXES.length)]}${digits()}`;
    case 1: return `${letters()}_wc_v${Math.floor(Math.random() * 9 + 1)}`;
    case 2: return `${letters()}_${Math.floor(Math.random() * 9000 + 1000)}`;
    default: return `${BOT_NAME_PREFIXES[Math.floor(Math.random() * BOT_NAME_PREFIXES.length)]}_${digits()}`;
  }
}

export function createNewBot(startWithMembers = false, startingCombatBonus = 0): GameState['bots'][0] {
  const skills = { ...DEFAULT_SKILLS };
  if (startingCombatBonus > 0) {
    skills.attack = startingCombatBonus;
    skills.strength = startingCombatBonus;
    skills.defence = startingCombatBonus;
    skills.hitpoints = Math.max(10, startingCombatBonus);
  }

  return {
    id: makeId(),
    name: generateBotName(),
    tier: startWithMembers ? 'members' : 'f2p',
    status: 'idle',
    skills,
    suspicion: 0,
    activity: null,
    heldGp: 0,
    bannedUntil: null,
    totalXp: 0,
    detectionCount: 0,
    breakUntil: null,
    createdAt: Date.now(),
  };
}

export function createInitialState(): GameState {
  const now = Date.now();
  return {
    version: 1,
    gp: 0,
    prestigePoints: 0,
    totalEarned: 0,
    prestige: 0,
    bots: [createNewBot()],
    maxBotSlots: 1,
    unlockedActivities: [...DEFAULT_UNLOCKED_ACTIVITIES],
    purchasedUpgrades: [],
    purchasedPrestigeUpgrades: [],
    eventLog: [
      {
        id: 'intro',
        timestamp: now,
        botId: null,
        botName: null,
        type: 'system',
        message: 'Welcome to RuneBot Inc. Your first bot is ready. Assign it an activity to start earning GP.',
      },
    ],
    lastSaveTime: now,
    lastTickTime: now,
    tutorialStep: 0,
    membersMonthlyBilling: now + BILLING_INTERVAL_MS,
  };
}

export function saveGame(state: GameState): void {
  try {
    const s = { ...state, lastSaveTime: Date.now() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch (e) {
    console.error('Failed to save:', e);
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    return migrateState(parsed);
  } catch (e) {
    console.error('Failed to load save:', e);
    return null;
  }
}

function migrateState(raw: Partial<GameState>): GameState {
  const defaults = createInitialState();
  // Merge: keep saved data, fill in any missing fields from defaults
  const state: GameState = {
    ...defaults,
    ...raw,
    bots: (raw.bots ?? defaults.bots).map(b => ({
      ...defaults.bots[0],
      ...b,
      skills: { ...DEFAULT_SKILLS, ...(b.skills ?? {}) },
    })),
    eventLog: raw.eventLog ?? defaults.eventLog,
  };
  return state;
}

export function exportSave(state: GameState): string {
  return btoa(JSON.stringify(state));
}

export function importSave(encoded: string): GameState | null {
  try {
    const decoded = JSON.parse(atob(encoded));
    return migrateState(decoded);
  } catch {
    return null;
  }
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
