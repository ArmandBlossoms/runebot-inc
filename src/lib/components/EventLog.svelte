<script lang="ts">
  import { gameState } from '../../stores/gameState.svelte';

  function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  }

  function eventColor(type: string): string {
    switch (type) {
      case 'detection': return '#ff4444';
      case 'level_up': return '#00ff41';
      case 'sale': return '#c060c0';
      case 'prestige': return '#7df';
      default: return '#888';
    }
  }

  function eventPrefix(type: string): string {
    switch (type) {
      case 'detection': return '⚠';
      case 'level_up': return '↑';
      case 'sale': return '$';
      case 'prestige': return '★';
      default: return '·';
    }
  }
</script>

<div class="event-log">
  <div class="log-header">EVENT LOG</div>
  <div class="log-body">
    {#each gameState.eventLog as event (event.id)}
    <div class="log-entry" style="border-left-color: {eventColor(event.type)}">
      <span class="log-prefix" style="color: {eventColor(event.type)}">{eventPrefix(event.type)}</span>
      <span class="log-content">
        {#if event.botName}<span class="log-bot">{event.botName}</span>{' — '}{/if}{event.message}
      </span>
      <span class="log-time">{timeAgo(event.timestamp)}</span>
    </div>
    {:else}
    <div class="log-empty">Waiting for activity...</div>
    {/each}
  </div>
</div>

<style>
  .event-log {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    color: #c0a060;
  }
  .log-header {
    font-size: 9px;
    color: #888;
    letter-spacing: 1px;
    padding: 6px 8px 4px;
    border-bottom: 1px solid #5a3f2a;
    background: #2a1f14;
  }
  .log-body {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }
  .log-body::-webkit-scrollbar { width: 4px; }
  .log-body::-webkit-scrollbar-track { background: #1a1009; }
  .log-body::-webkit-scrollbar-thumb { background: #5a3f2a; }

  .log-entry {
    display: flex;
    gap: 5px;
    align-items: baseline;
    padding: 3px 8px;
    border-left: 2px solid #888;
    margin: 2px 0;
    animation: slide-in 0.2s ease;
  }
  @keyframes slide-in {
    from { opacity: 0; transform: translateX(-4px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .log-prefix { flex-shrink: 0; font-size: 11px; }
  .log-content { flex: 1; line-height: 1.4; word-break: break-word; }
  .log-bot { color: #f0d080; }
  .log-time { flex-shrink: 0; color: #555; font-size: 9px; white-space: nowrap; }

  .log-empty { color: #444; padding: 12px 8px; font-size: 10px; }
</style>
