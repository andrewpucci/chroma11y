<script lang="ts">
  import {
    comparisonMetric,
    swatchChangeThreshold,
    setComparisonMetric,
    setSwatchChangeThreshold
  } from '$lib/stores';
  import type { ColorDifferenceMetric } from '$lib/types';
  import SelectField from './SelectField.svelte';
  import SliderNumberField from './SliderNumberField.svelte';

  interface Props {
    onHistoryCommit?: (message: string) => void;
  }

  let { onHistoryCommit = () => {} }: Props = $props();

  // Comparison metric options
  const metricOptions = [
    { value: 'ok', label: 'Delta E OK' },
    { value: '2000', label: 'Delta E 2000' }
  ];

  const thresholdFieldByMetric: Record<
    ColorDifferenceMetric,
    { min: number; max: number; step: number }
  > = {
    ok: { min: 0, max: 0.1, step: 0.005 },
    '2000': { min: 0, max: 10, step: 0.5 }
  };

  let comparisonMetricLocal = $derived($comparisonMetric);
  let swatchChangeThresholdLocal = $derived($swatchChangeThreshold);
  let thresholdFieldLocal = $derived(thresholdFieldByMetric[comparisonMetricLocal]);

  function handleMetricChange(value: string): void {
    if (value === 'ok' || value === '2000') {
      setComparisonMetric(value);
      onHistoryCommit('Comparison metric changed');
    }
  }

  function handleThresholdChange(event: Event): void {
    if (event.currentTarget instanceof HTMLInputElement) {
      const value = event.currentTarget.valueAsNumber;
      if (!Number.isNaN(value)) {
        setSwatchChangeThreshold(value);
        onHistoryCommit('Swatch change threshold changed');
      }
    }
  }
</script>

<div class="comparison-controls" aria-label="Comparison view controls">
  <SelectField
    id="comparison-metric"
    label="Comparison Metric"
    value={comparisonMetricLocal}
    options={metricOptions}
    ariaLabel="Select comparison metric for swatch color changes"
    helpId="comparison-metric-help"
    helpLabel="Help"
    helpText="Metric used to determine color change magnitude in swatches"
    onchange={handleMetricChange}
  />

  <SliderNumberField
    id="swatch-threshold"
    label="Swatch Change Threshold"
    valueInputLabel="Swatch change threshold value"
    rangeAriaLabel="Swatch change threshold slider"
    bind:value={swatchChangeThresholdLocal}
    min={thresholdFieldLocal.min}
    max={thresholdFieldLocal.max}
    step={thresholdFieldLocal.step}
    groupHelpText="Minimum color difference before a swatch is flagged as changed. Higher values suppress smaller changes."
    onRangeChange={handleThresholdChange}
    onNumberChange={handleThresholdChange}
  />
</div>

<style>
  .comparison-controls {
    display: grid;
    gap: var(--space-md);
  }
</style>
