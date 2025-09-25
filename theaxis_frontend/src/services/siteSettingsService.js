import api from './api';

// Site Settings Service
export const siteSettingsService = {
  // Get color settings
  async getColors() {
    try {
      const response = await api.get('/admin/settings/colors');
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to fetch colors:', error);
      return null;
    }
  },

  // Get site assets (logos, wordmarks)
  async getAssets() {
    try {
      const response = await api.get('/admin/assets');
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      return [];
    }
  },

  // Apply colors to the document
  applyColors(colors) {
    if (!colors) return;

    const root = document.documentElement;
    
    // Apply color variables to CSS custom properties
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Store in localStorage for persistence
    localStorage.setItem('site-colors', JSON.stringify(colors));
  },

  // Load colors from localStorage (fallback)
  loadColorsFromStorage() {
    try {
      const stored = localStorage.getItem('site-colors');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load colors from storage:', error);
      return null;
    }
  },

  // Initialize site settings (colors and assets)
  async initialize() {
    try {
      // Load colors
      const colors = await this.getColors();
      if (colors) {
        this.applyColors(colors);
      } else {
        // Fallback to localStorage
        const storedColors = this.loadColorsFromStorage();
        if (storedColors) {
          this.applyColors(storedColors);
        }
      }

      // Load assets
      const assets = await this.getAssets();
      this.applyAssets(assets);

      return { colors, assets };
    } catch (error) {
      console.error('Failed to initialize site settings:', error);
      return { colors: null, assets: [] };
    }
  },

  // Apply assets to the document
  applyAssets(assets) {
    if (!assets || !Array.isArray(assets)) return;

    // Find logo and wordmark assets
    const logoAsset = assets.find(asset => asset.assetType === 'logo' && asset.isActive);
    const wordmarkAsset = assets.find(asset => asset.assetType === 'wordmark' && asset.isActive);

    // Apply logo
    if (logoAsset) {
      const logoUrl = `/uploads/${logoAsset.fileName}`;
      document.documentElement.style.setProperty('--site-logo-url', `url(${logoUrl})`);
      localStorage.setItem('site-logo', logoUrl);
    }

    // Apply wordmark
    if (wordmarkAsset) {
      const wordmarkUrl = `/uploads/${wordmarkAsset.fileName}`;
      document.documentElement.style.setProperty('--site-wordmark-url', `url(${wordmarkUrl})`);
      localStorage.setItem('site-wordmark', wordmarkUrl);
    }
  },

  // Get current logo URL
  getCurrentLogo() {
    return localStorage.getItem('site-logo') || null;
  },

  // Get current wordmark URL
  getCurrentWordmark() {
    return localStorage.getItem('site-wordmark') || null;
  }
};

export default siteSettingsService;
