import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { DEFAULT_THEMES, colorPaletteUtils } from '../config/colorPalette';

// Create the context
const ColorPaletteContext = createContext(null);

// Color Palette Provider Component
export const ColorPaletteProvider = React.memo(({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(DEFAULT_THEMES.custom);
  const [isLoading, setIsLoading] = useState(true);
  const [customThemes, setCustomThemes] = useState({});

  // Load theme on component mount
  useEffect(() => {
    loadTheme();
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    if (currentTheme) {
      colorPaletteUtils.applyTheme(currentTheme);
    }
  }, [currentTheme]);

  // Load theme from localStorage or API
  const loadTheme = async () => {
    try {
      setIsLoading(true);
      
      // Try to load from localStorage first
      const storedTheme = colorPaletteUtils.getStoredTheme();
      
      // TODO: In the future, load from API for admin-customized themes
      // const apiTheme = await fetchThemeFromAPI();
      
      if (storedTheme && colorPaletteUtils.validateTheme(storedTheme)) {
        setCurrentTheme(storedTheme);
      } else {
        setCurrentTheme(DEFAULT_THEMES.custom);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      setCurrentTheme(DEFAULT_THEMES.custom);
    } finally {
      setIsLoading(false);
    }
  };

  // Change theme
  const changeTheme = useCallback((themeName) => {
    const theme = DEFAULT_THEMES[themeName] || customThemes[themeName];
    if (theme && colorPaletteUtils.validateTheme(theme)) {
      setCurrentTheme(theme);
    } else {
      console.error('Invalid theme:', themeName);
    }
  }, [customThemes]);

  // Apply custom theme
  const applyCustomTheme = useCallback((theme) => {
    // Handle both full theme objects and color-only objects
    let fullTheme;
    
    if (theme.colors && !theme.name) {
      // Convert CSS custom properties to color keys if needed
      let colors = theme.colors;
      
      // Check if colors are in CSS custom property format (--color-*)
      const hasCSSProperties = Object.keys(colors).some(key => key.startsWith('--color-'));
      
      if (hasCSSProperties) {
        // Convert CSS custom properties to color keys
        colors = {};
        Object.entries(theme.colors).forEach(([key, value]) => {
          if (key.startsWith('--color-')) {
            const colorKey = key.replace('--color-', '');
            colors[colorKey] = value;
          }
        });
      }
      
      // Ensure required colors exist with fallbacks
      const requiredColors = {
        primary: colors.primary || colors.accent || '#215d55',
        secondary: colors.secondary || colors.border || '#656362',
        background: colors.background || '#ffffff',
        textPrimary: colors.textPrimary || colors.text || '#1c4643'
      };
      
      colors = { ...colors, ...requiredColors };
      
      // Create a full theme object
      fullTheme = {
        name: 'Custom',
        description: 'Custom theme from database',
        colors: colors
      };
    } else {
      // Use the provided theme as-is
      fullTheme = theme;
    }
    
    if (colorPaletteUtils.validateTheme(fullTheme)) {
      setCurrentTheme(fullTheme);
      // Store custom theme
      const customThemeKey = `custom_${Date.now()}`;
      setCustomThemes(prev => ({
        ...prev,
        [customThemeKey]: fullTheme
      }));
    } else {
      console.error('Invalid custom theme structure', fullTheme);
      console.error('Theme colors:', fullTheme.colors);
      console.error('Required colors check:', {
        primary: !!fullTheme.colors?.primary,
        secondary: !!fullTheme.colors?.secondary,
        background: !!fullTheme.colors?.background,
        textPrimary: !!fullTheme.colors?.textPrimary
      });
    }
  }, [setCustomThemes]);

  // Reset to default theme
  const resetToDefault = useCallback((themeName = 'custom') => {
    const defaultTheme = DEFAULT_THEMES[themeName];
    if (defaultTheme) {
      setCurrentTheme(defaultTheme);
      localStorage.removeItem('reader-theme');
    }
  }, []);

  // Get available themes
  const getAvailableThemes = useCallback(() => {
    return {
      ...DEFAULT_THEMES,
      ...customThemes
    };
  }, [customThemes]);

  // Get theme colors as CSS variables
  const getThemeCSSVariables = useCallback(() => {
    return colorPaletteUtils.getCSSVariables(currentTheme);
  }, [currentTheme]);

  // Generate theme preview
  const generateThemePreview = useCallback((theme) => {
    const colors = theme.colors;
    return {
      primary: colors.primary,
      secondary: colors.secondary,
      background: colors.background,
      surface: colors.surface,
      text: colors.textPrimary,
      accent: colors.accent
    };
  }, []);

  // Export theme configuration
  const exportTheme = useCallback(() => {
    return {
      name: currentTheme.name,
      description: currentTheme.description,
      colors: currentTheme.colors,
      exportedAt: new Date().toISOString()
    };
  }, [currentTheme]);

  // Import theme configuration
  const importTheme = useCallback((themeConfig) => {
    try {
      if (colorPaletteUtils.validateTheme(themeConfig)) {
        applyCustomTheme(themeConfig);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid theme configuration' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [applyCustomTheme]);

  // Context value - memoized to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // State
    currentTheme,
    isLoading,
    customThemes,
    
    // Actions
    changeTheme,
    applyCustomTheme,
    resetToDefault,
    loadTheme,
    
    // Utilities
    getAvailableThemes,
    getThemeCSSVariables,
    generateThemePreview,
    exportTheme,
    importTheme,
    
    // Constants
    defaultThemes: DEFAULT_THEMES
  }), [
    currentTheme,
    isLoading,
    customThemes,
    changeTheme,
    applyCustomTheme,
    resetToDefault,
    getAvailableThemes,
    getThemeCSSVariables,
    generateThemePreview,
    exportTheme,
    importTheme
  ]);

  return (
    <ColorPaletteContext.Provider value={value}>
      {children}
    </ColorPaletteContext.Provider>
  );
});

// Custom hook to use color palette
export const useColorPalette = () => {
  const context = useContext(ColorPaletteContext);
  if (!context) {
    throw new Error('useColorPalette must be used within a ColorPaletteProvider');
  }
  return context;
};

// Hook for getting current theme colors
export const useThemeColors = () => {
  const { currentTheme } = useColorPalette();
  return currentTheme.colors;
};

// Hook for theme management (admin only)
export const useThemeManagement = () => {
  const { 
    changeTheme, 
    applyCustomTheme, 
    resetToDefault, 
    getAvailableThemes,
    generateThemePreview,
    exportTheme,
    importTheme
  } = useColorPalette();
  
  return {
    changeTheme,
    applyCustomTheme,
    resetToDefault,
    getAvailableThemes,
    generateThemePreview,
    exportTheme,
    importTheme
  };
};

// Export the context for external use
export { ColorPaletteContext };
