<script lang="ts">
  import { onMount } from 'svelte';
  import { Radio } from 'lucide-svelte';

  interface Bay {
    id: string;
    type: 'flat' | 'hoist' | 'detail';
    label: string;
    status: 'available' | 'occupied' | 'reserved';
  }

  interface BayStatus {
    ts: number;
    bays: Bay[];
  }

  interface Props {
    /** Show compact view (for homepage widget) */
    compact?: boolean;
  }

  const { compact = false }: Props = $props();

  let status = $state<BayStatus | null>(null);
  let connected = $state(false);
  let lastUpdate = $state<Date | null>(null);

  const statusLabel = $derived(() => {
    if (!status) return 'Loading…';
    const avail = status.bays.filter(b => b.status === 'available').length;
    return `${avail} of ${status.bays.length} bays available`;
  });

  const statusColor = (s: Bay['status']) => {
    switch (s) {
      case 'available': return 'status-available';
      case 'occupied': return 'status-occupied';
      case 'reserved': return 'status-reserved';
    }
  };

  const typeLabel = (t: Bay['type']) =>
    t === 'flat' ? 'Flat' : t === 'hoist' ? 'Hoist' : 'Detail';

  onMount(() => {
    const source = new EventSource('/api/bays/stream');

    source.onopen = () => { connected = true; };
    // Silently handle connection failures — expected when SSE endpoint is unavailable
    // (e.g. during Lighthouse audits or when the server stream isn't active)
    source.onerror = () => { connected = false; };

    source.onmessage = (e) => {
      try {
        status = JSON.parse(e.data) as BayStatus;
        lastUpdate = new Date();
      } catch {}
    };

    return () => source.close();
  });
</script>

<div class="bay-grid-wrap" class:compact>
  <!-- Header -->
  <div class="grid-header">
    <div class="grid-title-row">
      <h3 class="grid-title">Live Bay Status</h3>
      <div class="live-indicator" class:connected>
        <Radio size={12} />
        <span>{connected ? 'Live' : 'Connecting…'}</span>
      </div>
    </div>
    {#if status}
      <p class="grid-summary">{statusLabel()}</p>
    {/if}
  </div>

  <!-- Bay cells -->
  {#if status}
    <div class="bays-cells" class:compact>
      {#each status.bays as bay}
        <div class="bay-cell {statusColor(bay.status)}">
          <span class="bay-type-tag">{typeLabel(bay.type)}</span>
          <span class="bay-label">{bay.label}</span>
          <span class="bay-status-dot"></span>
        </div>
      {/each}
    </div>

    <!-- Legend -->
    {#if !compact}
      <div class="legend">
        <span class="legend-item avail"><span class="dot"></span>Available</span>
        <span class="legend-item reserved"><span class="dot"></span>Reserved</span>
        <span class="legend-item occ"><span class="dot"></span>Occupied</span>
      </div>
    {/if}
  {:else}
    <div class="skeleton-grid" class:compact>
      {#each Array(7) as _}
        <div class="skeleton-cell"></div>
      {/each}
    </div>
  {/if}

  {#if lastUpdate && !compact}
    <p class="last-update">Updated {lastUpdate.toLocaleTimeString()}</p>
  {/if}
</div>

<style>
  .bay-grid-wrap {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 0.875rem;
    padding: 1.5rem;
  }

  .grid-header {
    margin-bottom: 1.25rem;
  }

  .grid-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.25rem;
  }

  .grid-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  .live-indicator {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .live-indicator.connected {
    color: var(--success);
  }

  .grid-summary {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .bays-cells {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.625rem;
  }

  .bays-cells.compact {
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 0.5rem;
  }

  .bay-cell {
    border-radius: 0.5rem;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    border: 1px solid transparent;
    position: relative;
    transition: opacity 0.2s;
  }

  .bay-type-tag {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.7;
  }

  .bay-label {
    font-size: 0.8125rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bay-status-dot {
    position: absolute;
    top: 0.625rem;
    right: 0.625rem;
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  /* Status colors */
  .status-available {
    background: rgba(34, 197, 94, 0.08);
    border-color: rgba(34, 197, 94, 0.2);
    color: #86efac;
  }
  .status-available .bay-status-dot {
    background: #22c55e;
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  }

  .status-reserved {
    background: rgba(245, 158, 11, 0.08);
    border-color: rgba(245, 158, 11, 0.2);
    color: #fcd34d;
  }
  .status-reserved .bay-status-dot {
    background: #f59e0b;
  }

  .status-occupied {
    background: rgba(239, 68, 68, 0.08);
    border-color: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
    opacity: 0.7;
  }
  .status-occupied .bay-status-dot {
    background: #ef4444;
  }

  /* Legend */
  .legend {
    display: flex;
    gap: 1.25rem;
    margin-top: 1rem;
    padding-top: 0.875rem;
    border-top: 1px solid var(--border);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .legend-item .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
  .avail .dot { background: #22c55e; }
  .reserved .dot { background: #f59e0b; }
  .occ .dot { background: #ef4444; }

  .last-update {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-align: right;
    margin: 0.75rem 0 0;
  }

  /* Skeleton */
  .skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.625rem;
  }

  .skeleton-grid.compact {
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 0.5rem;
  }

  .skeleton-cell {
    height: 64px;
    border-radius: 0.5rem;
    background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-secondary) 50%, var(--bg-elevated) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
