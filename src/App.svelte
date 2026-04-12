<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { startGameLoop, stopGameLoop, gameState } from './stores/gameState.svelte';
  import BotCard from './lib/components/BotCard.svelte';
  import EventLog from './lib/components/EventLog.svelte';
  import UpgradeTree from './lib/components/UpgradeTree.svelte';
  import Dashboard from './lib/components/Dashboard.svelte';

  let activeTab = $state<'bots' | 'upgrades'>('bots');

  onMount(() => startGameLoop());
  onDestroy(() => stopGameLoop());
</script>

<div class="app">
  <!-- Top Bar -->
  <header class="topbar">
    <div class="logo">
      <span class="logo-main">RUNEBOT INC.</span>
      <span class="logo-sub">— Operation Management Terminal —</span>
    </div>
    <nav class="nav">
      <button class="nav-btn" class:active={activeTab === 'bots'} onclick={() => activeTab = 'bots'}>BOTS</button>
      <button class="nav-btn" class:active={activeTab === 'upgrades'} onclick={() => activeTab = 'upgrades'}>UPGRADES</button>
    </nav>
    <div class="topbar-gp">
      <span class="gp-label">BANK:</span>
      <span class="gp-val">{gameState.gp.toLocaleString()} GP</span>
    </div>
  </header>

  <!-- Scanline overlay -->
  <div class="scanlines" aria-hidden="true"></div>

  <!-- Main Layout -->
  <div class="layout">
    <!-- Left sidebar: dashboard overview -->
    <aside class="sidebar">
      <Dashboard />
    </aside>

    <!-- Main content area -->
    <main class="main-content">
      {#if activeTab === 'bots'}
        <div class="bots-panel">
          {#if gameState.bots.length === 0}
            <div class="empty-state">
              No bots. Create one from the dashboard.
            </div>
          {:else}
            <div class="bots-grid">
              {#each gameState.bots as bot (bot.id)}
                <BotCard {bot} />
              {/each}
            </div>
          {/if}
        </div>
      {:else if activeTab === 'upgrades'}
        <div class="upgrades-panel">
          <UpgradeTree />
        </div>
      {/if}
    </main>

    <!-- Right sidebar: event log -->
    <aside class="event-sidebar">
      <EventLog />
    </aside>
  </div>

  <!-- Footer ticker -->
  <footer class="footer-ticker">
    <span class="ticker-text">
      :: RUNEBOT INC. v0.1 &nbsp;|&nbsp;
      {gameState.activeBotCount} bot{gameState.activeBotCount !== 1 ? 's' : ''} active &nbsp;|&nbsp;
      ~{Math.floor(gameState.totalGpPerHour).toLocaleString()} GP/hr &nbsp;|&nbsp;
      Total earned: {gameState.totalEarned.toLocaleString()} GP &nbsp;|&nbsp;
      Prestige: {gameState.prestigePoints} PP &nbsp;|&nbsp;
      Risk responsibly. &nbsp;::
    </span>
  </footer>
</div>

<style>
  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) {
    background: #1a1009;
    color: #f0d080;
    font-family: 'Share Tech Mono', monospace;
    overflow: hidden;
    height: 100vh;
  }

  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: relative;
  }

  /* Scanline effect */
  .scanlines {
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 2px,
      rgba(0, 0, 0, 0.08) 2px,
      rgba(0, 0, 0, 0.08) 4px
    );
    pointer-events: none;
    z-index: 1000;
  }

  /* Top Bar */
  .topbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px 12px;
    background: #2a1f14;
    border-bottom: 2px solid #8c6239;
    flex-shrink: 0;
    z-index: 10;
  }
  .logo { display: flex; flex-direction: column; gap: 1px; }
  .logo-main { font-family: 'Press Start 2P', monospace; font-size: 12px; color: #f0d080; letter-spacing: 1px; }
  .logo-sub { font-size: 8px; color: #666; }

  .nav { display: flex; gap: 4px; margin-left: 16px; }
  .nav-btn { font-family: 'Share Tech Mono', monospace; font-size: 10px; padding: 5px 14px; background: transparent; border: 1px solid #5a3f2a; color: #888; cursor: pointer; letter-spacing: 1px; }
  .nav-btn:hover { color: #c0a060; border-color: #8c6239; }
  .nav-btn.active { background: #3d2b1f; color: #f0d080; border-color: #8c6239; }

  .topbar-gp { margin-left: auto; display: flex; gap: 8px; align-items: center; }
  .gp-label { font-size: 9px; color: #888; }
  .gp-val { font-size: 16px; color: #ffdd00; font-family: 'Share Tech Mono', monospace; }

  /* Layout */
  .layout {
    display: grid;
    grid-template-columns: 220px 1fr 220px;
    flex: 1;
    overflow: hidden;
  }

  .sidebar {
    border-right: 1px solid #5a3f2a;
    overflow-y: auto;
    background: #1e1409;
  }
  .sidebar::-webkit-scrollbar { width: 4px; }
  .sidebar::-webkit-scrollbar-thumb { background: #5a3f2a; }

  .main-content {
    overflow-y: auto;
    padding: 8px;
    background: #1a1009;
  }
  .main-content::-webkit-scrollbar { width: 6px; }
  .main-content::-webkit-scrollbar-thumb { background: #5a3f2a; }

  .event-sidebar {
    border-left: 1px solid #5a3f2a;
    overflow: hidden;
    background: #1e1409;
    display: flex;
    flex-direction: column;
  }

  /* Bot grid */
  .bots-panel { height: 100%; }
  .bots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; }
  .empty-state { color: #555; font-size: 11px; padding: 20px; text-align: center; }

  /* Upgrades panel */
  .upgrades-panel { height: 100%; display: flex; flex-direction: column; }
  .upgrades-panel :global(.upgrade-tree) { height: 100%; }

  /* Footer ticker */
  .footer-ticker {
    background: #0e0906;
    border-top: 1px solid #3a2a1a;
    padding: 4px 8px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .ticker-text {
    font-size: 9px;
    color: #555;
    white-space: nowrap;
    animation: ticker 30s linear infinite;
    display: inline-block;
  }
  @keyframes ticker {
    from { transform: translateX(100vw); }
    to { transform: translateX(-100%); }
  }
</style>
