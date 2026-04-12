<script lang="ts">
  import { gameState, purchaseUpgrade, purchasePrestigeUpgrade, unlockActivity, formatGp, UPGRADES, PRESTIGE_UPGRADES, ACTIVITIES } from '../../stores/gameState.svelte';
  import type { UpgradeId, PrestigeUpgradeId, ActivityId } from '../../engine/types';

  let activeTab = $state<'evasion' | 'performance' | 'scale' | 'activities' | 'prestige'>('evasion');

  const tabs = [
    { id: 'evasion', label: 'EVASION' },
    { id: 'performance', label: 'PERFORMANCE' },
    { id: 'scale', label: 'SCALE' },
    { id: 'activities', label: 'ACTIVITIES' },
    { id: 'prestige', label: 'PRESTIGE' },
  ] as const;

  function canAfford(cost: number): boolean {
    return gameState.gp >= cost;
  }

  function canPurchase(id: UpgradeId): boolean {
    const u = UPGRADES[id];
    if (!u) return false;
    if (gameState.purchasedUpgrades.includes(id)) return false;
    if (!canAfford(u.cost)) return false;
    if (u.requires.some(r => !gameState.purchasedUpgrades.includes(r))) return false;
    return true;
  }

  function upgradeStatus(id: UpgradeId): 'owned' | 'available' | 'locked' | 'unaffordable' {
    if (gameState.purchasedUpgrades.includes(id)) return 'owned';
    const u = UPGRADES[id];
    if (u.requires.some(r => !gameState.purchasedUpgrades.includes(r))) return 'locked';
    if (!canAfford(u.cost)) return 'unaffordable';
    return 'available';
  }

  function activityStatus(id: ActivityId): 'unlocked' | 'available' | 'unaffordable' {
    if (gameState.unlockedActivities.includes(id)) return 'unlocked';
    const a = ACTIVITIES[id];
    if (!canAfford(a.unlockCost)) return 'unaffordable';
    return 'available';
  }

  const treeUpgrades = $derived((tree: 'evasion' | 'performance' | 'scale') =>
    Object.values(UPGRADES).filter(u => u.tree === tree)
  );

  const allActivities = $derived(
    Object.values(ACTIVITIES).filter(a => a.unlockCost > 0).sort((a, b) => a.tier - b.tier || a.gpPerHour - b.gpPerHour)
  );

  function formatSkillReqs(reqs: Record<string, number>): string {
    const entries = Object.entries(reqs);
    if (entries.length === 0) return '';
    const combatSkills = new Set(['attack', 'strength', 'defence', 'hitpoints', 'prayer', 'ranged', 'magic']);
    const isCombatOnly = entries.every(([k]) => combatSkills.has(k));
    if (isCombatOnly && entries.length >= 2) {
      return `CMB ${Math.max(...entries.map(([, v]) => v))}+`;
    }
    const abbrev: Record<string, string> = {
      attack: 'ATK', strength: 'STR', defence: 'DEF', hitpoints: 'HP',
      prayer: 'PRA', ranged: 'RNG', magic: 'MAG', woodcutting: 'WC',
      fishing: 'FSH', mining: 'MIN', thieving: 'THV', runecrafting: 'RC',
      agility: 'AGI', smithing: 'SMI', slayer: 'SLY',
    };
    return entries.map(([k, v]) => `${abbrev[k] ?? k.toUpperCase()} ${v}`).join(' · ');
  }
</script>

<div class="upgrade-tree">
  <div class="tab-bar">
    {#each tabs as tab}
    <button
      class="tab"
      class:active={activeTab === tab.id}
      onclick={() => activeTab = tab.id}
    >{tab.label}</button>
    {/each}
  </div>

  <div class="tab-content">
    {#if activeTab === 'evasion' || activeTab === 'performance' || activeTab === 'scale'}
      {@const tree = activeTab}
      <div class="upgrade-grid">
        {#each treeUpgrades(tree) as upgrade}
          {@const status = upgradeStatus(upgrade.id)}
          <div class="upgrade-card" class:owned={status === 'owned'} class:locked={status === 'locked'}>
            <div class="upg-name">{upgrade.name}</div>
            <div class="upg-desc">{upgrade.description}</div>
            {#if upgrade.requires.length > 0}
            <div class="upg-requires">Requires: {upgrade.requires.map(r => UPGRADES[r]?.name).join(', ')}</div>
            {/if}
            <div class="upg-footer">
              <span class="upg-cost" style="color: {canAfford(upgrade.cost) ? '#ffdd00' : '#666'}">{formatGp(upgrade.cost)} GP</span>
              {#if status === 'owned'}
                <span class="upg-badge owned">OWNED</span>
              {:else if status === 'locked'}
                <span class="upg-badge locked">LOCKED</span>
              {:else}
                <button class="btn-buy" onclick={() => purchaseUpgrade(upgrade.id as UpgradeId)} disabled={status === 'unaffordable'}>
                  {status === 'unaffordable' ? 'NEED MORE GP' : 'PURCHASE'}
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>

    {:else if activeTab === 'activities'}
      <div class="upgrade-grid">
        {#each allActivities as activity}
          {@const status = activityStatus(activity.id)}
          <div class="upgrade-card" class:owned={status === 'unlocked'}>
            <div class="upg-name">
              {activity.name}
              <span class="tier-tag" style="color: {['','#c0a060','#ffa500','#ff8c00','#ff4444'][activity.tier]}">T{activity.tier}</span>
            </div>
            <div class="activity-badges">
              {#if activity.requiresPremium}<span class="acct-badge premium">[Premium]</span>{:else if activity.requiresMembers}<span class="acct-badge members">[Members]</span>{/if}
              {#if Object.keys(activity.skillRequirements).length > 0}<span class="skill-req">{formatSkillReqs(activity.skillRequirements)}</span>{/if}
              {#if activity.teamSize > 1}<span class="team-badge">{activity.teamSize}-bot team</span>{/if}
            </div>
            <div class="upg-desc">{activity.unlockDescription}</div>
            <div class="activity-stats">
              <span style="color: #ffdd00">{formatGp(activity.gpPerHour)}/hr</span>
              <span style="color: {activity.suspicionPerHour > 4 ? '#ff4444' : activity.suspicionPerHour > 2.5 ? '#ffa500' : '#00ff41'}">
                Susp: +{activity.suspicionPerHour}/hr
              </span>
            </div>
            <div class="upg-footer">
              <span class="upg-cost" style="color: {canAfford(activity.unlockCost) ? '#ffdd00' : '#666'}">{formatGp(activity.unlockCost)} GP</span>
              {#if status === 'unlocked'}
                <span class="upg-badge owned">UNLOCKED</span>
              {:else}
                <button class="btn-buy" onclick={() => unlockActivity(activity.id)} disabled={status === 'unaffordable'}>
                  {status === 'unaffordable' ? 'NEED MORE GP' : 'UNLOCK'}
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>

    {:else if activeTab === 'prestige'}
      <div class="prestige-header">
        <span>Prestige Points: <b style="color:#7df">{gameState.prestigePoints} PP</b></span>
        <span style="color:#888; font-size:9px">Earned by selling high-level bot accounts</span>
      </div>
      <div class="upgrade-grid">
        {#each Object.values(PRESTIGE_UPGRADES) as upgrade}
          {@const owned = gameState.raw.purchasedPrestigeUpgrades.includes(upgrade.id)}
          {@const canBuy = gameState.prestigePoints >= upgrade.ppCost && !owned}
          <div class="upgrade-card prestige-card" class:owned>
            <div class="upg-name">{upgrade.name}</div>
            <div class="upg-desc">{upgrade.description}</div>
            <div class="upg-footer">
              <span class="upg-cost" style="color: {canBuy || owned ? '#7df' : '#666'}">{upgrade.ppCost} PP</span>
              {#if owned}
                <span class="upg-badge owned">OWNED</span>
              {:else}
                <button class="btn-buy prestige" onclick={() => purchasePrestigeUpgrade(upgrade.id as PrestigeUpgradeId)} disabled={!canBuy}>
                  {canBuy ? 'PURCHASE' : 'NEED MORE PP'}
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .upgrade-tree { display: flex; flex-direction: column; height: 100%; font-family: 'Share Tech Mono', monospace; }

  .tab-bar { display: flex; gap: 2px; padding: 6px 6px 0; background: #2a1f14; border-bottom: 1px solid #5a3f2a; flex-wrap: wrap; }
  .tab { font-family: inherit; font-size: 9px; padding: 4px 8px; background: transparent; border: 1px solid #5a3f2a; color: #888; cursor: pointer; letter-spacing: 0.5px; }
  .tab:hover { color: #c0a060; border-color: #8c6239; }
  .tab.active { background: #3d2b1f; color: #f0d080; border-color: #8c6239; border-bottom-color: #3d2b1f; }

  .tab-content { flex: 1; overflow-y: auto; padding: 8px; }
  .tab-content::-webkit-scrollbar { width: 4px; }
  .tab-content::-webkit-scrollbar-thumb { background: #5a3f2a; }

  .upgrade-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }

  .upgrade-card {
    background: #2a1f14;
    border: 1px solid #5a3f2a;
    padding: 8px;
    font-size: 10px;
    color: #c0a060;
    transition: border-color 0.2s;
  }
  .upgrade-card:hover { border-color: #8c6239; }
  .upgrade-card.owned { border-color: #00ff41; opacity: 0.7; }
  .upgrade-card.locked { opacity: 0.5; }
  .upgrade-card.prestige-card { border-color: #4a3a6a; }
  .upgrade-card.prestige-card.owned { border-color: #7df; }

  .upg-name { color: #f0d080; font-size: 11px; margin-bottom: 4px; }
  .tier-tag { margin-left: 6px; font-size: 9px; }
  .upg-desc { color: #888; font-size: 9px; line-height: 1.4; margin-bottom: 4px; }
  .upg-requires { color: #555; font-size: 9px; margin-bottom: 4px; font-style: italic; }
  .activity-badges { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; margin-bottom: 4px; }
  .acct-badge { font-size: 8px; padding: 1px 4px; border: 1px solid; }
  .acct-badge.members { color: #00ff41; border-color: #00ff41; }
  .acct-badge.premium { color: #7df; border-color: #7df; }
  .skill-req { color: #888; font-size: 8px; }
  .team-badge { color: #ffa500; font-size: 8px; }
  .activity-stats { display: flex; gap: 12px; font-size: 9px; margin-bottom: 4px; }
  .prestige-header { display: flex; justify-content: space-between; align-items: center; padding: 6px 0 10px; font-size: 11px; color: #c0a060; }

  .upg-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; border-top: 1px solid #3a2a1a; padding-top: 6px; }
  .upg-cost { font-size: 10px; }
  .upg-badge { font-size: 9px; padding: 2px 6px; }
  .upg-badge.owned { color: #00ff41; border: 1px solid #00ff41; }
  .upg-badge.locked { color: #555; border: 1px solid #444; }

  .btn-buy {
    font-family: inherit; font-size: 9px; padding: 3px 8px;
    background: #3d2b1f; border: 1px solid #8c6239; color: #c0a060;
    cursor: pointer; letter-spacing: 0.5px;
  }
  .btn-buy:hover:not(:disabled) { background: #5a3f2a; color: #f0d080; }
  .btn-buy:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-buy.prestige { border-color: #7df; color: #7df; }
  .btn-buy.prestige:hover:not(:disabled) { background: #1a2a3a; }
</style>
