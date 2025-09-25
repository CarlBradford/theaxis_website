// Custom hooks for color palette functionality
import { useColorPalette, useThemeColors, useThemeManagement } from '../contexts/ColorPaletteContext';

// Hook for getting specific color values
export const useColor = (colorKey) => {
  const colors = useThemeColors();
  return colors[colorKey] || '#000000';
};

// Hook for getting color combinations
export const useColorCombination = (type = 'primary') => {
  const colors = useThemeColors();
  
  const combinations = {
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
      dark: colors.primaryDark,
      text: colors.textInverse,
      hover: colors.primaryDark,
      focus: colors.primary
    },
    secondary: {
      main: colors.secondary,
      light: colors.secondaryLight,
      dark: colors.secondaryDark,
      text: colors.textInverse,
      hover: colors.secondaryDark,
      focus: colors.secondary
    },
    surface: {
      main: colors.surface,
      hover: colors.surfaceHover,
      text: colors.textPrimary,
      border: colors.border
    },
    background: {
      main: colors.background,
      text: colors.textPrimary,
      border: colors.border
    }
  };
  
  return combinations[type] || combinations.primary;
};

// Hook for getting status colors
export const useStatusColors = () => {
  const colors = useThemeColors();
  
  return {
    success: {
      main: colors.success,
      text: colors.textInverse,
      background: colors.success + '20' // 20% opacity
    },
    warning: {
      main: colors.warning,
      text: colors.textInverse,
      background: colors.warning + '20'
    },
    error: {
      main: colors.error,
      text: colors.textInverse,
      background: colors.error + '20'
    },
    info: {
      main: colors.info,
      text: colors.textInverse,
      background: colors.info + '20'
    }
  };
};

// Hook for getting text colors
export const useTextColors = () => {
  const colors = useThemeColors();
  
  return {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    inverse: colors.textInverse,
    onPrimary: colors.textInverse,
    onSecondary: colors.textInverse,
    onSurface: colors.textPrimary,
    onBackground: colors.textPrimary
  };
};

// Hook for getting border colors
export const useBorderColors = () => {
  const colors = useThemeColors();
  
  return {
    default: colors.border,
    light: colors.borderLight,
    dark: colors.borderDark,
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info
  };
};

// Hook for getting interactive colors
export const useInteractiveColors = () => {
  const colors = useThemeColors();
  
  return {
    hover: colors.hover,
    active: colors.active,
    focus: colors.focus,
    disabled: colors.textMuted
  };
};

// Hook for generating CSS custom properties
export const useCSSVariables = () => {
  const { getThemeCSSVariables } = useColorPalette();
  return getThemeCSSVariables();
};

// Hook for theme switching with animation
export const useThemeTransition = () => {
  const { changeTheme } = useThemeManagement();
  
  const changeThemeWithTransition = (themeName, duration = 300) => {
    // Add transition class to body
    document.body.style.transition = `all ${duration}ms ease`;
    
    // Change theme
    changeTheme(themeName);
    
    // Remove transition class after animation
    setTimeout(() => {
      document.body.style.transition = '';
    }, duration);
  };
  
  return { changeThemeWithTransition };
};

// Hook for color accessibility
export const useColorAccessibility = () => {
  const colors = useThemeColors();
  
  // Check if color combination meets WCAG contrast requirements
  const checkContrast = (foreground, background) => {
    // Simple contrast ratio calculation
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
    
    const ratio = getContrastRatio(foreground, background);
    
    return {
      ratio,
      isAA: ratio >= 4.5,
      isAAA: ratio >= 7,
      level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail'
    };
  };
  
  // Get accessible color combinations
  const getAccessibleCombinations = () => {
    return {
      primary: {
        text: checkContrast(colors.textInverse, colors.primary),
        background: checkContrast(colors.textPrimary, colors.background)
      },
      secondary: {
        text: checkContrast(colors.textInverse, colors.secondary),
        background: checkContrast(colors.textPrimary, colors.surface)
      }
    };
  };
  
  return {
    checkContrast,
    getAccessibleCombinations
  };
};

// Utility function to convert hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Export all hooks
export {
  useColorPalette,
  useThemeColors,
  useThemeManagement
};
