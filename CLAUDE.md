# RuneBot Inc. — CLAUDE.md

Browser-based incremental idle game where you play a runescape bot farm operator.
Built with Svelte 5 (runes mode) + TypeScript + Vite. No backend, no auth, no database.

## Dev Command

```bash
npm run dev       # starts at http://localhost:5173
npm run build     # production build → dist/
npm run check     # type check (svelte-check + tsc)
npm test          # run vitest unit tests
```

## Git Worktrees

Useful when you want to run multiple Claude Code sessions in parallel on
different branches without them stepping on each other's files or fighting
over port 5173. Skip this if you're only working on one thing at a time.

**Convention**: worktrees live as **siblings** of the main repo
(`../runebot-inc-<slug>`), not nested inside it. Each worktree gets its own
`node_modules/`.

```bash
# Create a new worktree on a new branch (base defaults to main)
./scripts/worktree-new.sh my-feature

# Or branch from something other than main
./scripts/worktree-new.sh my-feature some-other-branch

# List all worktrees
git worktree list

# Remove a worktree (never use `rm -rf` — leaves stale metadata)
git worktree remove ../runebot-inc-my-feature
```

**Port collisions**: main repo uses 5173. Additional worktrees should run
`npm run dev -- --port 5174` (then 5175, 5176, …). The helper script prints
a suggested port after creation.

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

| Tier | Count | Examples | GP/hr range | Req |
|------|-------|---------|-------------|-----|
| 1 (F2P) | **60** | Chickens, Trees, Tin, Iron Bar Smelting, Air Runes, Cowhide Tanning, Hill Giants, Wilderness Runite | 220–14,000 | Default — auto-unlocked, gated by skill reqs |
| 2 (Members) | **51** | Green Dragons, Blast Furnace, Slayer ladder, Barrows, Hallowed Sepulchre, Pyramid Plunder | 0–44,000 | Unlock cost + Members |
| 3 (Late) | 4 | Zulrah, Vorkath, Chambers of Xeric | 45,000–200,000 | Premium |
| 4 (Raids) | 2 | Tombs of Amascut (3-bot), Theatre of Blood (5-bot) | 600k–1.2M total | Premium, team |

Tier 1 is grouped in `activities.ts` by skill — Woodcutting (5), Fishing (8), Mining (10), Smithing (7), Runecrafting (6), Magic (3), Production/Misc (2), Combat (19).

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

## Current Status (as of 2026-04-14)

- MVP is **complete and working** — verified via Playwright
- All 4 activity tiers defined with real numbers
- All 3 upgrade trees implemented
- Prestige system skeleton in place (earn PP, spend on 4 upgrades)
- Save/load + offline progress working
- Bot account lifecycle (create → assign → collect → sell/dismiss) working

## Work Log

### 2026-04-14 — Phase 2c complete: Tier 2 RC, Magic, Thieving & Agility
- Added 15 new Tier 2 activities: 4 Runecrafting (ZMI altar, Law/Death/Blood runes), 3 Magic (Enchant Bolts, Humidify, Plank Make), 4 Thieving (Silk Stalls, Master Farmers, Ardougne Knights, Pyramid Plunder), 4 Agility (Brimhaven Arena, Agility Pyramid, Canifis Rooftop, Hallowed Sepulchre).
- Tier 2 count: 36 → **51** (target: ~50, achieved).
- Bumped unit test invariant `TIER_2_ACTIVITIES.length >= 51`.
- Verified: 17/17 vitest tests pass, `npm run build` clean (1.66s).
- **Tier 2 expansion COMPLETE.** All 3 phases (2a + 2b + 2c) shipped, +46 activities total over the original 5.

### 2026-04-14 — Phase 2b complete: Tier 2 Members Skilling
- Added 15 new Tier 2 activities: 4 woodcutting (teaks/mahogany/magic/redwood), 5 fishing (barbarian/monkfish/karambwan/anglerfish/dark crabs), 4 mining (motherlode/pure essence/blast mine/amethyst), 2 smithing (cannonballs/blast furnace runite).
- Tier 2 count: 21 → 36.
- Bumped unit test invariant `TIER_2_ACTIVITIES.length >= 36`.
- Verified: 17/17 vitest tests pass, `npm run build` clean.
- Tier 2 progress: 36/~50 target. Phase 2c remaining.

### 2026-04-14 — Phase 2a complete: Tier 2 Combat/Slayer/Bosses
- Added 16 new Tier 2 activities: 1 combat (Moss Giants), 11 Slayer monsters (Crawling Hands → Nechryael, levels 5-80), 5 entry-level bosses (Obor, Giant Mole, Sarachnis, KBD, Barrows).
- Tier 2 count: 5 → 21.
- Bumped unit test invariant `TIER_2_ACTIVITIES.length >= 21`, added test asserting all Tier 2 activities have `requiresMembers: true`.
- Verified: 17/17 vitest tests pass, `npm run build` clean.
- Tier 2 progress: 21/~50 target. Phases 2b and 2c remaining.

### 2026-04-14 — Tier 2 expansion plan (in progress)

Tier 2 (Members mid-game) currently has 5 activities. Goal: bring it to ~50 by adding ~46 across three phases. Tier 2 activities all have `requiresMembers: true`, `unlockCost > 0`, and appear in the picker's locked-section (Tier 2 activities are NOT added to DEFAULT_UNLOCKED_ACTIVITIES).

**Inspiration sources:** OSRS wiki Money Making Guide (Combat, Skilling, Slayer pages) — researched via WebSearch. Key references: Slayer monsters by level, beginner bosses (Mole, KBD, Sarachnis, Barrows), members fishing (monkfish/karambwan/anglerfish), members WC (teaks/mahogany/magic/redwood), Lunar magic spells, master farmer / pyramid plunder thieving, rooftop agility.

**Existing Tier 2 (do not duplicate):** green_dragons, blast_furnace, nmz_afk, nature_runes, thieving_blackjack.

**Phase 2a — Combat, Slayer & Bosses (16 new):**
- combat_moss_giants (Cmb 42)
- slayer_crawling_hands (Slayer 5)
- slayer_banshees (Slayer 15)
- slayer_pyrefiends (Slayer 30)
- slayer_basilisks (Slayer 40)
- slayer_bloodvelds (Slayer 50)
- slayer_aberrant_spectres (Slayer 60)
- slayer_dust_devils (Slayer 65)
- slayer_kurasks (Slayer 70)
- slayer_gargoyles (Slayer 75)
- slayer_nechryael (Slayer 80)
- boss_obor (Cmb 60+, Hill Giant boss)
- boss_giant_mole (Cmb 60+)
- boss_sarachnis (Cmb 70+)
- boss_kbd (Cmb 80+, King Black Dragon)
- boss_barrows (Cmb 70+)

**Phase 2b — Members Skilling / Gathering (15 new):**
- wc_teaks (WC 35), wc_mahogany (WC 50), wc_magic (WC 75), wc_redwood (WC 90)
- fish_barbarian (Fish 48 — barbarian fishing), fish_monkfish (Fish 62), fish_karambwan (Fish 65), fish_anglerfish (Fish 82), fish_dark_crabs (Fish 85, Wild)
- mine_motherlode (Mining 30, paydirt), mine_pure_essence (Mining 30), mine_blast_mine (Mining 75), mine_amethyst (Mining 92)
- smith_cannonballs (Smithing 35, AFK), smith_blast_furnace_rune (Smithing 85)

**Phase 2c — RC, Magic, Thieving, Agility, Misc (15 new):**
- rc_law_runes (RC 54), rc_death_runes (RC 65), rc_blood_runes (RC 77), rc_zmi_altar (RC 50)
- magic_humidify (Magic 68 Lunar), magic_plank_make (Magic 86 Lunar), magic_enchant_bolts (Magic 27+)
- thieve_silk_stalls (Thieving 20), thieve_master_farmers (Thieving 38), thieve_ardougne_knights (Thieving 55), thieve_pyramid_plunder (Thieving 71)
- agility_brimhaven_arena (Agility 1), agility_pyramid (Agility 30), agility_canifis_rooftop (Agility 40), agility_hallowed_sepulchre (Agility 52)

**Test gates after each phase:** `npm test` (vitest), `npm run build`. Unit-test invariants get bumped (Tier 2 count) per phase. Commit and push at the end of each phase.

### 2026-04-14 — Tier 1 expansion (commit eb62b48)
- Tripled+ Tier 1 content: **8 → 60 activities** (target was 3×).
- Inspired by OSRS wiki F2P money-making and combat-training guides.
- New skill ladders added that didn't exist before: Smithing (7), Runecrafting (6), Magic (3), Production/Misc (2).
- Combat ladder filled out from Atk 1 → Cmb 60 (was just cows + hill giants).
- **Fixed latent bug:** free Tier 1 activities (`wc_yews`, `fish_sharks`, `mine_coal`, `combat_hill_giants`) were dead content — they had `unlockCost: 0` so they couldn't appear in `lockedActivities` (filter requires cost > 0) and weren't in `DEFAULT_UNLOCKED_ACTIVITIES`. Fix: every free Tier 1 activity is now in `DEFAULT_UNLOCKED_ACTIVITIES`; the picker's `meetsSkillRequirements` filter still hides ones the bot can't do.
- **Save migration:** `migrateState` in `save.ts` now unions saved `unlockedActivities` with `DEFAULT_UNLOCKED_ACTIVITIES` so older saves auto-gain new free activities.
- Verified with `npx svelte-check` (0 errors) and `npm run build` (✓ built in 1.49s).

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
