# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-02-01

### Added

- Complete Svelte 5 implementation of color generator
- OKLCH color space support with configurable color palettes
- Neutral palette generation with warmth control
- Bezier curve controls (x1, y1, x2, y2) for precise lightness distribution
- Chroma normalization across palettes
- WCAG contrast calculations with auto/manual contrast modes
- Lightness nudgers for per-step color adjustments
- Hue nudgers for per-palette hue adjustments
- Named color detection using CIEDE2000 color difference algorithm
- Export functionality in multiple formats:
  - JSON design tokens
  - CSS custom properties (variables)
  - SCSS variables
- Click-to-copy functionality for individual colors
- Theme switching with light and dark modes
- URL state persistence for sharing color configurations
- Local storage for user preferences
- Comprehensive E2E test suite (19 tests across 7 spec files)
- Mobile responsive design with touch-friendly controls
- Accessibility features:
  - ARIA labels and landmarks
  - Keyboard navigation support
  - Screen reader announcements
  - Focus-visible styles
  - Skip links
- Performance optimizations with lazy loading and memoization

### Changed

- Migrated from vanilla JavaScript to Svelte 5 + TypeScript
- Replaced manual DOM manipulation with reactive component architecture
- Modernized build system using Vite + SvelteKit
- Enhanced color generation algorithms with proper OKLCH gamut clamping
