# RuneBot Inc. — CLAUDE.md

Browser-based incremental idle game where you play a runescape bot farm operator.
Built with Svelte 5 (runes mode) + TypeScript + Vite. No backend, no auth, no database.

## Dev Command

```bash
npm run dev       # starts at http://localhost:5173
npm run build     # production build → dist/
npx tsc --noEmit  # type check only
```

## Desktop Location

```
~/Desktop/04 Web & Development/RuneBot-Inc/
```

## Architecture

```
src/
  engine/           # Pure TypeScript — no Svelte dependency, testable in isolation
    types.ts          # All type definitions (GameState, BotAccount, Activity, Upgrade, etc.)
    activities.ts     # 18 activities across 4 tiers (F2P → raids), GP/hr, XP, suspicion rates
    upgrades.ts       # 3 upgrade trees (evasion, performance, scale) + prestige upgrades
    detection.ts      # Suspicion multipliers, detection roll formula, 6 punishment outcomes
    tick.ts           # 6s game tick, XP levelling, offline catch-up (72h cap), billing
    save.ts           # localStorage save/load (key: runebot_save_v1), base64 export/import
  stores/
    gameState.svelte.ts   # $state reactive store — single source of truth for all game state
  lib/components/
    BotCard.svelte        # Per-bot card: suspicion bar, activity picker, collect/break/sell
    Dashboard.svelte      # Overview panel: bank, GP/hr, collect-all, save/load
    EventLog.svelte       # Live event feed (newest first, last 60 events)
    UpgradeTree.svelte    # 5-tab panel: Evasion / Performance / Scale / Activities / Prestige
  App.svelte            # Root layout: topbar, sidebar, main grid, event sidebar, footer ticker
  app.css               # Global reset + dark bg (#1a1009)
  main.ts               # Entry point, error handler, mounts App
```

## Key Design Decisions

**Svelte 5 runes mode** — must have `vite.config.ts` passing `compilerOptions: { runes: true }` to the Svelte plugin. Without this, Svelte falls back to legacy mode and breaks on the `$state` rune.

**Export named `gameState` not `state`** — the store exports `gameState` (a plain object with reactive getters). Never rename back to `state` — it collides with Svelte's `$state` rune syntax in legacy mode and causes `store_invalid_shape` errors.

**6-second tick** — `TICK_MS = 6000` in `tick.ts`. The game loop runs `processTick()` on an interval. Offline progress applies the same function in batches (capped at 72h / MAX_OFFLINE_TICKS). Skills are stored as floats (e.g. 14.7) and displayed as `Math.floor()`.

**Billing** — Members costs 7,000 GP/month, Premium 18,000 GP/month. One "month" = 10 real minutes (`BILLING_INTERVAL_MS`). Bots auto-downgrade to F2P if GP runs out.

## Game State Shape

```typescript
interface GameState {
  gp: number;                           // player's bank
  prestigePoints: number;               // PP from selling accounts
  bots: BotAccount[];                   // all bot accounts
  maxBotSlots: number;                  // 1–6, increased by Scale upgrades
  unlockedActivities: ActivityId[];     // includes free defaults + paid unlocks
  purchasedUpgrades: UpgradeId[];       // drives computeUpgradeEffects()
  purchasedPrestigeUpgrades: PrestigeUpgradeId[];
  eventLog: EventLogEntry[];            // capped at 60 entries
  lastTickTime: number;                 // ms timestamp — drives offline calc
  membersMonthlyBilling: number;        // ms timestamp of next billing event
}
```

## Activities

| Tier | Examples | GP/hr range | Req |
|------|---------|-------------|-----|
| 1 (F2P) | Yew Woodcutting, Lobsters, Hill Giants | 600–11,000 | Default |
| 2 (Members) | Green Dragons, Blast Furnace, Blackjacking | 20,000–40,000 | Unlock cost + Members |
| 3 (Late) | Zulrah, Vorkath, Chambers of Xeric | 45,000–200,000 | Premium |
| 4 (Raids) | Tombs of Amascut (3-bot), Theatre of Blood (5-bot) | 600k–1.2M total | Premium, team |

## Upgrades Summary

**Evasion tree:** VPN T1/T2, Break Handler Basic/Advanced, Human Pattern, Mirror Client T1/T2
**Performance tree:** Zulrah Script, Blast Furnace Script, RC Abyss Script, Offline Efficiency T1/T2
**Scale tree:** Bot Slots 2–6, Account Pipeline, Multi-Activity, Dedicated Server
**Prestige (PP):** Starting Capital, Reduced Heat, Optimised Scripts, Head Start

## Detection System

```
detectionChance = baseRate × suspicionMultiplier × detectionRateMultiplier × (1 - prestigeReduction)
```

Suspicion zones: Clean (0–25, 0.5×) → Noticed (26–50, 1×) → Hot (51–75, 1.5×) → Critical (76–100, 2.5×)

Outcomes (weighted by suspicion): Warning, Stat Drain, GP Seized, Temp Ban (3–24h), Perm Ban, Rollback

## Account Selling

Sale GP = `totalLevel × 150 + avgCombat × 2000`
Sale PP = `Math.floor(avgCombat / 2)`

## GP Milestones (active play targets)

| Target | GP | ~Time |
|--------|-----|-------|
| First bot slot unlock | 5,000 | 15 min |
| First Members account | 25,000 | 45 min |
| Green Dragon unlock | 50,000 | 90 min |
| First Zulrah bot | 200,000 | 4–6 hrs |
| First ToA team | 2,500,000 | 3–5 days |

## Visual Style (OSRS Pixel + Hacker Terminal)

- Background: `#1a1009`, Panel: `#3d2b1f`, Border: `#8c6239`
- Text: `#f0d080`, Active: `#00ff41`, Warning: `#ffa500`, Danger: `#ff3030`, GP: `#ffdd00`
- Fonts: Press Start 2P (headings), Share Tech Mono (everything else) — loaded from Google Fonts
- Scanline overlay at `z-index: 1000`, pointer-events: none

## Current Status (as of 2026-04-12)

- MVP is **complete and working** — verified via Playwright
- All 4 activity tiers defined with real numbers
- All 3 upgrade trees implemented
- Prestige system skeleton in place (earn PP, spend on 4 upgrades)
- Save/load + offline progress working
- Bot account lifecycle (create → assign → collect → sell/dismiss) working

## What's Not Done Yet (post-MVP)

- Tier 2+ activities need **unlock cost UX** (currently available in Upgrades → Activities tab)
- No sound effects
- No mobile responsive layout
- No challenge runs (Hardcore, F2P Only, Speed Run)
- No seasonal events
- No leaderboards / backend
- Tutorial (5-step onboarding) not yet implemented
- `banTimeRemaining` / `breakTimeRemaining` derived values in BotCard use `$derived(() => ...)` returning a function — works but won't reactively update the timer display (timers are cosmetically static until next re-render). Fix: use a `$effect` with `setInterval` for live countdown.

## Known Gotchas

- **Never rename `gameState` back to `state`** — breaks Svelte's rune detection
- **`vite.config.ts` must have `runes: true`** — without it the whole app fails silently
- Skill levels stored as floats — always `Math.floor()` before display
- `computeUpgradeEffects()` is called per-tick per-bot — if performance degrades at 50+ bots, memoize it at the state level
