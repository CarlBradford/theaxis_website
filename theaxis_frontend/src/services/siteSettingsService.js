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

  // Get site information (public endpoint)
  async getSiteInfo() {
    try {
      const response = await api.get('/admin/settings/site-info/public');
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to fetch site info:', error);
      return null;
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

  // Initialize site settings (colors, assets, and site info)
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

      // Load site information
      const siteInfo = await this.getSiteInfo();
      if (siteInfo) {
        this.applySiteInfo(siteInfo);
      } else {
        // Fallback to localStorage
        const storedSiteInfo = this.getCurrentSiteInfo();
        if (storedSiteInfo) {
          this.applySiteInfo(storedSiteInfo);
        }
      }

      return { colors, assets, siteInfo: siteInfo || this.getCurrentSiteInfo() };
    } catch (error) {
      console.error('Failed to initialize site settings:', error);
      // Return fallback data from localStorage
      return { 
        colors: this.loadColorsFromStorage(), 
        assets: [], 
        siteInfo: this.getCurrentSiteInfo() 
      };
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
  },

  // Apply site information to the document
  applySiteInfo(siteInfo) {
    if (!siteInfo) return;

    // Update document title
    if (siteInfo.site_name) {
      document.title = siteInfo.site_name;
      localStorage.setItem('site-name', siteInfo.site_name);
    }

    // Store site info in localStorage for other components
    localStorage.setItem('site-info', JSON.stringify(siteInfo));
  },

  // Get current site info from localStorage
  getCurrentSiteInfo() {
    try {
      const stored = localStorage.getItem('site-info');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load site info from storage:', error);
      return null;
    }
  },

  // Get legal content from public API
  async getLegalContent() {
    try {
      const response = await api.get('/admin/settings/legal/public');
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to fetch legal content:', error);
      return null;
    }
  },

  // Apply legal content to localStorage
  applyLegalContent(legalContent) {
    if (!legalContent) return;
    try {
      localStorage.setItem('legal-content', JSON.stringify(legalContent));
    } catch (error) {
      console.error('Failed to store legal content:', error);
    }
  },

  // Get current legal content from localStorage
  getCurrentLegalContent() {
    try {
      const stored = localStorage.getItem('legal-content');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to parse stored legal content:', error);
      return null;
    }
  }
};

export default siteSettingsService;
