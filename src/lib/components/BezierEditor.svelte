<script lang="ts">
  interface Props {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }

  let {
    x1 = $bindable(0),
    y1 = $bindable(0),
    x2 = $bindable(1),
    y2 = $bindable(1)
  }: Props = $props();

  // SVG coordinate system: viewBox is padded to allow handle lines to extend
  const size = 200;
  const pad = 24;
  const total = size + pad * 2;

  // Convert normalized 0–1 coords to SVG pixel coords (Y flipped: 0=bottom, 1=top)
  function toSvgX(v: number) {
    return pad + v * size;
  }
  function toSvgY(v: number) {
    return pad + (1 - v) * size;
  }
  // Convert SVG pixel coords back to normalized 0–1
  function fromSvgX(px: number) {
    return Math.min(1, Math.max(0, (px - pad) / size));
  }
  function fromSvgY(py: number) {
    return Math.min(1, Math.max(0, 1 - (py - pad) / size));
  }
  function normalizeCoordinate(value: number) {
    return Math.round(Math.min(1, Math.max(0, value)) * 100) / 100;
  }

  function setPointCoordinates(point: 'p1' | 'p2', nextX: number, nextY: number) {
    const normalizedX = normalizeCoordinate(nextX);
    const normalizedY = normalizeCoordinate(nextY);
    if (point === 'p1') {
      x1 = normalizedX;
      y1 = normalizedY;
      return;
    }
    x2 = normalizedX;
    y2 = normalizedY;
  }

  function setPointCoordinate(point: 'p1' | 'p2', axis: 'x' | 'y', value: number) {
    if (point === 'p1') {
      setPointCoordinates('p1', axis === 'x' ? value : x1, axis === 'y' ? value : y1);
      return;
    }
    setPointCoordinates('p2', axis === 'x' ? value : x2, axis === 'y' ? value : y2);
  }

  function getPointCoordinate(point: 'p1' | 'p2', axis: 'x' | 'y') {
    if (point === 'p1') {
      return axis === 'x' ? x1 : y1;
    }
    return axis === 'x' ? x2 : y2;
  }

  // Reactive SVG positions
  let p1x = $derived(toSvgX(x1));
  let p1y = $derived(toSvgY(y1));
  let p2x = $derived(toSvgX(x2));
  let p2y = $derived(toSvgY(y2));

  // Anchor points (fixed)
  const a0x = toSvgX(0);
  const a0y = toSvgY(0);
  const a1x = toSvgX(1);
  const a1y = toSvgY(1);

  // Bezier curve path
  let curvePath = $derived(`M ${a0x},${a0y} C ${p1x},${p1y} ${p2x},${p2y} ${a1x},${a1y}`);

  // Grid lines at 0.25 intervals
  const gridSteps = [0.25, 0.5, 0.75];

  // Drag state
  let activePoint: 'p1' | 'p2' | null = $state(null);
  let svgEl: SVGSVGElement | undefined = $state(undefined);
  let dragRect: DOMRect | null = $state(null);
  let capturedPointerId: number | null = $state(null);
  let capturedElement: Element | null = $state(null);

  import { getLastInteractionWasKeyboard, initializeGlobalFocusListeners } from '$lib/focusUtils';

  // Focus state for showing focus rings (only on keyboard navigation, like :focus-visible)
  let p1FocusVisible = $state(false);
  let p2FocusVisible = $state(false);

  // Initialize global focus listeners once
  $effect(() => {
    initializeGlobalFocusListeners();
  });

  /**
   * Converts a PointerEvent's client coordinates to SVG viewBox coordinates.
   *
   * Note: This function and the pointer event handlers below (onPointerDown,
   * onPointerMove, onPointerUp) are not covered by unit tests because:
   * - getBoundingClientRect() returns zeros in jsdom
   * - Pointer capture APIs are mocked/stubbed and don't behave realistically
   * - SVG coordinate transformations depend on actual DOM rendering
   *
   * These interactions are tested via E2E tests in e2e/bezier-editor.spec.ts
   * which run in real browsers with proper rendering.
   */
  function getSvgPoint(e: PointerEvent): { x: number; y: number } | null {
    const rect = dragRect ?? svgEl?.getBoundingClientRect();
    if (!rect) return null;
    const scaleX = total / rect.width;
    const scaleY = total / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  function onPointerDown(point: 'p1' | 'p2', e: PointerEvent) {
    activePoint = point;
    const el = e.currentTarget as Element;

    // Mark that last interaction was NOT keyboard (pointer/mouse)
    // This will be handled by the global mouse listener
    // lastInteractionWasKeyboard = false;

    // Set focus on the control point for keyboard navigation after drag
    if ('focus' in el && typeof el.focus === 'function') {
      (el as HTMLElement).focus();
    }

    if (
      'setPointerCapture' in el &&
      typeof (el as unknown as { setPointerCapture?: unknown }).setPointerCapture === 'function'
    ) {
      (el as unknown as { setPointerCapture: (pointerId: number) => void }).setPointerCapture(
        e.pointerId
      );
      capturedPointerId = e.pointerId;
      capturedElement = el;
    } else {
      capturedPointerId = null;
      capturedElement = null;
    }
    dragRect = svgEl?.getBoundingClientRect() ?? null;
    e.preventDefault();
  }

  function onPointerMove(e: PointerEvent) {
    if (!activePoint) return;
    const pt = getSvgPoint(e);
    if (!pt) return;
    const nx = fromSvgX(pt.x);
    const ny = fromSvgY(pt.y);
    setPointCoordinates(activePoint, nx, ny);
  }

  function onPointerUp() {
    if (capturedElement && capturedPointerId !== null) {
      if (
        'releasePointerCapture' in capturedElement &&
        typeof (capturedElement as unknown as { releasePointerCapture?: unknown })
          .releasePointerCapture === 'function'
      ) {
        (
          capturedElement as unknown as { releasePointerCapture: (pointerId: number) => void }
        ).releasePointerCapture(capturedPointerId);
      }
    }
    activePoint = null;
    dragRect = null;
    capturedPointerId = null;
    capturedElement = null;
  }

  function onKeyDown(point: 'p1' | 'p2', e: KeyboardEvent) {
    // Mark that last interaction was keyboard
    // This will be handled by the global keyboard listener
    // lastInteractionWasKeyboard = true;

    const step = e.shiftKey ? 0.05 : 0.01;
    let dx = 0;
    let dy = 0;
    switch (e.key) {
      case 'ArrowLeft':
        dx = -step;
        break;
      case 'ArrowRight':
        dx = step;
        break;
      case 'ArrowUp':
        dy = step;
        break;
      case 'ArrowDown':
        dy = -step;
        break;
      default:
        return;
    }
    e.preventDefault();
    if (point === 'p1') {
      setPointCoordinates('p1', x1 + dx, y1 + dy);
      return;
    }
    setPointCoordinates('p2', x2 + dx, y2 + dy);
  }

  function onCoordinateInput(point: 'p1' | 'p2', axis: 'x' | 'y', e: Event) {
    const target = e.target as HTMLInputElement;
    const rawValue = target.value;
    if (rawValue === '' || rawValue === '.' || rawValue === '-') {
      return;
    }
    const parsed = parseFloat(rawValue);
    if (!Number.isFinite(parsed)) {
      return;
    }
    setPointCoordinate(point, axis, parsed);
  }

  function onCoordinateBlur(point: 'p1' | 'p2', axis: 'x' | 'y', e: FocusEvent) {
    const target = e.target as HTMLInputElement;
    const rawValue = target.value;
    const currentValue = getPointCoordinate(point, axis);

    if (rawValue === '' || rawValue === '.' || rawValue === '-') {
      target.value = `${currentValue}`;
      return;
    }

    const parsed = parseFloat(rawValue);
    if (!Number.isFinite(parsed)) {
      target.value = `${currentValue}`;
      return;
    }

    const normalized = normalizeCoordinate(parsed);
    setPointCoordinate(point, axis, normalized);
    target.value = `${normalized}`;
  }
</script>

<div class="bezier-editor">
  <svg
    bind:this={svgEl}
    viewBox="0 0 {total} {total}"
    class="bezier-svg"
    class:dragging={activePoint !== null}
    role="group"
    aria-label="Bezier curve editor"
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
  >
    <!-- Background -->
    <rect x={pad} y={pad} width={size} height={size} class="bg" rx="2" />

    <!-- Grid lines -->
    {#each gridSteps as t (t)}
      <line x1={toSvgX(t)} y1={pad} x2={toSvgX(t)} y2={pad + size} class="grid-line" />
      <line x1={pad} y1={toSvgY(t)} x2={pad + size} y2={toSvgY(t)} class="grid-line" />
    {/each}

    <!-- Diagonal reference (linear easing) -->
    <line x1={a0x} y1={a0y} x2={a1x} y2={a1y} class="diagonal" />

    <!-- Handle lines -->
    <line x1={a0x} y1={a0y} x2={p1x} y2={p1y} class="handle-line" />
    <line x1={a1x} y1={a1y} x2={p2x} y2={p2y} class="handle-line" />

    <!-- Bezier curve -->
    <path d={curvePath} class="curve" />

    <!-- Anchor points -->
    <circle cx={a0x} cy={a0y} r="3" class="anchor" />
    <circle cx={a1x} cy={a1y} r="3" class="anchor" />

    <!-- Focus rings (drawn first, behind control points) -->
    {#if p1FocusVisible}
      <!-- Outer black ring for P1 (r=14.5: inner edge at 13, outer edge at 16) -->
      <circle
        cx={p1x}
        cy={p1y}
        r="14"
        fill="none"
        stroke="var(--focus-outline-outside)"
        stroke-width="2"
      />
      <!-- Inner white ring for P1 (slightly wider to compensate for optical illusion) -->
      <circle
        cx={p1x}
        cy={p1y}
        r="12"
        fill="none"
        stroke="var(--focus-outline-inside)"
        stroke-width="2"
      />
    {/if}
    {#if p2FocusVisible}
      <!-- Outer black ring for P2 (r=14.5: inner edge at 13, outer edge at 16) -->
      <circle
        cx={p2x}
        cy={p2y}
        r="14"
        fill="none"
        stroke="var(--focus-outline-outside)"
        stroke-width="2"
      />
      <!-- Inner white ring for P2 (slightly wider to compensate for optical illusion) -->
      <circle
        cx={p2x}
        cy={p2y}
        r="12"
        fill="none"
        stroke="var(--focus-outline-inside)"
        stroke-width="2"
      />
    {/if}

    <!-- Visible control point P1 marker -->
    <circle cx={p1x} cy={p1y} r="10" class="control-point p1" class:active={activePoint === 'p1'} />

    <!-- Visible control point P2 marker -->
    <circle cx={p2x} cy={p2y} r="10" class="control-point p2" class:active={activePoint === 'p2'} />

    <!-- 24x24 AA-compliant slider targets -->
    <rect
      x={p1x - 12}
      y={p1y - 12}
      width="24"
      height="24"
      rx="12"
      class="control-target"
      class:active={activePoint === 'p1'}
      tabindex="0"
      role="slider"
      aria-label="Control point P1"
      aria-valuenow={x1}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuetext="x={x1.toFixed(2)}, y={y1.toFixed(2)}"
      onpointerdown={(e) => onPointerDown('p1', e)}
      onkeydown={(e) => onKeyDown('p1', e)}
      onfocus={() => (p1FocusVisible = getLastInteractionWasKeyboard())}
      onblur={() => (p1FocusVisible = false)}
    />
    <rect
      x={p2x - 12}
      y={p2y - 12}
      width="24"
      height="24"
      rx="12"
      class="control-target"
      class:active={activePoint === 'p2'}
      tabindex="0"
      role="slider"
      aria-label="Control point P2"
      aria-valuenow={x2}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuetext="x={x2.toFixed(2)}, y={y2.toFixed(2)}"
      onpointerdown={(e) => onPointerDown('p2', e)}
      onkeydown={(e) => onKeyDown('p2', e)}
      onfocus={() => (p2FocusVisible = getLastInteractionWasKeyboard())}
      onblur={() => (p2FocusVisible = false)}
    />

    <!-- Control point labels -->
    <text x={p1x} y={p1y} class="point-label p1-label">P1</text>
    <text x={p2x} y={p2y} class="point-label p2-label">P2</text>

    <!-- Axis labels -->
    <text x={pad + size / 2} y={total - 4} class="axis-label x-label">Step</text>
    <text
      x={4}
      y={pad + size / 2}
      class="axis-label y-label"
      transform="rotate(-90, 4, {pad + size / 2})">Lightness</text
    >
  </svg>

  <div class="coordinate-grid">
    <div class="coordinate-group field">
      <label class="label" for="bezier-p1-x">P1 X</label>
      <input
        class="input mono"
        id="bezier-p1-x"
        type="number"
        min="0"
        max="1"
        step="0.01"
        value={x1}
        aria-label="P1 X coordinate"
        oninput={(e) => onCoordinateInput('p1', 'x', e)}
        onblur={(e) => onCoordinateBlur('p1', 'x', e)}
      />
    </div>
    <div class="coordinate-group field">
      <label class="label" for="bezier-p1-y">P1 Y</label>
      <input
        class="input mono"
        id="bezier-p1-y"
        type="number"
        min="0"
        max="1"
        step="0.01"
        value={y1}
        aria-label="P1 Y coordinate"
        oninput={(e) => onCoordinateInput('p1', 'y', e)}
        onblur={(e) => onCoordinateBlur('p1', 'y', e)}
      />
    </div>
    <div class="coordinate-group field">
      <label class="label" for="bezier-p2-x">P2 X</label>
      <input
        class="input mono"
        id="bezier-p2-x"
        type="number"
        min="0"
        max="1"
        step="0.01"
        value={x2}
        aria-label="P2 X coordinate"
        oninput={(e) => onCoordinateInput('p2', 'x', e)}
        onblur={(e) => onCoordinateBlur('p2', 'x', e)}
      />
    </div>
    <div class="coordinate-group field">
      <label class="label" for="bezier-p2-y">P2 Y</label>
      <input
        class="input mono"
        id="bezier-p2-y"
        type="number"
        min="0"
        max="1"
        step="0.01"
        value={y2}
        aria-label="P2 Y coordinate"
        oninput={(e) => onCoordinateInput('p2', 'y', e)}
        onblur={(e) => onCoordinateBlur('p2', 'y', e)}
      />
    </div>
  </div>
</div>

<style>
  .bezier-editor {
    display: grid;
    gap: var(--space-sm);
  }

  .bezier-svg {
    width: 100%;
    max-width: 100%;
    aspect-ratio: 1;
    cursor: default;
    touch-action: none;
    user-select: none;
  }

  .bezier-svg.dragging {
    cursor: grabbing;
  }

  .bg {
    fill: var(--bg-secondary);
    stroke: var(--border);
    stroke-width: 1;
  }

  .grid-line {
    stroke: var(--border);
    stroke-width: 0.5;
  }

  .diagonal {
    stroke: var(--border);
    stroke-width: 1;
    stroke-dasharray: 4 4;
  }

  .handle-line {
    stroke: var(--text-secondary);
    stroke-width: 1;
    opacity: 0.6;
  }

  .curve {
    fill: none;
    stroke: var(--text-primary);
    stroke-width: 2.5;
    stroke-linecap: round;
  }

  .anchor {
    fill: var(--text-secondary);
  }

  .control-point {
    stroke-width: 2;
    transition: r var(--transition-fast);
    pointer-events: none;
  }

  .control-point.active {
    r: 12;
  }

  .control-target {
    fill: transparent;
    stroke: transparent;
    cursor: grab;
    pointer-events: all;
  }

  .control-target.active {
    cursor: grabbing;
  }

  /* Override global focus styles for SVG elements (outline doesn't work on SVG) */
  .control-target:focus-visible {
    outline: none;
  }

  .control-point.p1 {
    fill: var(--accent);
    stroke: var(--accent);
  }

  .control-point.p2 {
    fill: var(--bg-primary);
    stroke: var(--accent);
  }

  .axis-label {
    fill: var(--text-secondary);
    font-size: 9px;
    font-weight: var(--font-weight-semibold);
    text-anchor: middle;
    dominant-baseline: auto;
  }

  .y-label {
    dominant-baseline: hanging;
  }

  .coordinate-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-sm);
  }

  .coordinate-group {
    display: grid;
    gap: var(--space-xs);
  }

  @media (max-width: 520px) {
    .coordinate-grid {
      grid-template-columns: 1fr;
    }
  }

  .point-label {
    font-size: 10px;
    font-weight: var(--font-weight-bold);
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
    user-select: none;
  }

  .point-label.p1-label {
    fill: var(--bg-primary);
  }

  .point-label.p2-label {
    fill: var(--accent);
  }
</style>
