export interface HelpTopic {
  label: string;
  tooltip: string;
  guide: string;
}

export interface HelpGuideSection {
  id: string;
  title: string;
  body: string[];
}

export interface HelpResource {
  title: string;
  url: string;
  description: string;
}

export const GETTING_STARTED_CALLOUT_STORAGE_KEY = 'chroma11y:getting-started-callout-dismissed';

export const HELP_TOPICS = {
  baseColor: {
    label: 'Base color',
    tooltip: 'Sets the starting hue used to generate palette families.',
    guide:
      'Start with a representative brand or product color. Chroma11y converts it into OKLCH so hue, lightness, and chroma can be tuned predictably.'
  },
  oklch: {
    label: 'OKLCH',
    tooltip: 'A perceptual color model where lightness, chroma, and hue are adjusted separately.',
    guide:
      'OKLCH is designed to match human color perception more closely than RGB or HSL. That makes palette ramps easier to tune because lightness changes are more visually consistent.'
  },
  lightnessCurve: {
    label: 'Lightness curve',
    tooltip: 'Shapes how quickly the palette moves from light swatches to dark swatches.',
    guide:
      'The lightness curve controls the spacing between steps. A flatter curve creates gentler changes, while a steeper curve creates more contrast between adjacent swatches.'
  },
  bezierCurve: {
    label: 'Bezier curve',
    tooltip: 'Adjusts the easing curve used to distribute palette lightness steps.',
    guide:
      'The Bezier editor gives precise control over the lightness ramp. Move the handles to emphasize highlights, midtones, or shadows without changing every step by hand.'
  },
  warmth: {
    label: 'Warmth',
    tooltip: 'Tints neutral swatches warmer or cooler while preserving the palette structure.',
    guide:
      'Warmth adds a controlled hue bias to neutral colors. Positive values lean warmer, negative values lean cooler, and custom warmth hue lets you choose the tint direction.'
  },
  customWarmthHue: {
    label: 'Custom warmth hue',
    tooltip:
      'Lets you choose the neutral tint hue instead of using the default warm or cool direction.',
    guide:
      'Use custom warmth hue when your system needs neutrals that lean toward a specific brand hue or material tone.'
  },
  saturation: {
    label: 'Saturation',
    tooltip: 'Scales OKLCH chroma to make generated palettes quieter or more vivid.',
    guide:
      'Saturation controls chroma. Lower values create more restrained palettes, while higher values keep generated hues closer to the base color intensity.'
  },
  numberOfColors: {
    label: 'Number of colors',
    tooltip: 'Controls how many steps each palette contains.',
    guide:
      'Use more color steps when a design system needs fine-grained surfaces, borders, text, and state colors.'
  },
  numberOfPalettes: {
    label: 'Number of palettes',
    tooltip: 'Controls how many hue families are generated from the base color.',
    guide:
      'Additional palettes rotate around the color wheel from the base color while preserving the same lightness structure.'
  },
  contrastAlgorithm: {
    label: 'Contrast algorithm',
    tooltip: 'Chooses whether swatch contrast uses WCAG ratios or APCA lightness contrast.',
    guide:
      'WCAG ratios are the current compliance baseline. APCA is a newer contrast model that better accounts for perceived lightness and text use cases.'
  },
  wcag: {
    label: 'WCAG',
    tooltip: 'WCAG 2.2 contrast ratios are the current accessibility compliance reference.',
    guide:
      'WCAG contrast compares relative luminance as a ratio. AA and AAA thresholds help identify text and interface colors that meet common accessibility requirements.'
  },
  apca: {
    label: 'APCA',
    tooltip: 'APCA reports perceptual lightness contrast for practical readability guidance.',
    guide:
      'APCA reports contrast as Lc values. It is useful for exploring readable text sizes and weights, but it is not the current WCAG 2.2 conformance method.'
  },
  contrastMode: {
    label: 'Contrast mode',
    tooltip:
      'Auto uses palette references; manual lets you choose the low and high contrast colors.',
    guide:
      'Use auto mode to evaluate against generated reference swatches. Use manual mode when you need to test against specific product backgrounds or text colors.'
  },
  lowReference: {
    label: 'Low reference',
    tooltip: 'The lighter reference color used for contrast comparisons in auto mode.',
    guide:
      'The low reference usually represents the light end of the palette, such as a page or surface background.'
  },
  highReference: {
    label: 'High reference',
    tooltip: 'The darker reference color used for contrast comparisons in auto mode.',
    guide:
      'The high reference usually represents the dark end of the palette, such as primary text or high-emphasis UI.'
  },
  indicatorLevels: {
    label: 'Indicator levels',
    tooltip: 'Chooses which contrast thresholds appear on generated swatches.',
    guide:
      'Contrast indicators mark swatches that meet selected thresholds, making it faster to scan usable text, UI, and background combinations.'
  },
  wcagThreeToOne: {
    label: 'WCAG 3:1',
    tooltip:
      'WCAG 2.2 3:1 threshold for large text, UI components, graphics, and link differentiation.',
    guide: 'WCAG 3:1 is commonly used for large text and non-text interface elements.'
  },
  wcagAA: {
    label: 'WCAG AA',
    tooltip: 'WCAG 2.2 AA text threshold: 4.5:1 for normal-size text.',
    guide: 'WCAG AA is the common minimum target for normal body text.'
  },
  wcagAAA: {
    label: 'WCAG AAA',
    tooltip: 'WCAG 2.2 AAA text threshold: 7:1 for normal-size text.',
    guide: 'WCAG AAA is a stricter text contrast target for higher accessibility goals.'
  },
  apcaLarge: {
    label: 'APCA Large',
    tooltip: 'APCA Lc 45 minimum for larger, heavier text and detailed icons.',
    guide: 'APCA Large is intended for larger display text and some detailed non-text content.'
  },
  apcaFluent: {
    label: 'APCA Fluent',
    tooltip: 'APCA Lc 60 minimum for readable content text that is not dense body copy.',
    guide: 'APCA Fluent is useful for interface copy that users are expected to read comfortably.'
  },
  apcaBody: {
    label: 'APCA Body',
    tooltip: 'APCA Lc 75 minimum for body text where readability is critical.',
    guide: 'APCA Body is a stronger readability target for dense or sustained reading.'
  },
  colorSpace: {
    label: 'Color space',
    tooltip: 'Controls which CSS color format is shown on swatches and used for exports.',
    guide:
      'Choose the color space that matches your implementation needs. Hex is broadly compatible, while OKLCH keeps perceptual color data visible.'
  },
  gamutMapping: {
    label: 'Gamut mapping',
    tooltip: 'Chooses the target display gamut used when rendering generated colors.',
    guide:
      'Gamut mapping keeps colors displayable in the selected output space. Wider gamuts can preserve more vivid colors on supported displays.'
  },
  gamutWarnings: {
    label: 'Gamut warnings',
    tooltip: 'Shows when a swatch has been mapped to fit the selected display gamut.',
    guide:
      'Gamut warnings flag colors that need conversion to fit the current output space, which matters when exporting production tokens.'
  },
  oklchPrecision: {
    label: 'OKLCH precision',
    tooltip: 'Controls how many significant digits OKLCH swatches use for rendering and labels.',
    guide:
      'OKLCH precision lets you balance readable labels with exact output. More digits preserve finer color differences.'
  },
  exportFormat: {
    label: 'Export format',
    tooltip: 'Exports the current palette as shareable URLs, design tokens, CSS, or SCSS.',
    guide:
      'Export when the palette is ready to move into a design system or codebase. CSS and SCSS respect the selected display color space.'
  },
  cvdSimulation: {
    label: 'Color vision simulation',
    tooltip:
      'Simulates how swatches appear to users with color vision deficiencies. Swatch labels and contrast checks always show real values.',
    guide:
      'Color vision deficiency simulation approximates how a palette looks to users with protanopia (red-blind), deuteranopia (green-blind), tritanopia (blue-blind), or achromatopsia (full color blindness). Only the swatch fill is simulated — hex values, contrast badges, and exports are unchanged.'
  }
} as const satisfies Record<string, HelpTopic>;

export type HelpTopicId = keyof typeof HELP_TOPICS;

export const GETTING_STARTED_SECTIONS: HelpGuideSection[] = [
  {
    id: 'base-color',
    title: 'Pick a base color',
    body: [HELP_TOPICS.baseColor.guide, HELP_TOPICS.numberOfPalettes.guide]
  },
  {
    id: 'oklch',
    title: 'Work in OKLCH',
    body: [HELP_TOPICS.oklch.guide, HELP_TOPICS.colorSpace.guide]
  },
  {
    id: 'lightness',
    title: 'Shape the lightness curve',
    body: [HELP_TOPICS.lightnessCurve.guide, HELP_TOPICS.bezierCurve.guide]
  },
  {
    id: 'warmth-saturation',
    title: 'Tune warmth and saturation',
    body: [HELP_TOPICS.warmth.guide, HELP_TOPICS.saturation.guide]
  },
  {
    id: 'contrast',
    title: 'Check WCAG and APCA contrast',
    body: [HELP_TOPICS.contrastAlgorithm.guide, HELP_TOPICS.wcag.guide, HELP_TOPICS.apca.guide]
  },
  {
    id: 'export',
    title: 'Export and share palettes',
    body: [HELP_TOPICS.gamutMapping.guide, HELP_TOPICS.exportFormat.guide]
  }
];

export const HELP_RESOURCES: HelpResource[] = [
  {
    title: 'OKLCH in CSS: why we moved from RGB and HSL',
    url: 'https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl',
    description: 'Practical background on why OKLCH is useful for modern color systems.'
  },
  {
    title: 'MDN: oklch()',
    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch',
    description: 'Reference documentation for the CSS OKLCH color function.'
  },
  {
    title: 'MDN: CSS color values',
    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Colors/Color_values',
    description: 'Overview of CSS color formats and color spaces.'
  },
  {
    title: 'W3C: Understanding Success Criterion 1.4.3 Contrast Minimum',
    url: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html',
    description: 'Official guidance for the WCAG 2.2 contrast minimum requirement.'
  },
  {
    title: 'APCA project and documentation',
    url: 'https://git.apcacontrast.com/documentation/',
    description: 'Project documentation for APCA contrast guidance.'
  }
];
