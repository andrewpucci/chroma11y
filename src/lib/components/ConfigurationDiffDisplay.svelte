<script lang="ts">
  import { referenceConfiguration } from '$lib/stores';
  import { diffColorStates } from '$lib/comparisonDiff';
  import Card from './Card.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    currentConfig: Record<string, unknown>;
  }

  let { currentConfig }: Props = $props();

  let configDiff = $derived.by(() => {
    if (!$referenceConfiguration) return null;
    return diffColorStates(
      currentConfig,
      $referenceConfiguration as unknown as Record<string, unknown>
    );
  });

  function formatValue(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.length} items]`;
    }
    if (typeof value === 'object' && value !== null) {
      return '[object]';
    }
    return String(value);
  }
</script>

{#if configDiff && configDiff.hasChanges}
  <Card
    title="Configuration Diff"
    subtitle="Differences from Reference"
    data-testid="configuration-diff-card"
  >
    <div class="diff-content">
      {#if configDiff.generationChanges.length > 0}
        <div class="diff-section">
          <h4 class="section-title">
            <Icon name="settings" size="sm" />
            Generation Settings
          </h4>
          <ul class="diff-list">
            {#each configDiff.generationChanges as change (change.field)}
              <li class="diff-entry">
                <span class="field-label">{change.label}</span>
                <span class="field-values">
                  <span class="current-value">{formatValue(change.currentValue)}</span>
                  <span class="arrow">→</span>
                  <span class="reference-value">{formatValue(change.referenceValue)}</span>
                </span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if configDiff.contrastChanges.length > 0}
        <div class="diff-section">
          <h4 class="section-title">
            <Icon name="contrast" size="sm" />
            Contrast Settings
          </h4>
          <ul class="diff-list">
            {#each configDiff.contrastChanges as change (change.field)}
              <li class="diff-entry">
                <span class="field-label">{change.label}</span>
                <span class="field-values">
                  <span class="current-value">{formatValue(change.currentValue)}</span>
                  <span class="arrow">→</span>
                  <span class="reference-value">{formatValue(change.referenceValue)}</span>
                </span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if configDiff.namingChanges.length > 0}
        <div class="diff-section">
          <h4 class="section-title">
            <Icon name="edit" size="sm" />
            Custom Names
          </h4>
          <ul class="diff-list">
            {#each configDiff.namingChanges as change (change.field)}
              <li class="diff-entry">
                <span class="field-label">{change.label}</span>
                <span class="field-values">
                  <span class="current-value">{formatValue(change.currentValue)}</span>
                  <span class="arrow">→</span>
                  <span class="reference-value">{formatValue(change.referenceValue)}</span>
                </span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  </Card>
{:else if configDiff}
  <div class="no-changes-notice" role="status">
    <Icon name="check" size="sm" />
    <p>Current and Reference configurations match</p>
  </div>
{/if}

<style>
  .diff-content {
    display: grid;
    gap: var(--space-md);
  }

  .diff-section {
    display: grid;
    gap: var(--space-sm);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0;
    padding: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .diff-list {
    display: grid;
    gap: var(--space-xs);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .diff-entry {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-sm);
    background: var(--bg-secondary);
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .field-label {
    font-weight: 500;
    color: var(--text-primary);
    flex-shrink: 0;
  }

  .field-values {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-family: monospace;
    font-size: 0.8125rem;
    color: var(--text-secondary);
    overflow: auto;
    flex-shrink: 1;
    min-width: 0;
  }

  .current-value {
    padding: 2px 6px;
    background: var(--bg-tertiary);
    border-radius: 3px;
    color: var(--text-primary);
  }

  .arrow {
    flex-shrink: 0;
    color: var(--text-secondary);
  }

  .reference-value {
    padding: 2px 6px;
    background: var(--bg-tertiary);
    border-radius: 3px;
    color: var(--text-primary);
  }

  .no-changes-notice {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md);
    background: var(--bg-secondary);
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .no-changes-notice p {
    margin: 0;
  }
</style>
