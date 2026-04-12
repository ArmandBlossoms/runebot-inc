<script lang="ts">
  import type { BotAccount } from '../../engine/types';
  import {
    gameState, assignActivity, collectGp, sendBotOnBreak, returnFromBreak,
    dismissBannedBot, sellBot, upgradeAccountTier, renameBot, unlockActivity,
    meetsSkillRequirements, meetsAccountRequirements, getTotalLevel, formatGp,
    ACTIVITIES,
  } from '../../stores/gameState.svelte';
  import { getSuspicionLabel, getSuspicionColor } from '../../engine/detection';

  let { bot }: { bot: BotAccount } = $props();

  let expanded = $state(false);
  let renaming = $state(false);
  let renameInput = $state('');
  let showActivityPicker = $state(false);

  const suspicionPct = $derived(Math.floor(bot.suspicion));
  const suspicionLabel = $derived(getSuspicionLabel(bot.suspicion));
  const suspicionColor = $derived(getSuspicionColor(bot.suspicion));
  const totalLevel = $derived(getTotalLevel(bot));
  const combatLevel = $derived(Math.floor((bot.skills.attack + bot.skills.strength + bot.skills.defence) / 3));
  const currentActivity = $derived(bot.activity ? ACTIVITIES[bot.activity] : null);
  const tierBadge = $derived(bot.tier === 'f2p' ? 'F2P' : bot.tier === 'members' ? 'P2P' : 'PRE');
  const tierColor = $derived(bot.tier === 'f2p' ? '#c0a060' : bot.tier === 'members' ? '#00ff41' : '#7df');

  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => { now = Date.now(); }, 1000);
    return () => clearInterval(id);
  });

  const banTimeRemaining = $derived(() => {
    if (!bot.bannedUntil) return '';
    const ms = bot.bannedUntil - now;
    if (ms <= 0) return '';
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return `${h}h ${m}m`;
  });

  const breakTimeRemaining = $derived(() => {
    if (!bot.breakUntil) return '';
    const ms = bot.breakUntil - now;
    if (ms <= 0) return '';
    const m = Math.floor(ms / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return `${m}m ${s}s`;
  });

  const availableActivities = $derived(
    gameState.unlockedActivities
      .map(id => ACTIVITIES[id])
      .filter(a => meetsSkillRequirements(bot, a.id) && meetsAccountRequirements(bot, a.id))
  );

  const lockedActivities = $derived(
    Object.values(ACTIVITIES)
      .filter(a => a.unlockCost > 0 && !gameState.unlockedActivities.includes(a.id))
      .sort((a, b) => a.tier - b.tier || a.unlockCost - b.unlockCost)
  );

  function formatSkillReqs(reqs: Record<string, number>): string {
    const entries = Object.entries(reqs);
    if (entries.length === 0) return '';
    const combatSkills = new Set(['attack', 'strength', 'defence', 'hitpoints', 'prayer', 'ranged', 'magic']);
    const isCombatOnly = entries.every(([k]) => combatSkills.has(k));
    if (isCombatOnly && entries.length >= 2) {
      const max = Math.max(...entries.map(([, v]) => v));
      return `CMB ${max}+`;
    }
    const abbrev: Record<string, string> = {
      attack: 'ATK', strength: 'STR', defence: 'DEF', hitpoints: 'HP',
      prayer: 'PRA', ranged: 'RNG', magic: 'MAG', woodcutting: 'WC',
      fishing: 'FSH', mining: 'MIN', thieving: 'THV', runecrafting: 'RC',
      agility: 'AGI', smithing: 'SMI', slayer: 'SLY',
    };
    return entries.map(([k, v]) => `${abbrev[k] ?? k.toUpperCase()} ${v}`).join(' · ');
  }

  const saleValue = $derived(Math.floor(totalLevel * 150 + combatLevel * 2000));
  const salePp = $derived(Math.floor(combatLevel / 2));

  function startRename() {
    renameInput = bot.name;
    renaming = true;
  }

  function confirmRename() {
    if (renameInput.trim()) renameBot(bot.id, renameInput.trim());
    renaming = false;
  }

  const SKILL_DISPLAY: Array<{ key: keyof typeof bot.skills; label: string }> = [
    { key: 'attack', label: 'ATK' }, { key: 'strength', label: 'STR' }, { key: 'defence', label: 'DEF' },
    { key: 'hitpoints', label: 'HP' }, { key: 'prayer', label: 'PRA' }, { key: 'ranged', label: 'RNG' },
    { key: 'magic', label: 'MAG' }, { key: 'woodcutting', label: 'WC' }, { key: 'fishing', label: 'FSH' },
    { key: 'mining', label: 'MIN' }, { key: 'thieving', label: 'THV' }, { key: 'runecrafting', label: 'RC' },
    { key: 'agility', label: 'AGI' }, { key: 'smithing', label: 'SMI' }, { key: 'slayer', label: 'SLY' },
  ];
</script>

<div class="bot-card" class:perm-banned={bot.status === 'perm_banned'} class:temp-banned={bot.status === 'temp_banned'} class:detecting={bot.detectionCount > 0 && bot.suspicion > 60}>
  <!-- Header -->
  <div class="card-header">
    <div class="bot-name-row">
      {#if renaming}
        <input class="rename-input" bind:value={renameInput} onkeydown={e => e.key === 'Enter' && confirmRename()} onblur={confirmRename} autofocus />
      {:else}
        <span class="bot-name" onclick={() => { if (bot.status !== 'perm_banned') startRename(); }}>{bot.name}</span>
      {/if}
      <span class="tier-badge" style="color: {tierColor}">[{tierBadge}]</span>
    </div>
    <div class="status-row">
      <span class="status-dot" style="background: {bot.status === 'active' ? '#00ff41' : bot.status === 'on_break' ? '#ffa500' : bot.status === 'temp_banned' ? '#ff3030' : bot.status === 'perm_banned' ? '#444' : '#888'}"></span>
      <span class="status-label">
        {#if bot.status === 'active' && currentActivity}
          {currentActivity.name}
        {:else if bot.status === 'on_break'}
          On Break {breakTimeRemaining()}
        {:else if bot.status === 'temp_banned'}
          BANNED {banTimeRemaining()}
        {:else if bot.status === 'perm_banned'}
          PERMA BANNED
        {:else}
          Idle
        {/if}
      </span>
    </div>
  </div>

  <!-- Suspicion Bar -->
  {#if bot.status !== 'perm_banned'}
  <div class="suspicion-row">
    <span class="susp-label">SUSP</span>
    <div class="susp-bar-track">
      <div class="susp-bar-fill" style="width: {suspicionPct}%; background: {suspicionColor}"></div>
    </div>
    <span class="susp-value" style="color: {suspicionColor}">{suspicionPct} [{suspicionLabel}]</span>
  </div>
  {/if}

  <!-- Stats Row -->
  <div class="stats-row">
    <span class="stat">CMB <b>{combatLevel}</b></span>
    <span class="stat">TOTAL <b>{Math.floor(totalLevel)}</b></span>
    <span class="stat gp-held">HELD <b>{formatGp(Math.floor(bot.heldGp))} GP</b></span>
  </div>

  {#if currentActivity && bot.status === 'active'}
  <div class="earning-row">
    <span class="earn-rate">~ {formatGp(currentActivity.gpPerHour)} GP/hr</span>
  </div>
  {/if}

  <!-- Expanded Skills -->
  {#if expanded && bot.status !== 'perm_banned'}
  <div class="skills-grid">
    {#each SKILL_DISPLAY as s}
    <div class="skill-cell">
      <span class="skill-label">{s.label}</span>
      <span class="skill-val">{Math.floor(bot.skills[s.key])}</span>
    </div>
    {/each}
  </div>
  {/if}

  <!-- Activity Picker -->
  {#if showActivityPicker}
  <div class="activity-picker">
    <div class="picker-header">Select Activity</div>
    <button class="activity-opt unassign" onclick={() => { assignActivity(bot.id, null); showActivityPicker = false; }}>
      — Unassign —
    </button>
    {#each availableActivities as act}
    <button
      class="activity-opt"
      class:active={bot.activity === act.id}
      onclick={() => { assignActivity(bot.id, act.id); showActivityPicker = false; }}
    >
      <span class="act-name">{act.name}</span>
      <span class="act-gp">{formatGp(act.gpPerHour)}/hr</span>
      <span class="act-tier" style="color: {['','#c0a060','#ffa500','#ff8c00','#ff4444'][act.tier]}">T{act.tier}</span>
    </button>
    {/each}
    {#if availableActivities.length === 0 && lockedActivities.length === 0}
    <div class="no-activities">No activities available. Train skills first.</div>
    {/if}

    {#if lockedActivities.length > 0}
    <div class="locked-section-header">— UNLOCK NEW ACTIVITIES —</div>
    {#each lockedActivities as act}
    {@const canBuy = gameState.gp >= act.unlockCost}
    <div class="locked-activity">
      <div class="locked-top">
        <span class="act-name">{act.name}</span>
        <span class="act-tier" style="color: {['','#c0a060','#ffa500','#ff8c00','#ff4444'][act.tier]}">T{act.tier}</span>
      </div>
      <div class="locked-meta">
        {#if act.requiresPremium}<span class="req-badge premium">[Premium]</span>{:else if act.requiresMembers}<span class="req-badge members">[Members]</span>{/if}
        {#if Object.keys(act.skillRequirements).length > 0}<span class="req-skills">{formatSkillReqs(act.skillRequirements)}</span>{/if}
        <span class="act-gp">{formatGp(act.gpPerHour)}/hr</span>
      </div>
      <div class="locked-footer">
        <span class="lock-cost" style="color: {canBuy ? '#ffdd00' : '#555'}">{formatGp(act.unlockCost)} GP</span>
        <button class="btn-unlock" disabled={!canBuy} onclick={() => unlockActivity(act.id)}>
          {canBuy ? 'UNLOCK' : 'NEED MORE GP'}
        </button>
      </div>
    </div>
    {/each}
    {/if}
  </div>
  {/if}

  <!-- Action Buttons -->
  <div class="action-row">
    {#if bot.status === 'perm_banned'}
      <button class="btn btn-danger" onclick={() => dismissBannedBot(bot.id)}>DISMISS</button>
    {:else}
      <button class="btn btn-collect" onclick={() => collectGp(bot.id)} disabled={bot.heldGp < 1}>
        COLLECT
      </button>

      {#if bot.status === 'active'}
        <button class="btn btn-break" onclick={() => sendBotOnBreak(bot.id)}>BREAK</button>
      {:else if bot.status === 'on_break'}
        <button class="btn btn-resume" onclick={() => returnFromBreak(bot.id)}>RESUME</button>
      {:else if bot.status === 'idle'}
        <button class="btn btn-assign" onclick={() => showActivityPicker = !showActivityPicker}>ASSIGN</button>
      {/if}

      <button class="btn btn-expand" onclick={() => expanded = !expanded}>{expanded ? '▲' : '▼'}</button>

      <div class="secondary-actions">
        {#if bot.tier !== 'premium'}
          <button class="btn btn-small" onclick={() => upgradeAccountTier(bot.id)}
            title="{bot.tier === 'f2p' ? '→ Members (7,000 GP/mo)' : '→ Premium (18,000 GP/mo)'}">
            UPGRADE
          </button>
        {/if}
        <button class="btn btn-small btn-sell" onclick={() => sellBot(bot.id)}
          title="Sell for {formatGp(saleValue)} GP + {salePp} PP">
          SELL
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .bot-card {
    background: #3d2b1f;
    border: 2px solid #8c6239;
    padding: 10px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    color: #f0d080;
    transition: border-color 0.3s;
    position: relative;
  }
  .bot-card.perm-banned {
    opacity: 0.5;
    border-color: #444;
    filter: grayscale(0.8);
  }
  .bot-card.detecting {
    border-color: #ffa500;
    animation: pulse-border 2s infinite;
  }
  @keyframes pulse-border {
    0%, 100% { border-color: #ffa500; }
    50% { border-color: #ff3030; }
  }

  .card-header { margin-bottom: 6px; }
  .bot-name-row { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
  .bot-name { cursor: pointer; font-size: 12px; color: #f0d080; font-weight: bold; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bot-name:hover { color: #fff; }
  .tier-badge { font-size: 10px; white-space: nowrap; }
  .rename-input { background: #1a1009; border: 1px solid #8c6239; color: #f0d080; font-family: inherit; font-size: 12px; padding: 2px 4px; flex: 1; }

  .status-row { display: flex; align-items: center; gap: 5px; margin-top: 3px; }
  .status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .status-label { color: #c0a060; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .suspicion-row { display: flex; align-items: center; gap: 5px; margin: 6px 0; }
  .susp-label { font-size: 9px; color: #888; width: 32px; flex-shrink: 0; }
  .susp-bar-track { flex: 1; height: 6px; background: #1a1009; border: 1px solid #8c6239; }
  .susp-bar-fill { height: 100%; transition: width 0.5s, background 0.5s; }
  .susp-value { font-size: 9px; white-space: nowrap; min-width: 80px; text-align: right; }

  .stats-row { display: flex; gap: 8px; margin-bottom: 4px; font-size: 10px; }
  .stat { color: #c0a060; }
  .stat b { color: #f0d080; }
  .gp-held b { color: #ffdd00; }

  .earning-row { font-size: 10px; color: #00ff41; margin-bottom: 4px; }

  .skills-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; margin: 6px 0; padding: 6px; background: #1a1009; border: 1px solid #5a3f2a; }
  .skill-cell { display: flex; flex-direction: column; align-items: center; }
  .skill-label { font-size: 8px; color: #888; }
  .skill-val { font-size: 11px; color: #f0d080; }

  .activity-picker { background: #1a1009; border: 1px solid #8c6239; margin: 6px 0; padding: 4px; max-height: 240px; overflow-y: auto; }
  .picker-header { color: #888; font-size: 9px; padding: 2px 4px; border-bottom: 1px solid #333; margin-bottom: 3px; }
  .activity-opt { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 4px 6px; background: transparent; border: 1px solid transparent; color: #c0a060; font-family: inherit; font-size: 10px; cursor: pointer; gap: 4px; }
  .activity-opt:hover, .activity-opt.active { background: #2a1f14; border-color: #8c6239; color: #f0d080; }
  .activity-opt.unassign { color: #666; }
  .act-name { flex: 1; text-align: left; }
  .act-gp { color: #ffdd00; }
  .act-tier { font-size: 9px; }
  .no-activities { color: #666; font-size: 10px; padding: 4px; }

  .locked-section-header { color: #555; font-size: 8px; padding: 6px 4px 3px; border-top: 1px solid #333; letter-spacing: 0.5px; }
  .locked-activity { padding: 4px 6px; border: 1px solid #333; margin-bottom: 3px; background: #0d0805; }
  .locked-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
  .locked-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-bottom: 3px; }
  .locked-footer { display: flex; justify-content: space-between; align-items: center; }
  .req-badge { font-size: 8px; padding: 1px 4px; border: 1px solid; }
  .req-badge.members { color: #00ff41; border-color: #00ff41; }
  .req-badge.premium { color: #7df; border-color: #7df; }
  .req-skills { color: #888; font-size: 8px; }
  .lock-cost { font-size: 9px; }
  .btn-unlock {
    font-family: inherit; font-size: 8px; padding: 2px 6px;
    background: #1a1009; border: 1px solid #5a3f2a; color: #c0a060;
    cursor: pointer; letter-spacing: 0.5px;
  }
  .btn-unlock:hover:not(:disabled) { background: #2a1f14; border-color: #8c6239; color: #ffdd00; }
  .btn-unlock:disabled { opacity: 0.35; cursor: not-allowed; }

  .action-row { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; margin-top: 6px; }
  .btn { font-family: 'Share Tech Mono', monospace; font-size: 9px; padding: 4px 8px; border: 1px solid #8c6239; background: #2a1f14; color: #c0a060; cursor: pointer; letter-spacing: 0.5px; }
  .btn:hover { background: #3d2b1f; color: #f0d080; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-collect { border-color: #ffdd00; color: #ffdd00; }
  .btn-collect:hover { background: #2a2200; }
  .btn-break { border-color: #ffa500; color: #ffa500; }
  .btn-resume { border-color: #00ff41; color: #00ff41; }
  .btn-assign { border-color: #7df; color: #7df; }
  .btn-danger { border-color: #ff3030; color: #ff3030; }
  .btn-expand { margin-left: auto; }
  .secondary-actions { display: flex; gap: 4px; margin-left: auto; }
  .btn-small { font-size: 8px; padding: 3px 6px; }
  .btn-sell { border-color: #c060c0; color: #c060c0; }
</style>
