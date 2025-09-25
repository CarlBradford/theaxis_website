import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_THEMES, colorPaletteUtils } from '../config/colorPalette';

// Create the context
const ColorPaletteContext = createContext();

// Color Palette Provider Component
export const ColorPaletteProvider = ({ children }) => {
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
  const changeTheme = (themeName) => {
    const theme = DEFAULT_THEMES[themeName] || customThemes[themeName];
    if (theme && colorPaletteUtils.validateTheme(theme)) {
      setCurrentTheme(theme);
    } else {
      console.error('Invalid theme:', themeName);
    }
  };

  // Apply custom theme
  const applyCustomTheme = (theme) => {
    if (colorPaletteUtils.validateTheme(theme)) {
      setCurrentTheme(theme);
      // Store custom theme
      const customThemeKey = `custom_${Date.now()}`;
      setCustomThemes(prev => ({
        ...prev,
        [customThemeKey]: theme
      }));
    } else {
      console.error('Invalid custom theme structure');
    }
  };

  // Reset to default theme
  const resetToDefault = (themeName = 'custom') => {
    const defaultTheme = DEFAULT_THEMES[themeName];
    if (defaultTheme) {
      setCurrentTheme(defaultTheme);
      localStorage.removeItem('reader-theme');
    }
  };

  // Get available themes
  const getAvailableThemes = () => {
    return {
      ...DEFAULT_THEMES,
      ...customThemes
    };
  };

  // Get theme colors as CSS variables
  const getThemeCSSVariables = () => {
    return colorPaletteUtils.getCSSVariables(currentTheme);
  };

  // Generate theme preview
  const generateThemePreview = (theme) => {
    const colors = theme.colors;
    return {
      primary: colors.primary,
      secondary: colors.secondary,
      background: colors.background,
      surface: colors.surface,
      text: colors.textPrimary,
      accent: colors.accent
    };
  };

  // Export theme configuration
  const exportTheme = () => {
    return {
      name: currentTheme.name,
      description: currentTheme.description,
      colors: currentTheme.colors,
      exportedAt: new Date().toISOString()
    };
  };

  // Import theme configuration
  const importTheme = (themeConfig) => {
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
  };

  // Context value
  const value = {
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
  };

  return (
    <ColorPaletteContext.Provider value={value}>
      {children}
    </ColorPaletteContext.Provider>
  );
};

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

export default ColorPaletteContext;
