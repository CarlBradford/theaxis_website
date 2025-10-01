// Color Palette Configuration System
// This system allows admins to customize the reader-side appearance

// Default Theme - Custom palette by admin
export const DEFAULT_THEMES = {
  // Custom Theme - Admin customizable
  custom: {
    name: 'Custom',
    description: 'Admin customizable theme',
    colors: {
      primary: '#215d55',        // Teal - Main brand color
      secondary: '#656362',      // Dark Gray - Accent color  
      background: '#ffffff',     // Main background
      textPrimary: '#1c4643',    // Dark Teal - Main text
    }
  }
};

// Color Palette Utilities
export const colorPaletteUtils = {
  // Get CSS custom properties from a theme
  getCSSVariables: (theme) => {
    const variables = {};
    Object.entries(theme.colors).forEach(([key, value]) => {
      variables[`--color-${key}`] = value;
    });
    return variables;
  },
  
  // Apply theme to document
  applyTheme: (theme) => {
    const root = document.documentElement;
    const variables = colorPaletteUtils.getCSSVariables(theme);
    
    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Store theme in localStorage
    localStorage.setItem('reader-theme', JSON.stringify(theme));
  },
  
  // Get theme from localStorage
  getStoredTheme: () => {
    try {
      const stored = localStorage.getItem('reader-theme');
      return stored ? JSON.parse(stored) : DEFAULT_THEMES.custom;
    } catch (error) {
      console.error('Error loading stored theme:', error);
      return DEFAULT_THEMES.custom;
    }
  },
  
  // Validate theme object
  validateTheme: (theme) => {
    const requiredColors = [
      'primary',
      'secondary', 
      'background',
      'textPrimary'
    ];
    
    return requiredColors.every(color => theme.colors && theme.colors[color]);
  },
  
  // Generate theme variations
  generateVariations: (baseTheme) => {
    return {
      light: baseTheme,
      dark: {
        ...baseTheme,
        name: `${baseTheme.name} Dark`,
        colors: {
          ...baseTheme.colors,
          background: '#0f172a',
          surface: '#1e293b',
          surfaceHover: '#334155',
          textPrimary: '#f8fafc',
          textSecondary: '#cbd5e1',
          textMuted: '#94a3b8',
          border: '#334155',
          borderLight: '#475569',
          borderDark: '#1e293b',
        }
      }
    };
  }
};

// No default export to maintain Fast Refresh compatibility
