<script lang="ts">
  import Icon from './Icon.svelte';

  interface Props {
    tone?: 'info' | 'warning';
    title: string;
    body: string;
  }

  let { tone = 'info', title, body }: Props = $props();
</script>

<div class="notice-banner notice-banner--{tone}" role="status" aria-live="polite">
  <span class="notice-icon" aria-hidden="true">
    <Icon name={tone === 'warning' ? 'status-fail' : 'help'} size="16px" />
  </span>
  <div class="notice-copy">
    <span class="notice-title">{title}</span>
    <span class="notice-body">{body}</span>
  </div>
</div>

<style>
  .notice-banner {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    border: var(--border-width-thin) solid transparent;
    font-size: var(--font-size-sm);
  }

  .notice-banner--info {
    background: color-mix(in oklab, var(--accent) 8%, var(--bg-primary));
    border-color: color-mix(in oklab, var(--accent) 35%, var(--border));
    color: var(--text-primary);
  }

  .notice-banner--info .notice-icon {
    color: color-mix(in oklab, var(--accent) 72%, var(--text-primary));
  }

  .notice-banner--warning {
    background: var(--badge-warning-bg);
    border-color: var(--badge-warning-border);
    color: var(--badge-warning-text);
  }

  .notice-icon {
    flex-shrink: 0;
    margin-top: 1px;
  }

  .notice-copy {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .notice-title {
    font-weight: var(--font-weight-semibold);
  }

  .notice-body {
    color: var(--text-secondary);
    line-height: var(--line-height-normal);
  }

  .notice-banner--warning .notice-body {
    color: inherit;
  }
</style>
