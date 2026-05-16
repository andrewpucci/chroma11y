<script lang="ts">
  import {
    comparisonMetric,
    swatchChangeThreshold,
    setComparisonMetric,
    setSwatchChangeThreshold
  } from '$lib/stores';
  import SelectField from './SelectField.svelte';
  import SliderNumberField from './SliderNumberField.svelte';

  // Comparison metric options
  const metricOptions = [
    { value: 'ok', label: 'Delta E OK' },
    { value: '2000', label: 'Delta E 2000' }
  ];

  let comparisonMetricLocal = $derived($comparisonMetric);
  let swatchChangeThresholdLocal = $derived($swatchChangeThreshold);

  function handleMetricChange(value: string): void {
    if (value === 'ok' || value === '2000') {
      setComparisonMetric(value);
    }
  }

  function handleThresholdChange(event: Event): void {
    if (event.currentTarget instanceof HTMLInputElement) {
      const value = event.currentTarget.valueAsNumber;
      if (!Number.isNaN(value)) {
        setSwatchChangeThreshold(value);
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
    bind:value={swatchChangeThresholdLocal}
    min={0}
    max={100}
    step={1}
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
