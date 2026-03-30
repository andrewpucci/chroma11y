import { describe, expect, it } from 'vitest';
import Color from 'colorjs.io';

import { generatePalettes, getContrastForAlgorithm } from './colorUtils';
import {
  getConstraintSolveRequestHash,
  solveConstraints,
  validateConstraintSolveRequest
} from './constraintSolve';
import {
  computeAdjacentStopContrast,
  DELTA_E_2000_PASS_MAX,
  DELTA_E_2000_WARNING_MAX,
  DELTA_E_OK_PASS_MAX,
  DELTA_E_OK_WARNING_MAX,
  evaluateConstraints,
  getConstraintThresholdValue,
  getTargetColorStatus,
  getThresholdOptionsForAlgorithm
} from './constraintUtils';
import type { ConstraintResult } from '$lib/types';

describe('constraintUtils', () => {
  it('buckets deltaEOK values at the configured boundaries', () => {
    expect(getTargetColorStatus(DELTA_E_OK_PASS_MAX, 'ok')).toBe('pass');
    expect(getTargetColorStatus(DELTA_E_OK_PASS_MAX + 0.001, 'ok')).toBe('warning');
    expect(getTargetColorStatus(DELTA_E_OK_WARNING_MAX, 'ok')).toBe('warning');
    expect(getTargetColorStatus(DELTA_E_OK_WARNING_MAX + 0.001, 'ok')).toBe('fail');
  });

  it('buckets deltaE2000 values at the configured boundaries', () => {
    expect(getTargetColorStatus(DELTA_E_2000_PASS_MAX, '2000')).toBe('pass');
    expect(getTargetColorStatus(DELTA_E_2000_PASS_MAX + 0.1, '2000')).toBe('warning');
    expect(getTargetColorStatus(DELTA_E_2000_WARNING_MAX, '2000')).toBe('warning');
    expect(getTargetColorStatus(DELTA_E_2000_WARNING_MAX + 0.1, '2000')).toBe('fail');
  });

  it('evaluates a target-color constraint with deltaEOK', () => {
    const { results, summary } = evaluateConstraints({
      constraints: [
        {
          id: 'constraint-1',
          type: 'target-color',
          enabled: true,
          targetHex: '#5ef784',
          metric: 'ok'
        }
      ],
      neutrals: [new Color('#ffffff')],
      palettes: [[new Color('#5ef784')]],
      neutralLabel: 'Gray',
      paletteLabels: ['Mint'],
      lowContrastColor: '#ffffff',
      highContrastColor: '#000000'
    });

    expect(results).toMatchObject([
      {
        id: 'constraint-1',
        type: 'target-color',
        required: false,
        requiredSatisfied: true,
        metric: 'ok',
        status: 'pass',
        deltaE: 0,
        stepIndex: 0,
        isNeutral: false,
        paletteIndex: 0,
        swatchLabel: '0',
        paletteLabel: 'Mint',
        closestHex: '#5ef784'
      }
    ]);
    expect(summary.passCount).toBe(1);
    expect(summary.warningCount).toBe(0);
    expect(summary.failCount).toBe(0);
    expect(summary.requiredUnsatisfiedCount).toBe(0);
  });

  it('evaluates a contrast-rule constraint against the requested scope and threshold', () => {
    const { results, summary } = evaluateConstraints({
      constraints: [
        {
          id: 'constraint-2',
          type: 'contrast-rule',
          enabled: true,
          scope: 'neutral',
          stepIndex: 0,
          reference: 'high',
          algorithm: 'WCAG',
          level: 'wcagAAA'
        }
      ],
      neutrals: [new Color('#ffffff')],
      palettes: [],
      neutralLabel: 'Gray',
      paletteLabels: [],
      lowContrastColor: '#ffffff',
      highContrastColor: '#000000'
    });

    expect(results[0]).toMatchObject({
      id: 'constraint-2',
      type: 'contrast-rule',
      passes: true,
      swatchLabel: '0',
      paletteLabel: 'Gray'
    });
    expect(getConstraintThresholdValue('wcagAAA')).toBe(7);
    expect(summary.passCount).toBe(1);
  });

  it('evaluates contrast-rule constraint with fitToThreshold enabled', () => {
    const { results } = evaluateConstraints({
      constraints: [
        {
          id: 'constraint-fit',
          type: 'contrast-rule',
          enabled: true,
          scope: 'all-palettes',
          stepIndex: 1,
          reference: 'low',
          algorithm: 'WCAG',
          level: 'wcagAA',
          fitToThreshold: true
        }
      ],
      neutrals: [],
      palettes: [
        [new Color('#ffffff'), new Color('#cccccc'), new Color('#999999'), new Color('#666666')]
      ],
      neutralLabel: 'Gray',
      paletteLabels: ['Test Palette'],
      lowContrastColor: '#ffffff',
      highContrastColor: '#000000'
    });

    const result = results[0] as Extract<ConstraintResult, { type: 'contrast-rule' }>;
    expect(result).toMatchObject({
      id: 'constraint-fit',
      type: 'contrast-rule',
      paletteLabel: 'Test Palette',
      swatchLabel: '10'
    });
    expect(result.distanceToThreshold).toBeDefined();
    expect(typeof result.distanceToThreshold).toBe('number');
  });

  it('uses median contrast as the fit target while preserving minimum-pass semantics', () => {
    const { results } = evaluateConstraints({
      constraints: [
        {
          id: 'constraint-fit-average',
          type: 'contrast-rule',
          enabled: true,
          scope: 'all-palettes',
          stepIndex: 1,
          reference: 'low',
          algorithm: 'WCAG',
          level: 'wcagAA',
          fitToThreshold: true
        }
      ],
      neutrals: [],
      palettes: [
        [new Color('#ffffff'), new Color('#000000')],
        [new Color('#ffffff'), new Color('#777777')],
        [new Color('#ffffff'), new Color('#999999')]
      ],
      neutralLabel: 'Gray',
      paletteLabels: ['A', 'B', 'C'],
      lowContrastColor: '#ffffff',
      highContrastColor: '#000000'
    });

    const result = results[0] as Extract<ConstraintResult, { type: 'contrast-rule' }>;
    const middleContrast = getContrastForAlgorithm('#777777', '#ffffff', 'WCAG');
    expect(result.actualValue).toBeCloseTo(middleContrast, 6);
    expect(result.actualValue).toBeGreaterThan(result.minimumValue ?? 0);
    expect(result.distanceToThreshold).toBeCloseTo(
      Math.abs((result.actualValue ?? 0) - getConstraintThresholdValue('wcagAA'))
    );
  });

  it(
    'improves median fit-to-threshold distance after feasibility is established',
    {
      timeout: 20000
    },
    () => {
      const request = {
        baseColor: '#dbffde',
        warmth: -7,
        chromaMultiplier: 1,
        x1: 0.16,
        y1: 0,
        x2: 0.28,
        y2: 0.38,
        lightnessNudgers: [],
        hueNudgers: [],
        numColors: 11,
        numPalettes: 1,
        currentTheme: 'light' as const,
        gamutSpace: 'srgb' as const,
        constraints: [
          {
            id: 'fit-row',
            type: 'contrast-rule' as const,
            enabled: true,
            scope: 'all-palettes' as const,
            stepIndex: 6,
            reference: 'low' as const,
            algorithm: 'WCAG' as const,
            level: 'wcagAA' as const,
            fitToThreshold: true
          }
        ],
        lowReference: { kind: 'neutral' as const, stepIndex: 0 },
        highReference: { kind: 'neutral' as const, stepIndex: 10 },
        contrastMode: 'auto' as const,
        manualContrast: {
          low: '#ffffff',
          high: '#000000'
        }
      };

      const baselineGenerated = generatePalettes({
        baseColor: request.baseColor,
        warmth: request.warmth,
        chromaMultiplier: request.chromaMultiplier,
        x1: request.x1,
        y1: request.y1,
        x2: request.x2,
        y2: request.y2,
        numColors: request.numColors,
        numPalettes: request.numPalettes,
        currentTheme: request.currentTheme,
        gamutSpace: request.gamutSpace
      });
      const baselineEvaluation = evaluateConstraints({
        constraints: request.constraints,
        neutrals: baselineGenerated.neutrals,
        palettes: baselineGenerated.palettes,
        lowContrastColor: baselineGenerated.neutrals[0].to('srgb').toString({ format: 'hex' }),
        highContrastColor: baselineGenerated.neutrals[10].to('srgb').toString({ format: 'hex' })
      });
      const baselineResult = baselineEvaluation.results[0] as Extract<
        ConstraintResult,
        { type: 'contrast-rule' }
      >;

      const solved = solveConstraints(request);
      const solvedResult = solved.results[0] as Extract<
        ConstraintResult,
        { type: 'contrast-rule' }
      >;

      expect(solvedResult.distanceToThreshold ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(
        baselineResult.distanceToThreshold ?? Number.POSITIVE_INFINITY
      );
    }
  );

  it('returns the supported threshold options for each algorithm', () => {
    expect(getThresholdOptionsForAlgorithm('WCAG')).toEqual([
      'wcagThreeToOne',
      'wcagAA',
      'wcagAAA'
    ]);
    expect(getThresholdOptionsForAlgorithm('APCA')).toEqual([
      'apcaLarge',
      'apcaFluent',
      'apcaBody'
    ]);
  });

  it('marks solver summaries as unchanged when no better candidate is found', () => {
    const solved = solveConstraints({
      baseColor: '#5EF784',
      warmth: -7,
      chromaMultiplier: 1,
      x1: 0.16,
      y1: 0,
      x2: 0.28,
      y2: 0.38,
      lightnessNudgers: [],
      hueNudgers: [],
      numColors: 11,
      numPalettes: 1,
      currentTheme: 'light',
      gamutSpace: 'srgb',
      contrastAlgorithm: 'WCAG',
      solveAdjacentStopLows: false,
      constraints: [],
      lowReference: { kind: 'neutral', stepIndex: 0 },
      highReference: { kind: 'neutral', stepIndex: 10 },
      contrastMode: 'auto',
      manualContrast: {
        low: '#ffffff',
        high: '#000000'
      }
    });

    expect(solved.summary.changed).toBe(false);
    expect(solved.summary.scoreAfter).toBe(solved.summary.scoreBefore);
    expect(solved.summary.source).toBe('client');
  });

  it('keeps the base color fixed while solving constraints', { timeout: 15000 }, () => {
    const request = {
      baseColor: '#5EF784',
      warmth: -7,
      chromaMultiplier: 1,
      x1: 0.16,
      y1: 0,
      x2: 0.28,
      y2: 0.38,
      lightnessNudgers: [],
      hueNudgers: [],
      numColors: 11,
      numPalettes: 1,
      currentTheme: 'light' as const,
      gamutSpace: 'srgb' as const,
      constraints: [
        {
          id: 'constraint-1',
          type: 'target-color' as const,
          enabled: true,
          targetHex: '#5EF784',
          mustPass: true,
          metric: 'ok' as const
        }
      ],
      lowReference: { kind: 'neutral' as const, stepIndex: 0 },
      highReference: { kind: 'neutral' as const, stepIndex: 10 },
      contrastMode: 'auto' as const,
      manualContrast: {
        low: '#ffffff',
        high: '#000000'
      }
    };

    const solved = solveConstraints(request);

    expect(solved.snapshot.baseColor).toBe(request.baseColor);
  });

  it('produces a stable request hash for identical inputs', () => {
    const request = {
      baseColor: '#5EF784',
      warmth: -7,
      chromaMultiplier: 1,
      x1: 0.16,
      y1: 0,
      x2: 0.28,
      y2: 0.38,
      lightnessNudgers: [],
      hueNudgers: [],
      numColors: 11,
      numPalettes: 1,
      currentTheme: 'light' as const,
      gamutSpace: 'srgb' as const,
      contrastAlgorithm: 'WCAG' as const,
      solveAdjacentStopLows: true,
      constraints: [],
      lowReference: { kind: 'neutral' as const, stepIndex: 0 },
      highReference: { kind: 'neutral' as const, stepIndex: 10 },
      contrastMode: 'auto' as const,
      manualContrast: {
        low: '#ffffff',
        high: '#000000'
      }
    };

    expect(getConstraintSolveRequestHash(request, 'fast')).toBe(
      getConstraintSolveRequestHash(request, 'fast')
    );
    expect(getConstraintSolveRequestHash(request, 'fast')).not.toBe(
      getConstraintSolveRequestHash({ ...request, warmth: 1 }, 'fast')
    );
    expect(getConstraintSolveRequestHash(request, 'fast')).not.toBe(
      getConstraintSolveRequestHash({ ...request, solveAdjacentStopLows: false }, 'fast')
    );
  });

  it('rejects solve requests that exceed the must-pass cap', () => {
    const request = {
      baseColor: '#5EF784',
      warmth: -7,
      chromaMultiplier: 1,
      x1: 0.16,
      y1: 0,
      x2: 0.28,
      y2: 0.38,
      lightnessNudgers: [],
      hueNudgers: [],
      numColors: 11,
      numPalettes: 1,
      currentTheme: 'light' as const,
      gamutSpace: 'srgb' as const,
      constraints: Array.from({ length: 5 }, (_, index) => ({
        id: `constraint-${index}`,
        type: 'target-color' as const,
        enabled: true,
        targetHex: '#5EF784',
        mustPass: true,
        metric: 'ok' as const
      })),
      lowReference: { kind: 'neutral' as const, stepIndex: 0 },
      highReference: { kind: 'neutral' as const, stepIndex: 10 },
      contrastMode: 'auto' as const,
      manualContrast: {
        low: '#ffffff',
        high: '#000000'
      }
    };

    expect(validateConstraintSolveRequest(request)).toMatch(/maximum of 4/i);
  });

  it('prefers restoring monotonically decreasing step lightness', { timeout: 15000 }, () => {
    const solved = solveConstraints({
      baseColor: '#5EF784',
      warmth: 0,
      chromaMultiplier: 1,
      x1: 0.16,
      y1: 0,
      x2: 0.28,
      y2: 0.38,
      lightnessNudgers: [0, 0, 0, 0.12, 0, 0, 0, 0, 0, 0, 0],
      hueNudgers: [],
      numColors: 11,
      numPalettes: 3,
      currentTheme: 'light',
      gamutSpace: 'srgb',
      constraints: [],
      lowReference: { kind: 'neutral', stepIndex: 0 },
      highReference: { kind: 'neutral', stepIndex: 10 },
      contrastMode: 'auto',
      manualContrast: {
        low: '#ffffff',
        high: '#000000'
      }
    });

    const neutrals = generatePalettes({
      baseColor: solved.snapshot.baseColor,
      warmth: solved.snapshot.warmth,
      chromaMultiplier: solved.snapshot.chromaMultiplier,
      x1: solved.snapshot.x1,
      y1: solved.snapshot.y1,
      x2: solved.snapshot.x2,
      y2: solved.snapshot.y2,
      lightnessNudgers: solved.snapshot.lightnessNudgers,
      hueNudgers: solved.snapshot.hueNudgers,
      numColors: 11,
      numPalettes: 3,
      currentTheme: 'light',
      gamutSpace: 'srgb'
    }).neutrals;

    for (let index = 0; index < neutrals.length - 1; index += 1) {
      const drop = (neutrals[index]?.oklch.l ?? 0) - (neutrals[index + 1]?.oklch.l ?? 0);
      expect(drop).toBeGreaterThan(0.009);
    }
  });

  it(
    'avoids neutrals that collapse into perceptually identical adjacent steps',
    {
      timeout: 15000
    },
    () => {
      const solved = solveConstraints({
        baseColor: '#5EF784',
        warmth: 0,
        chromaMultiplier: 1,
        x1: 0.16,
        y1: 0,
        x2: 0.28,
        y2: 0.38,
        lightnessNudgers: [0, 0, -0.05, -0.02, 0.022, 0, -0.02, 0.05, 0.14, 0, 0],
        hueNudgers: [],
        numColors: 11,
        numPalettes: 3,
        currentTheme: 'light',
        gamutSpace: 'srgb',
        constraints: [],
        lowReference: { kind: 'neutral', stepIndex: 0 },
        highReference: { kind: 'neutral', stepIndex: 10 },
        contrastMode: 'auto',
        manualContrast: {
          low: '#ffffff',
          high: '#000000'
        }
      });

      const neutrals = generatePalettes({
        baseColor: solved.snapshot.baseColor,
        warmth: solved.snapshot.warmth,
        chromaMultiplier: solved.snapshot.chromaMultiplier,
        x1: solved.snapshot.x1,
        y1: solved.snapshot.y1,
        x2: solved.snapshot.x2,
        y2: solved.snapshot.y2,
        lightnessNudgers: solved.snapshot.lightnessNudgers,
        hueNudgers: solved.snapshot.hueNudgers,
        numColors: 11,
        numPalettes: 3,
        currentTheme: 'light',
        gamutSpace: 'srgb'
      }).neutrals;

      for (let index = 0; index < neutrals.length - 1; index += 1) {
        expect(neutrals[index].deltaEOK(neutrals[index + 1])).toBeGreaterThan(0.019);
      }
    }
  );

  it('keeps adjacent palette lanes measurably separated', { timeout: 15000 }, () => {
    const solved = solveConstraints({
      baseColor: '#5EF784',
      warmth: 0,
      chromaMultiplier: 1,
      x1: 0.16,
      y1: 0,
      x2: 0.28,
      y2: 0.38,
      lightnessNudgers: [],
      hueNudgers: [0, -88, 0, 0],
      numColors: 11,
      numPalettes: 4,
      currentTheme: 'light',
      gamutSpace: 'srgb',
      constraints: [],
      lowReference: { kind: 'neutral', stepIndex: 0 },
      highReference: { kind: 'neutral', stepIndex: 10 },
      contrastMode: 'auto',
      manualContrast: {
        low: '#ffffff',
        high: '#000000'
      }
    });

    const palettes = generatePalettes({
      baseColor: solved.snapshot.baseColor,
      warmth: solved.snapshot.warmth,
      chromaMultiplier: solved.snapshot.chromaMultiplier,
      x1: solved.snapshot.x1,
      y1: solved.snapshot.y1,
      x2: solved.snapshot.x2,
      y2: solved.snapshot.y2,
      lightnessNudgers: solved.snapshot.lightnessNudgers,
      hueNudgers: solved.snapshot.hueNudgers,
      numColors: 11,
      numPalettes: 4,
      currentTheme: 'light',
      gamutSpace: 'srgb'
    }).palettes;

    const comparisonStep = 5;
    for (let paletteIndex = 0; paletteIndex < palettes.length - 1; paletteIndex += 1) {
      const delta = palettes[paletteIndex][comparisonStep].deltaEOK(
        palettes[paletteIndex + 1][comparisonStep]
      );
      expect(delta).toBeGreaterThan(0.005);
    }
  });

  it(
    'can adjust bezier controls when multiple neutral targets favor a different curve',
    {
      timeout: 15000
    },
    () => {
      const solved = solveConstraints({
        baseColor: '#5EF784',
        warmth: 0,
        chromaMultiplier: 1,
        x1: 0.45,
        y1: 0.08,
        x2: 0.77,
        y2: 0.96,
        lightnessNudgers: [],
        hueNudgers: [],
        numColors: 11,
        numPalettes: 5,
        currentTheme: 'light',
        gamutSpace: 'srgb',
        constraints: [
          { id: 'g1', type: 'target-color', enabled: true, targetHex: '#f3f3f3', metric: '2000' },
          { id: 'g2', type: 'target-color', enabled: true, targetHex: '#dedede', metric: '2000' },
          { id: 'g3', type: 'target-color', enabled: true, targetHex: '#bdbdbd', metric: '2000' },
          { id: 'g4', type: 'target-color', enabled: true, targetHex: '#949494', metric: '2000' },
          { id: 'g5', type: 'target-color', enabled: true, targetHex: '#6f6f6f', metric: '2000' },
          { id: 'g6', type: 'target-color', enabled: true, targetHex: '#484848', metric: '2000' },
          { id: 'g7', type: 'target-color', enabled: true, targetHex: '#2e2e2e', metric: '2000' }
        ],
        lowReference: { kind: 'neutral', stepIndex: 2 },
        highReference: { kind: 'neutral', stepIndex: 10 },
        contrastMode: 'auto',
        manualContrast: {
          low: '#d8d8d8',
          high: '#000000'
        }
      });

      expect(solved.summary.changed).toBe(true);
      expect(solved.summary.scoreAfter).toBeLessThan(solved.summary.scoreBefore);
      expect(
        solved.snapshot.x1 !== 0.45 ||
          solved.snapshot.y1 !== 0.08 ||
          solved.snapshot.x2 !== 0.77 ||
          solved.snapshot.y2 !== 0.96
      ).toBe(true);
    }
  );

  it(
    'reduces must-pass failures for the mixed warm/cool target regression case',
    { timeout: 25000 },
    () => {
      const constraints = [
        {
          id: 'c1',
          type: 'target-color' as const,
          enabled: true,
          targetHex: '#5EF784',
          mustPass: true,
          metric: '2000' as const
        },
        {
          id: 'c2',
          type: 'target-color' as const,
          enabled: true,
          targetHex: '#181818',
          metric: '2000' as const
        },
        {
          id: 'c3',
          type: 'target-color' as const,
          enabled: true,
          targetHex: '#E7E3d7',
          metric: '2000' as const
        },
        {
          id: 'c4',
          type: 'target-color' as const,
          enabled: true,
          targetHex: '#51c66f',
          metric: '2000' as const
        },
        {
          id: 'c5',
          type: 'target-color' as const,
          enabled: true,
          targetHex: '#164237',
          metric: '2000' as const
        },
        {
          id: 'c6',
          type: 'target-color' as const,
          enabled: true,
          targetHex: '#53D7DD',
          metric: '2000' as const
        },
        {
          id: 'c7',
          type: 'target-color' as const,
          enabled: true,
          targetHex: '#FED733',
          metric: '2000' as const
        },
        {
          id: 'c8',
          type: 'target-color' as const,
          enabled: true,
          targetHex: '#FFEA7A',
          metric: '2000' as const
        },
        {
          id: 'c9',
          type: 'target-color' as const,
          enabled: true,
          targetHex: '#F17451',
          mustPass: true,
          metric: '2000' as const
        },
        {
          id: 'c10',
          type: 'target-color' as const,
          enabled: true,
          targetHex: '#EC95A9',
          metric: '2000' as const
        },
        {
          id: 'r1',
          type: 'contrast-rule' as const,
          enabled: true,
          scope: 'all-palettes' as const,
          stepIndex: 6,
          reference: 'low' as const,
          algorithm: 'WCAG' as const,
          level: 'wcagAA' as const
        }
      ];

      const generated = generatePalettes({
        baseColor: '#3682ba',
        warmth: 10,
        chromaMultiplier: 0.95,
        x1: 0.18,
        y1: 0.04,
        x2: 0.44000000000000006,
        y2: 0.38,
        numColors: 11,
        numPalettes: 11,
        currentTheme: 'light',
        gamutSpace: 'srgb'
      });

      const baselineEvaluation = evaluateConstraints({
        constraints,
        ...generated,
        lowContrastColor: generated.neutrals[2].to('srgb').toString({ format: 'hex' }),
        highContrastColor: '#000000'
      });

      const solved = solveConstraints({
        baseColor: '#3682ba',
        warmth: 10,
        chromaMultiplier: 0.95,
        x1: 0.18,
        y1: 0.04,
        x2: 0.44000000000000006,
        y2: 0.38,
        lightnessNudgers: [],
        hueNudgers: [],
        numColors: 11,
        numPalettes: 11,
        currentTheme: 'light',
        gamutSpace: 'srgb',
        constraints,
        lowReference: { kind: 'neutral', stepIndex: 2 },
        highReference: { kind: 'neutral', stepIndex: 10 },
        contrastMode: 'auto',
        manualContrast: {
          low: generated.neutrals[2].to('srgb').toString({ format: 'hex' }),
          high: '#000000'
        }
      });

      const baselineMustPassFails = baselineEvaluation.results.filter(
        (result) =>
          result.type === 'target-color' &&
          (result.id === 'c1' || result.id === 'c9') &&
          result.status === 'fail'
      ).length;
      const solvedMustPassFails = solved.results.filter(
        (result) =>
          result.type === 'target-color' &&
          (result.id === 'c1' || result.id === 'c9') &&
          result.status === 'fail'
      ).length;

      expect(solvedMustPassFails).toBeLessThanOrEqual(baselineMustPassFails);
    }
  );

  describe('computeAdjacentStopContrast', () => {
    it('returns entries for each adjacent pair in neutrals and palettes', () => {
      const neutrals = [
        new Color('oklch', [1, 0, 0]),
        new Color('oklch', [0.7, 0, 0]),
        new Color('oklch', [0, 0, 0])
      ];
      const palettes = [
        [
          new Color('oklch', [1, 0.1, 264]),
          new Color('oklch', [0.5, 0.1, 264]),
          new Color('oklch', [0, 0.1, 264])
        ]
      ];
      const entries = computeAdjacentStopContrast(neutrals, palettes, 'Neutral', ['Blue'], 'WCAG');
      // 2 adjacent pairs per ramp, 2 ramps
      expect(entries).toHaveLength(4);
      expect(entries[0].paletteLabel).toBe('Neutral');
      expect(entries[0].isNeutral).toBe(true);
      expect(entries[2].paletteLabel).toBe('Blue');
      expect(entries[2].isNeutral).toBe(false);
    });

    it('flags low-contrast pairs for WCAG', () => {
      // Two very similar lightness values should produce low contrast
      const neutrals = [new Color('oklch', [0.5, 0, 0]), new Color('oklch', [0.51, 0, 0])];
      const entries = computeAdjacentStopContrast(neutrals, [], 'Neutral', [], 'WCAG');
      expect(entries).toHaveLength(1);
      expect(entries[0].isLow).toBe(true);
      expect(entries[0].contrastValue).toBeLessThan(1.2);
    });

    it('flags low-contrast pairs for APCA', () => {
      const neutrals = [new Color('oklch', [0.5, 0, 0]), new Color('oklch', [0.51, 0, 0])];
      const entries = computeAdjacentStopContrast(neutrals, [], 'Neutral', [], 'APCA');
      expect(entries).toHaveLength(1);
      expect(entries[0].isLow).toBe(true);
      expect(entries[0].contrastAlgorithm).toBe('APCA');
    });

    it('marks high-contrast pairs as not low', () => {
      const neutrals = [new Color('oklch', [1, 0, 0]), new Color('oklch', [0, 0, 0])];
      const entries = computeAdjacentStopContrast(neutrals, [], 'Neutral', [], 'WCAG');
      expect(entries).toHaveLength(1);
      expect(entries[0].isLow).toBe(false);
      expect(entries[0].contrastValue).toBeGreaterThan(1.2);
    });

    it('uses a relaxed low threshold for terminal endpoint-adjacent pairs', () => {
      const neutrals = [new Color('#141414'), new Color('#000000')];
      const entries = computeAdjacentStopContrast(neutrals, [], 'Neutral', [], 'WCAG');
      expect(entries).toHaveLength(1);
      expect(entries[0].contrastValue).toBeLessThan(1.2);
      expect(entries[0].contrastValue).toBeGreaterThanOrEqual(1.05);
      expect(entries[0].isLow).toBe(false);
    });

    it('keeps non-terminal near-endpoint pairs on the standard threshold', () => {
      const neutrals = [
        new Color('#ffffff'),
        new Color('#141414'),
        new Color('#000000'),
        new Color('#000000')
      ];
      const entries = computeAdjacentStopContrast(neutrals, [], 'Neutral', [], 'WCAG');
      const middlePair = entries.find((entry) => entry.stopIndexA === 1);
      expect(middlePair).toBeDefined();
      expect(middlePair?.contrastValue ?? 0).toBeLessThan(1.2);
      expect(middlePair?.isLow).toBe(true);
    });
  });
});
