import type { BotAccount, DetectionOutcome, Skills, SkillName } from './types';
import type { Activity } from './types';

// Suspicion zone multipliers
export function getSuspicionMultiplier(suspicion: number): number {
  if (suspicion < 26) return 0.5;   // Clean
  if (suspicion < 51) return 1.0;   // Noticed
  if (suspicion < 76) return 1.5;   // Hot
  return 2.5;                        // Critical
}

export function getSuspicionLabel(suspicion: number): string {
  if (suspicion < 26) return 'CLEAN';
  if (suspicion < 51) return 'NOTICED';
  if (suspicion < 76) return 'HOT';
  if (suspicion < 100) return 'CRITICAL';
  return 'FLAGGED';
}

export function getSuspicionColor(suspicion: number): string {
  if (suspicion < 26) return '#00ff41';
  if (suspicion < 51) return '#c0a060';
  if (suspicion < 76) return '#ffa500';
  return '#ff3030';
}

// Returns the detection chance per tick (0–1)
export function getDetectionChancePerTick(
  bot: BotAccount,
  activity: Activity,
  detectionRateMultiplier: number,
  suspicionRateReduction: number, // from prestige
): number {
  const base = activity.baseDetectionRatePerTick;
  const suspMult = getSuspicionMultiplier(bot.suspicion);
  return base * suspMult * detectionRateMultiplier * (1 - suspicionRateReduction);
}

// Roll for a detection event. Returns true if detected this tick.
export function rollDetection(chance: number): boolean {
  return Math.random() < chance;
}

// Determine what the detection outcome is, weighted by suspicion
export function getDetectionOutcome(bot: BotAccount): DetectionOutcome {
  const s = bot.suspicion;
  const roll = Math.random();

  // Very high suspicion: higher chance of severe outcomes
  if (s >= 76) {
    if (roll < 0.05) return 'rollback';
    if (roll < 0.25) return 'perm_ban';
    if (roll < 0.55) return 'temp_ban';
    if (roll < 0.75) return 'gp_seized';
    if (roll < 0.90) return 'stat_drain';
    return 'warning';
  }

  if (s >= 51) {
    if (roll < 0.03) return 'rollback';
    if (roll < 0.08) return 'perm_ban';
    if (roll < 0.25) return 'temp_ban';
    if (roll < 0.50) return 'gp_seized';
    if (roll < 0.75) return 'stat_drain';
    return 'warning';
  }

  // Low suspicion: mostly warnings and minor punishments
  if (roll < 0.01) return 'temp_ban';
  if (roll < 0.15) return 'gp_seized';
  if (roll < 0.45) return 'stat_drain';
  return 'warning';
}

// Apply outcome to bot — returns mutated bot and a message
export function applyDetectionOutcome(
  bot: BotAccount,
  outcome: DetectionOutcome,
  now: number,
): { bot: BotAccount; message: string } {
  const b = { ...bot, skills: { ...bot.skills } };

  switch (outcome) {
    case 'warning': {
      b.suspicion = Math.min(100, b.suspicion + 20);
      b.detectionCount++;
      const lines = [
        'Jagex flagged unusual mouse movement. Lucky escape.',
        'Suspicious login detected. Warning issued.',
        'Pattern analysis triggered. Close call.',
        'Bot Report received. No action taken... yet.',
      ];
      return { bot: b, message: lines[Math.floor(Math.random() * lines.length)] };
    }

    case 'stat_drain': {
      const skills = Object.keys(b.skills) as SkillName[];
      const drainable = skills.filter(s => b.skills[s] > 5);
      if (drainable.length === 0) return applyDetectionOutcome(b, 'warning', now);
      const targetSkill = drainable[Math.floor(Math.random() * drainable.length)];
      const drain = Math.floor(Math.random() * 8) + 3; // 3–10
      b.skills[targetSkill] = Math.max(1, b.skills[targetSkill] - drain);
      b.suspicion = Math.min(100, b.suspicion + 15);
      b.detectionCount++;
      if (b.activity) b.activity = canStillDoActivity(b) ? b.activity : null;
      return {
        bot: b,
        message: `Stat drain: ${capitalize(targetSkill)} -${drain} levels.`,
      };
    }

    case 'gp_seized': {
      const seized = Math.floor(b.heldGp * 0.30);
      b.heldGp = Math.max(0, b.heldGp - seized);
      b.suspicion = Math.min(100, b.suspicion + 10);
      b.detectionCount++;
      return {
        bot: b,
        message: `GP Seized: ${formatGp(seized)} GP confiscated (30% of held GP).`,
      };
    }

    case 'temp_ban': {
      const hours = Math.floor(Math.random() * 22) + 3; // 3–24h
      b.bannedUntil = now + hours * 3600 * 1000;
      b.status = 'temp_banned';
      b.activity = null;
      b.suspicion = Math.min(100, b.suspicion + 25);
      b.detectionCount++;
      return {
        bot: b,
        message: `Temporary ban: ${hours}h. Bot deactivated.`,
      };
    }

    case 'perm_ban': {
      b.status = 'perm_banned';
      b.activity = null;
      b.bannedUntil = null;
      b.detectionCount++;
      return {
        bot: b,
        message: `PERMANENT BAN. Bot lost. All carried GP seized.`,
      };
    }

    case 'rollback': {
      // Roll back 1 hour of XP roughly (drain multiple skills slightly)
      const skills = Object.keys(b.skills) as SkillName[];
      const drained: string[] = [];
      for (const s of skills.slice(0, 3)) {
        if (b.skills[s] > 1) {
          b.skills[s] = Math.max(1, b.skills[s] - 2);
          drained.push(capitalize(s));
        }
      }
      b.suspicion = Math.min(100, b.suspicion + 30);
      b.detectionCount++;
      return {
        bot: b,
        message: `XP Rollback! Skills reverted: ${drained.join(', ')}. Jagex Machine Learning flagged you.`,
      };
    }
  }
}

// Check if a bot still meets requirements for its current activity after stat drain
function canStillDoActivity(bot: BotAccount): boolean {
  // simplified — actual check happens in tick
  return true;
}

export function formatGp(gp: number): string {
  if (gp >= 1_000_000) return `${(gp / 1_000_000).toFixed(2)}M`;
  if (gp >= 1_000) return `${(gp / 1_000).toFixed(1)}K`;
  return `${gp}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
