import { createTheme, style } from '@vanilla-extract/css';

export const [themeClass, vars] = createTheme({
  space: {
    small: '0.5em',
    medium: '1em',
    large: '2em'
  },
  colors: {
    background: '#ffffff',
    text: '#000000',
    border: '#e0e0e0',
    lowText: '#FFFFFF',
    highText: '#000000'
  }
});

export const darkTheme = createTheme(vars, {
  space: {
    small: '0.5em',
    medium: '1em',
    large: '2em'
  },
  colors: {
    background: '#1a1a1a',
    text: '#f0f0f0',
    border: '#333333',
    lowText: '#071531',
    highText: '#ffffff'
  }
});

export const globalStyles = style({
  selectors: {
    ':root': {
      vars: {
        [vars.colors.lowText]: '#FFFFFF',
        [vars.colors.highText]: '#000000'
      }
    },
    'html': {
      height: '100%'
    },
    'body': {
      height: '100%',
      backgroundColor: vars.colors.background,
      color: vars.colors.text,
      transition: 'background-color 0.3s ease, color 0.3s ease',
      margin: 0,
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif'
    },
    '*': {
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    },
    'ul': {
      listStyle: 'none',
      display: 'grid',
      gridAutoColumns: 'minmax(0, 1fr)',
      gridAutoFlow: 'column',
      gap: vars.space.small
    },
    'li': {
      aspectRatio: '1',
      display: 'grid',
      placeContent: 'center',
      fontSize: '1.25vw'
    },
    'input, select': {
      display: 'block',
      margin: vars.space.medium + ' auto',
      width: '100%'
    }
  }
});

export const container = style({
  display: 'grid',
  placeContent: 'center',
  textAlign: 'center'
});

export const row = style({
  display: 'grid',
  gap: vars.space.small,
  gridAutoColumns: 'minmax(0, 1fr)',
  gridAutoFlow: 'column'
});

export const highContrast = style({
  color: vars.colors.highText
});

export const lowContrast = style({
  color: vars.colors.lowText
});

export const hidden = style({
  display: 'none'
});

export const generatedHue = style({
  selectors: {
    '& > li:first-child > input': {
      width: '4rem',
      marginBottom: '0px',
      marginTop: '0.25em'
    }
  }
});

export const paletteGrid = style({
  listStyle: 'none',
  display: 'grid',
  gridAutoColumns: 'minmax(0, 1fr)',
  gridAutoFlow: 'column',
  gap: vars.space.small
});

export const colorSwatch = style({
  aspectRatio: '1',
  display: 'grid',
  placeContent: 'center',
  fontSize: '1.25vw',
  cursor: 'pointer',
  transition: 'transform 0.2s ease',
  selectors: {
    '&:hover': {
      transform: 'scale(1.05)'
    }
  }
});

export const controlGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.small,
  padding: vars.space.small,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: '4px'
});

export const button = style({
  padding: `${vars.space.small} ${vars.space.medium}`,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: '4px',
  backgroundColor: vars.colors.background,
  color: vars.colors.text,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  selectors: {
    '&:hover': {
      backgroundColor: vars.colors.border
    }
  }
});

export const themeToggle = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.small,
  padding: vars.space.small,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: '4px',
  backgroundColor: vars.colors.background,
  color: vars.colors.text,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  selectors: {
    '&:hover': {
      backgroundColor: vars.colors.border
    }
  }
});
