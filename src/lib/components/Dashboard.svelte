<script lang="ts">
  import { gameState, collectAllGp, createBot, formatGp, getExportCode, doImportSave } from '../../stores/gameState.svelte';

  let showImportExport = $state(false);
  let exportCode = $state('');
  let importCode = $state('');
  let importError = $state('');

  function handleExport() {
    exportCode = getExportCode();
  }

  function handleImport() {
    if (!importCode.trim()) return;
    const ok = doImportSave(importCode.trim());
    if (ok) {
      importCode = '';
      importError = '';
      showImportExport = false;
    } else {
      importError = 'Invalid save code.';
    }
  }

  const canCreateBot = $derived(gameState.bots.length < gameState.maxBotSlots);
  const totalHeldGp = $derived(gameState.bots.reduce((sum, b) => sum + Math.floor(b.heldGp), 0));
</script>

<div class="dashboard">
  <!-- Operation Overview -->
  <div class="overview-panel">
    <div class="overview-title">OPERATION OVERVIEW</div>
    <div class="overview-grid">
      <div class="stat-block">
        <div class="stat-val gold">{formatGp(gameState.gp)} GP</div>
        <div class="stat-label">BANK</div>
      </div>
      <div class="stat-block">
        <div class="stat-val green">~{formatGp(gameState.totalGpPerHour)}/hr</div>
        <div class="stat-label">INCOME</div>
      </div>
      <div class="stat-block">
        <div class="stat-val">{gameState.activeBotCount}/{gameState.bots.length}</div>
        <div class="stat-label">BOTS ACTIVE</div>
      </div>
      <div class="stat-block">
        <div class="stat-val purple">{gameState.prestigePoints} PP</div>
        <div class="stat-label">PRESTIGE</div>
      </div>
    </div>

    {#if totalHeldGp > 0}
    <div class="collect-all-row">
      <span class="held-label">Uncollected: <b style="color:#ffdd00">{formatGp(totalHeldGp)} GP</b></span>
      <button class="btn-collect-all" onclick={collectAllGp}>COLLECT ALL</button>
    </div>
    {/if}

    <div class="action-bar">
      {#if canCreateBot}
        <button class="btn-action" onclick={createBot}>+ NEW BOT</button>
      {:else}
        <span class="slot-full">Bot slots full — buy more in Scale upgrades</span>
      {/if}
      <button class="btn-action secondary" onclick={() => showImportExport = !showImportExport}>
        SAVE / LOAD
      </button>
    </div>

    {#if showImportExport}
    <div class="import-export">
      <div class="ie-row">
        <button class="btn-ie" onclick={handleExport}>EXPORT SAVE</button>
        {#if exportCode}
        <textarea class="save-code" readonly value={exportCode} onclick={e => (e.target as HTMLTextAreaElement).select()}></textarea>
        {/if}
      </div>
      <div class="ie-row">
        <textarea class="save-code" bind:value={importCode} placeholder="Paste save code here..."></textarea>
        <button class="btn-ie" onclick={handleImport}>IMPORT</button>
        {#if importError}<span class="ie-error">{importError}</span>{/if}
      </div>
    </div>
    {/if}
  </div>

  <!-- Lifetime Stats -->
  <div class="lifetime-panel">
    <div class="lt-title">LIFETIME</div>
    <div class="lt-stat">Total Earned: <b style="color:#ffdd00">{formatGp(gameState.totalEarned)} GP</b></div>
    <div class="lt-stat">Bots Created: <b>{gameState.bots.length}</b></div>
    <div class="lt-stat">Prestige Points: <b style="color:#7df">{gameState.prestigePoints}</b></div>
  </div>
</div>

<style>
  .dashboard { font-family: 'Share Tech Mono', monospace; display: flex; flex-direction: column; gap: 8px; padding: 8px; }

  .overview-panel, .lifetime-panel {
    background: #2a1f14;
    border: 1px solid #5a3f2a;
    padding: 10px;
  }
  .overview-title, .lt-title {
    font-size: 9px;
    color: #888;
    letter-spacing: 1px;
    margin-bottom: 8px;
    border-bottom: 1px solid #3a2a1a;
    padding-bottom: 4px;
  }

  .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
  .stat-block { display: flex; flex-direction: column; gap: 2px; }
  .stat-val { font-size: 16px; color: #f0d080; }
  .stat-val.gold { color: #ffdd00; }
  .stat-val.green { color: #00ff41; }
  .stat-val.purple { color: #c060c0; }
  .stat-label { font-size: 8px; color: #666; letter-spacing: 0.5px; }

  .collect-all-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 10px; color: #c0a060; }
  .btn-collect-all { font-family: inherit; font-size: 9px; padding: 4px 10px; background: #2a2200; border: 1px solid #ffdd00; color: #ffdd00; cursor: pointer; }
  .btn-collect-all:hover { background: #3a3200; }

  .action-bar { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .btn-action { font-family: inherit; font-size: 10px; padding: 5px 12px; background: #2a3a2a; border: 1px solid #00ff41; color: #00ff41; cursor: pointer; letter-spacing: 0.5px; }
  .btn-action:hover { background: #1a2a1a; }
  .btn-action.secondary { background: #2a1f14; border-color: #8c6239; color: #c0a060; }
  .btn-action.secondary:hover { background: #3d2b1f; }
  .slot-full { font-size: 9px; color: #666; }

  .import-export { margin-top: 8px; border-top: 1px solid #3a2a1a; padding-top: 8px; display: flex; flex-direction: column; gap: 6px; }
  .ie-row { display: flex; gap: 6px; align-items: flex-start; }
  .save-code { flex: 1; background: #1a1009; border: 1px solid #5a3f2a; color: #c0a060; font-family: inherit; font-size: 9px; padding: 4px; height: 50px; resize: none; }
  .btn-ie { font-family: inherit; font-size: 9px; padding: 4px 8px; background: #2a1f14; border: 1px solid #8c6239; color: #c0a060; cursor: pointer; white-space: nowrap; }
  .btn-ie:hover { color: #f0d080; }
  .ie-error { color: #ff4444; font-size: 9px; }

  .lt-stat { font-size: 10px; color: #c0a060; margin-bottom: 3px; }
  .lt-stat b { color: #f0d080; }
</style>
