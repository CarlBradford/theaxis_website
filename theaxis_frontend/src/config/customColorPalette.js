// Custom Color Palette for The AXIS Website
// Based on the final color palette provided

export const CUSTOM_COLOR_PALETTE = {
  // Your Final Color Palette
  teal: '#215d55',           // Main brand color
  darkTeal: '#1c4643',       // Dark teal for text and accents
  lightGray: '#b3b0ac',      // Light gray for borders and muted text
  darkGray: '#656362',       // Dark gray for secondary text and accents
  
  // Derived colors for better usability
  tealLight: '#2a7a6f',      // Lighter teal variant
  tealDark: '#1c4643',       // Darker teal variant (same as darkTeal)
  grayLight: '#e5e7eb',      // Very light gray for subtle borders
  grayDark: '#4a4847',       // Darker gray variant
  
  // Neutral colors
  white: '#ffffff',          // Pure white
  black: '#000000',          // Pure black
  
  // Status colors (using your palette where possible)
  success: '#215d55',        // Teal for success
  warning: '#f59e0b',        // Orange for warnings
  error: '#ef4444',          // Red for errors
  info: '#215d55',           // Teal for info
};

// Color combinations for common use cases
export const COLOR_COMBINATIONS = {
  // Primary brand combination
  primary: {
    main: CUSTOM_COLOR_PALETTE.teal,
    light: CUSTOM_COLOR_PALETTE.tealLight,
    dark: CUSTOM_COLOR_PALETTE.darkTeal,
    text: CUSTOM_COLOR_PALETTE.white,
    hover: CUSTOM_COLOR_PALETTE.darkTeal,
    focus: CUSTOM_COLOR_PALETTE.teal
  },
  
  // Secondary combination
  secondary: {
    main: CUSTOM_COLOR_PALETTE.darkGray,
    light: CUSTOM_COLOR_PALETTE.lightGray,
    dark: CUSTOM_COLOR_PALETTE.grayDark,
    text: CUSTOM_COLOR_PALETTE.white,
    hover: CUSTOM_COLOR_PALETTE.grayDark,
    focus: CUSTOM_COLOR_PALETTE.darkGray
  },
  
  // Text combinations
  text: {
    primary: CUSTOM_COLOR_PALETTE.darkTeal,
    secondary: CUSTOM_COLOR_PALETTE.darkGray,
    muted: CUSTOM_COLOR_PALETTE.lightGray,
    inverse: CUSTOM_COLOR_PALETTE.white
  },
  
  // Background combinations
  background: {
    main: CUSTOM_COLOR_PALETTE.white,
    surface: '#f8fafc',
    surfaceHover: '#f1f5f9',
    overlay: 'rgba(28, 70, 67, 0.8)' // Dark teal with opacity
  },
  
  // Border combinations
  border: {
    default: CUSTOM_COLOR_PALETTE.lightGray,
    light: CUSTOM_COLOR_PALETTE.grayLight,
    dark: CUSTOM_COLOR_PALETTE.darkGray,
    primary: CUSTOM_COLOR_PALETTE.teal
  }
};

// CSS Custom Properties for your color palette
export const CSS_CUSTOM_PROPERTIES = {
  '--color-teal': CUSTOM_COLOR_PALETTE.teal,
  '--color-dark-teal': CUSTOM_COLOR_PALETTE.darkTeal,
  '--color-light-gray': CUSTOM_COLOR_PALETTE.lightGray,
  '--color-dark-gray': CUSTOM_COLOR_PALETTE.darkGray,
  '--color-teal-light': CUSTOM_COLOR_PALETTE.tealLight,
  '--color-teal-dark': CUSTOM_COLOR_PALETTE.tealDark,
  '--color-gray-light': CUSTOM_COLOR_PALETTE.grayLight,
  '--color-gray-dark': CUSTOM_COLOR_PALETTE.grayDark,
  
  // Primary colors
  '--color-primary': CUSTOM_COLOR_PALETTE.teal,
  '--color-primary-light': CUSTOM_COLOR_PALETTE.tealLight,
  '--color-primary-dark': CUSTOM_COLOR_PALETTE.darkTeal,
  
  // Secondary colors
  '--color-secondary': CUSTOM_COLOR_PALETTE.darkGray,
  '--color-secondary-light': CUSTOM_COLOR_PALETTE.lightGray,
  '--color-secondary-dark': CUSTOM_COLOR_PALETTE.grayDark,
  
  // Text colors
  '--color-text-primary': CUSTOM_COLOR_PALETTE.darkTeal,
  '--color-text-secondary': CUSTOM_COLOR_PALETTE.darkGray,
  '--color-text-muted': CUSTOM_COLOR_PALETTE.lightGray,
  '--color-text-inverse': CUSTOM_COLOR_PALETTE.white,
  
  // Background colors
  '--color-background': CUSTOM_COLOR_PALETTE.white,
  '--color-surface': COLOR_COMBINATIONS.background.surface,
  '--color-surface-hover': COLOR_COMBINATIONS.background.surfaceHover,
  
  // Border colors
  '--color-border': CUSTOM_COLOR_PALETTE.lightGray,
  '--color-border-light': CUSTOM_COLOR_PALETTE.grayLight,
  '--color-border-dark': CUSTOM_COLOR_PALETTE.darkGray,
  
  // Status colors
  '--color-success': CUSTOM_COLOR_PALETTE.success,
  '--color-warning': CUSTOM_COLOR_PALETTE.warning,
  '--color-error': CUSTOM_COLOR_PALETTE.error,
  '--color-info': CUSTOM_COLOR_PALETTE.info,
  
  // Interactive colors
  '--color-hover': COLOR_COMBINATIONS.background.surfaceHover,
  '--color-active': CUSTOM_COLOR_PALETTE.grayLight,
  '--color-focus': CUSTOM_COLOR_PALETTE.teal,
  
  // Special colors
  '--color-accent': CUSTOM_COLOR_PALETTE.teal,
  '--color-highlight': '#f0f9f7' // Light teal highlight
};

// Utility functions for your color palette
export const colorUtils = {
  // Get color by name
  getColor: (colorName) => CUSTOM_COLOR_PALETTE[colorName] || CUSTOM_COLOR_PALETTE.teal,
  
  // Get color combination
  getCombination: (type) => COLOR_COMBINATIONS[type] || COLOR_COMBINATIONS.primary,
  
  // Apply CSS custom properties to document
  applyToDocument: () => {
    const root = document.documentElement;
    Object.entries(CSS_CUSTOM_PROPERTIES).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  },
  
  // Get contrast ratio between two colors
  getContrastRatio: (color1, color2) => {
    const getLuminance = (color) => {
      const rgb = hexToRgb(color);
      if (!rgb) return 0;
      
      const { r, g, b } = rgb;
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };
    
    const getContrastRatio = (color1, color2) => {
      const lum1 = getLuminance(color1);
      const lum2 = getLuminance(color2);
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);
      return (brightest + 0.05) / (darkest + 0.05);
    };
    
    return getContrastRatio(color1, color2);
  },
  
  // Check if color combination meets accessibility standards
  isAccessible: (foreground, background) => {
    const ratio = colorUtils.getContrastRatio(foreground, background);
    return ratio >= 4.5; // WCAG AA standard
  }
};

// Helper function to convert hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Export everything
export default {
  palette: CUSTOM_COLOR_PALETTE,
  combinations: COLOR_COMBINATIONS,
  cssProperties: CSS_CUSTOM_PROPERTIES,
  utils: colorUtils
};
