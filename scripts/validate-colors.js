/**
 * Color validation script - compares current implementation with legacy expected values
 * Run with: node scripts/validate-colors.js
 */

// Legacy expected values from cypress test
const legacyExpectedNeutrals = [
  '#ffffff', '#f1f3f5', '#d5d7d9', '#b6b8b9', '#97999b',
  '#797b7c', '#5e6062', '#454748', '#2c2e30', '#151718', '#000000'
];

const legacyExpectedPalette0 = [
  '#ffffff', '#e5f4ff', '#acd8ff', '#7eb6ff', '#5995ff',
  '#3a75e1', '#295bb7', '#1b428a', '#0f2b5d', '#051433', '#000000'
];

const legacyExpectedPalette4 = [
  '#ffffff', '#ffeae5', '#ffb9ad', '#ff8d80', '#f1665b',
  '#ce433c', '#a6302b', '#7d201d', '#541310', '#2e0605', '#000000'
];

// Configuration used in legacy test
const testConfig = {
  baseColor: '#1862e6',
  warmth: -7,
  x1: 0.16,
  y1: 0,
  x2: 0.28,
  y2: 0.38,
  chromaMult: 1.14,
  nudgers: {
    5: -0.005,
    6: -0.0009
  },
  hueNudgers: {
    4: -5
  }
};

console.log('='.repeat(80));
console.log('COLOR VALIDATION REPORT');
console.log('='.repeat(80));
console.log('\nTest Configuration:');
console.log(JSON.stringify(testConfig, null, 2));
console.log('\n' + '='.repeat(80));
console.log('\nLEGACY EXPECTED VALUES:');
console.log('\nNeutral Colors:');
legacyExpectedNeutrals.forEach((color, i) => {
  console.log(`  ${i}: ${color}`);
});

console.log('\nPalette 0 (Blue):');
legacyExpectedPalette0.forEach((color, i) => {
  console.log(`  ${i}: ${color}`);
});

console.log('\nPalette 4 (Red/Pink with hue nudger -5):');
legacyExpectedPalette4.forEach((color, i) => {
  console.log(`  ${i}: ${color}`);
});

console.log('\n' + '='.repeat(80));
console.log('\nTO CAPTURE CURRENT VALUES:');
console.log('1. Open http://localhost:5173 in browser');
console.log('2. Set configuration:');
console.log('   - Base Color: #1862e6');
console.log('   - Warmth: -7');
console.log('   - x1: 0.16, y1: 0, x2: 0.28, y2: 0.38');
console.log('   - Chroma: 1.14');
console.log('   - Lightness nudger [5]: -0.005');
console.log('   - Lightness nudger [6]: -0.0009');
console.log('   - Hue nudger palette 4: -5');
console.log('3. Copy neutral colors from UI');
console.log('4. Copy palette 0 colors from UI');
console.log('5. Copy palette 4 colors from UI');
console.log('\n' + '='.repeat(80));
console.log('\nRun E2E test to capture actual values:');
console.log('npm run test:e2e -- --grep "generates consistent colors in light mode"');
console.log('='.repeat(80));
