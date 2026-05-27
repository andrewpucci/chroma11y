<script lang="ts">
  import { diffColorStates, type DiffEntry } from '$lib/comparisonDiff';
  import Badge from './Badge.svelte';
  import Card from './Card.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    currentConfig: Record<string, unknown>;
    referenceConfig: Record<string, unknown> | null;
  }

  interface DiffSection {
    key: string;
    title: string;
    icon: 'settings' | 'contrast' | 'check' | 'edit';
    entries: DiffEntry[];
  }

  let { currentConfig, referenceConfig }: Props = $props();

  let configDiff = $derived.by(() =>
    referenceConfig ? diffColorStates(currentConfig, referenceConfig) : null
  );

  let sections = $derived.by<DiffSection[]>(() => {
    if (!configDiff) {
      return [];
    }

    const nextSections: DiffSection[] = [
      {
        key: 'generation',
        title: 'Generation Settings',
        icon: 'settings',
        entries: configDiff.generationChanges
      },
      {
        key: 'contrast',
        title: 'Contrast Settings',
        icon: 'contrast',
        entries: configDiff.contrastChanges
      },
      {
        key: 'constraints',
        title: 'Constraints',
        icon: 'check',
        entries: configDiff.constraintChanges
      },
      {
        key: 'naming',
        title: 'Custom Names',
        icon: 'edit',
        entries: configDiff.namingChanges
      }
    ];

    return nextSections.filter((section) => section.entries.length > 0);
  });

  function getActionLabel(kind: DiffEntry['kind']): 'Added' | 'Removed' {
    return kind === 'added' ? 'Added' : 'Removed';
  }

  function getActionVariant(kind: DiffEntry['kind']): 'accent' | 'warning' {
    return kind === 'added' ? 'accent' : 'warning';
  }

  function getOneSidedValue(entry: DiffEntry): string {
    return entry.kind === 'added' ? (entry.currentValue ?? '') : (entry.referenceValue ?? '');
  }
</script>

{#if configDiff}
  <Card
    title="Configuration Diff"
    subtitle="Authored palette-configuration changes from the pinned reference"
    data-testid="configuration-diff-card"
  >
    {#if configDiff.hasChanges}
      <div class="diff-content">
        {#each sections as section (section.key)}
          <section class="diff-section" aria-label={section.title}>
            <h3 class="section-title">
              <Icon name={section.icon} size="sm" />
              <span>{section.title}</span>
            </h3>

            <ul class="diff-list">
              {#each section.entries as entry (entry.field)}
                <li class="diff-entry">
                  <div class="entry-copy">
                    <span class="field-label">{entry.label}</span>

                    {#if entry.kind === 'changed'}
                      <div class="value-flow" aria-label={`${entry.label} reference to current`}>
                        <span class="value-chip value-chip--reference">{entry.referenceValue}</span>
                        <span class="value-arrow" aria-hidden="true">→</span>
                        <span class="value-chip value-chip--current">{entry.currentValue}</span>
                      </div>
                    {:else}
                      <div class="value-stack">
                        <Badge variant={getActionVariant(entry.kind)}
                          >{getActionLabel(entry.kind)}</Badge
                        >
                        <span class="value-chip value-chip--single">{getOneSidedValue(entry)}</span>
                      </div>
                    {/if}
                  </div>
                </li>
              {/each}
            </ul>
          </section>
        {/each}
      </div>
    {:else}
      <p class="success-state" role="status">No configuration changes</p>
    {/if}
  </Card>
{/if}

<style>
  .diff-content {
    display: grid;
    gap: var(--space-lg);
  }

  .diff-section {
    display: grid;
    gap: var(--space-sm);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--letter-spacing-wide);
    text-transform: uppercase;
  }

  .diff-list {
    display: grid;
    gap: var(--space-sm);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .diff-entry {
    padding: var(--space-sm);
    border: var(--border-width-thin) solid color-mix(in oklab, var(--border) 72%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in oklab, var(--bg-primary) 60%, var(--bg-secondary));
  }

  .entry-copy {
    display: grid;
    gap: var(--space-sm);
  }

  .field-label {
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }

  .value-flow,
  .value-stack {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .value-chip {
    display: inline-flex;
    align-items: center;
    min-height: var(--touch-target-min);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-xs);
    background: var(--bg-tertiary);
    color: var(--text-primary);
    font-family:
      ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
      'Courier New', monospace;
    font-size: var(--font-size-xs);
    line-height: var(--line-height-tight);
    overflow-wrap: anywhere;
  }

  .value-chip--reference {
    border: var(--border-width-thin) solid color-mix(in oklab, var(--border) 88%, transparent);
  }

  .value-chip--current {
    border: var(--border-width-thin) solid color-mix(in oklab, var(--accent) 38%, var(--border));
    background: color-mix(in oklab, var(--accent) 8%, var(--bg-primary));
  }

  .value-chip--single {
    border: var(--border-width-thin) solid color-mix(in oklab, var(--border) 88%, transparent);
  }

  .value-arrow {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  .success-state {
    margin: 0;
    padding: var(--space-sm) var(--space-md);
    border: var(--border-width-thin) solid color-mix(in oklab, var(--border) 72%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in oklab, var(--bg-primary) 72%, var(--bg-secondary));
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
</style>
