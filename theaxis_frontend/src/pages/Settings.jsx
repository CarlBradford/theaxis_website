import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../config/permissions';
import { useThemeManagement, useColorPalette } from '../contexts/ColorPaletteContext';
import usePageTitle from '../hooks/usePageTitle';
import { 
  ShieldCheckIcon,
  PaintBrushIcon,
  PhotoIcon,
  Cog6ToothIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import '../styles/dashboard.css';
import '../styles/settings.css';
import siteSettingsService from '../services/siteSettingsService';
import api from '../services/api';

const Settings = () => {
  const { user } = useAuth();

  // Set page title
  usePageTitle('Settings');

  const [activeTab, setActiveTab] = useState('colors');
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Color customization states
  const [customTheme, setCustomTheme] = useState({
    colors: {}
  });
  const [colorErrors, setColorErrors] = useState({});
  const [colorSuccess, setColorSuccess] = useState(false);
  const [colorLoading, setColorLoading] = useState(false);

  // Logo and wordmark customization states
  const [logoFiles, setLogoFiles] = useState({
    logo: null,
    wordmark: null
  });
  const [logoPreviews, setLogoPreviews] = useState({
    logo: null,
    wordmark: null
  });
  const [logoErrors, setLogoErrors] = useState({});
  const [logoSuccess, setLogoSuccess] = useState(false);
  const [logoUploadLoading, setLogoUploadLoading] = useState(false);

  // Site information states
  const [siteInfo, setSiteInfo] = useState({
    site_name: '',
    site_description: '',
    contact_email: '',
    address: '',
    year_copyright: '',
    facebook_link: '',
    instagram_link: '',
    x_link: ''
  });

  // Debug: Log siteInfo changes
  useEffect(() => {
    console.log('Settings - siteInfo state changed:', siteInfo);
  }, [siteInfo]);
  const [siteInfoErrors, setSiteInfoErrors] = useState({});
  const [siteInfoSuccess, setSiteInfoSuccess] = useState(false);
  const [siteInfoLoading, setSiteInfoLoading] = useState(false);

  // Legal content states
  const [legalContent, setLegalContent] = useState({
    privacy_policy: '',
    terms_of_service: ''
  });

  // Debug: Log legalContent changes
  useEffect(() => {
    console.log('Settings - legalContent state changed:', legalContent);
  }, [legalContent]);
  const [legalErrors, setLegalErrors] = useState({});
  const [legalSuccess, setLegalSuccess] = useState(false);
  const [legalLoading, setLegalLoading] = useState(false);

  // Color palette context
  const { applyCustomTheme } = useThemeManagement();
  const { currentTheme, isLoading: colorContextLoading } = useColorPalette();

  // Check if user has permission to access settings
  if (!hasPermission(user?.role, 'system:config')) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <div className="dashboard-header-left">
              <div className="flex items-center space-x-4">
                <div>
                  <ShieldCheckIcon className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-black">
                    Access Denied
                  </h1>
                   <p className="text-black">You don't have permission to access site settings.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Load site assets
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load assets
        const assetsResponse = await api.get('/admin/assets');
        if (assetsResponse.data.success) {
          setAssets(assetsResponse.data.data);
        }
        
        // Load site information
        const siteInfoResponse = await api.get('/admin/settings/site-info');
        console.log('Settings - Site info response:', siteInfoResponse.data);
        if (siteInfoResponse.data.success) {
          console.log('Settings - Setting site info:', siteInfoResponse.data.data);
          setSiteInfo(siteInfoResponse.data.data);
        }
        
        // Load legal content
        const legalResponse = await api.get('/admin/settings/legal');
        console.log('Settings - Legal content response:', legalResponse.data);
        if (legalResponse.data.success) {
          console.log('Settings - Setting legal content:', legalResponse.data.data);
          setLegalContent(legalResponse.data.data);
        }
        
      } catch (error) {
        console.error('Failed to load settings data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Load colors from database on component mount
  useEffect(() => {
    const loadColorsFromDatabase = async () => {
      try {
        const response = await api.get('/admin/settings/colors');
        if (response.data.success) {
          const dbColors = response.data.data;
          setCustomTheme({
            colors: { ...dbColors }
          });
          // Also update the current theme context
          applyCustomTheme({ colors: dbColors });
        }
      } catch (error) {
        console.error('Failed to load colors from database:', error);
        // Fallback to current theme
        if (currentTheme) {
          setCustomTheme({
            colors: { ...currentTheme.colors }
          });
        }
      }
    };

    // Only load for ADMINISTRATOR and SYSTEM_ADMIN roles
    if (user?.role === 'ADMINISTRATOR' || user?.role === 'SYSTEM_ADMIN') {
      loadColorsFromDatabase();
    }
  }, [user?.role]);

  // Update custom theme when current theme changes
  useEffect(() => {
    if (currentTheme && !customTheme.colors.primary) {
      setCustomTheme({
        colors: { ...currentTheme.colors }
      });
    }
  }, [currentTheme]);

  // Color customization handlers
  const handleColorChange = useCallback((colorKey, value) => {
    setCustomTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }));
  }, []);

  const handleColorSubmit = useCallback(async (e) => {
    e.preventDefault();
    setColorErrors({});
    setColorLoading(true);
    
    try {
      // Save colors to database via API
      const response = await api.put('/admin/settings/colors', {
        colors: customTheme.colors
      });
      
      if (response.data.success) {
        // Apply colors locally
        applyCustomTheme(customTheme);
        setColorSuccess(true);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setColorSuccess(false);
        }, 3000);
      } else {
        setColorErrors({ general: response.data.message || 'Failed to save colors' });
      }
      
    } catch (error) {
      console.error('Failed to save colors:', error);
      if (error.response?.data?.message) {
        setColorErrors({ general: error.response.data.message });
      } else {
        setColorErrors({ general: 'Failed to save colors. Please try again.' });
      }
    } finally {
      setColorLoading(false);
    }
  }, [customTheme, applyCustomTheme]);

  const resetColorsToDefault = useCallback(async () => {
    try {
      const response = await api.post('/admin/settings/colors/reset');
      if (response.data.success) {
        const defaultColors = response.data.data;
        setCustomTheme({ colors: defaultColors });
        applyCustomTheme({ colors: defaultColors });
        setColorSuccess(true);
        setTimeout(() => setColorSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to reset colors:', error);
      setColorErrors({ general: 'Failed to reset colors. Please try again.' });
    }
  }, [applyCustomTheme]);

  // Logo and wordmark customization handlers
  const handleLogoFileChange = (type, file) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setLogoErrors(prev => ({
          ...prev,
          [type]: 'Please select a valid image file'
        }));
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setLogoErrors(prev => ({
          ...prev,
          [type]: 'File size must be less than 10MB'
        }));
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      setLogoFiles(prev => ({
        ...prev,
        [type]: file
      }));
      
      setLogoPreviews(prev => ({
        ...prev,
        [type]: previewUrl
      }));

      // Clear any previous errors
      setLogoErrors(prev => ({
        ...prev,
        [type]: null
      }));
      
      // Clean up previous preview URL
      if (logoPreviews[type]) {
        URL.revokeObjectURL(logoPreviews[type]);
      }
    }
  };

  const handleLogoSubmit = async (e) => {
    e.preventDefault();
    setLogoErrors({});
    
    try {
      setLogoUploadLoading(true);
      
      // Upload logo if selected
      if (logoFiles.logo) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logoFiles.logo);
        
        const logoResponse = await api.post('/admin/assets/logo', logoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (!logoResponse.data.success) {
          throw new Error(logoResponse.data.message || 'Failed to upload logo');
        }
      }
      
      // Upload wordmark if selected
      if (logoFiles.wordmark) {
        const wordmarkFormData = new FormData();
        wordmarkFormData.append('wordmark', logoFiles.wordmark);
        
        const wordmarkResponse = await api.post('/admin/assets/wordmark', wordmarkFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (!wordmarkResponse.data.success) {
          throw new Error(wordmarkResponse.data.message || 'Failed to upload wordmark');
        }
      }
      
      setLogoSuccess(true);
      
      // Reload assets to show updated list
      const assetsResponse = await api.get('/admin/assets');
      if (assetsResponse.data.success) {
        setAssets(assetsResponse.data.data);
      }
      
      // Clean up preview URLs
      if (logoPreviews.logo) URL.revokeObjectURL(logoPreviews.logo);
      if (logoPreviews.wordmark) URL.revokeObjectURL(logoPreviews.wordmark);
      
      setLogoFiles({ logo: null, wordmark: null });
      setLogoPreviews({ logo: null, wordmark: null });
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setLogoSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to upload logos:', error);
      if (error.response?.data?.message) {
        setLogoErrors({ general: error.response.data.message });
      } else {
        setLogoErrors({ general: 'Failed to upload logos. Please try again.' });
      }
    } finally {
      setLogoUploadLoading(false);
    }
  };

  // Handle asset deletion
  const handleDeleteAsset = async (assetId) => {
    if (!confirm('Are you sure you want to delete this asset?')) {
      return;
    }

    try {
      const response = await api.delete(`/admin/assets/${assetId}`);
      if (response.data.success) {
        // Reload assets
        const assetsResponse = await api.get('/admin/assets');
        if (assetsResponse.data.success) {
          setAssets(assetsResponse.data.data);
        }
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setLogoErrors({ general: 'Delete failed. Please try again.' });
    }
  };

  // Site information handlers
  const handleSiteInfoChange = (field, value) => {
    setSiteInfo(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear errors when user starts typing
    if (siteInfoErrors[field]) {
      setSiteInfoErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSiteInfoSubmit = async (e) => {
    e.preventDefault();
    setSiteInfoLoading(true);
    setSiteInfoErrors({});
    setSiteInfoSuccess(false);

    try {
      const response = await api.put('/admin/settings/site-info', { siteInfo });
      if (response.data.success) {
        setSiteInfoSuccess(true);
        setTimeout(() => setSiteInfoSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save site information:', error);
      if (error.response?.data?.message) {
        setSiteInfoErrors({ general: error.response.data.message });
      } else {
        setSiteInfoErrors({ general: 'Failed to save site information' });
      }
    } finally {
      setSiteInfoLoading(false);
    }
  };

  // Legal content handlers
  const handleLegalContentChange = (field, value) => {
    setLegalContent(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear errors when user starts typing
    if (legalErrors[field]) {
      setLegalErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleLegalContentSubmit = async (e) => {
    e.preventDefault();
    setLegalLoading(true);
    setLegalErrors({});
    setLegalSuccess(false);

    try {
      const response = await api.put('/admin/settings/legal', legalContent);
      if (response.data.success) {
        setLegalSuccess(true);
        setTimeout(() => setLegalSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save legal content:', error);
      if (error.response?.data?.message) {
        setLegalErrors({ general: error.response.data.message });
      } else {
        setLegalErrors({ general: 'Failed to save legal content' });
      }
    } finally {
      setLegalLoading(false);
    }
  };

  const colorGroups = [
    {
      title: 'Primary Color',
      colors: ['primary'],
      description: 'Main brand color for buttons, links, and highlights'
    },
    {
      title: 'Secondary Color',
      colors: ['secondary'],
      description: 'Accent color for secondary elements and borders'
    },
    {
      title: 'Background Color',
      colors: ['background'],
      description: 'Main background color for the website'
    },
    {
      title: 'Text Color',
      colors: ['textPrimary'],
      description: 'Main text color for content and headings'
    },
];

  // Tabs configuration
  const tabs = [
    {
      id: 'colors',
      name: 'Color Settings',
      icon: PaintBrushIcon,
      description: 'Customize website colors and themes'
    },
    {
      id: 'assets',
      name: 'Site Assets',
      icon: PhotoIcon,
      description: 'Manage logos, wordmarks, and site images'
    },
    {
      id: 'site-info',
      name: 'Site Information',
      icon: Cog6ToothIcon,
      description: 'Configure site details and publication info'
    },
    {
      id: 'legal',
      name: 'Legal Content',
      icon: ShieldCheckIcon,
      description: 'Manage privacy policy and terms of service'
    }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <div className="flex items-center space-x-4">
              <div>
                 <ShieldCheckIcon className="h-8 w-8 text-teal-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black">
                  Site Settings
                </h1>
                 <p className="text-black">Manage website configuration and settings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className="tab-icon" />
              <div className="tab-content">
                <div className="tab-name">{tab.name}</div>
                <div className="tab-description">{tab.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="dashboard-main-content">
          {activeTab === 'colors' && (
            <div className="settings-section">
              <h3 className="section-title">Color Customization</h3>
              
              {colorErrors.general && (
                <div className="settings-message error">
                  <ExclamationTriangleIcon className="settings-icon" />
                  <span>{colorErrors.general}</span>
                </div>
              )}

              {colorSuccess && (
                <div className="settings-message success">
                  <CheckCircleIcon className="settings-icon" />
                  <span>Colors saved successfully!</span>
                </div>
              )}

              <div className="color-customization-info">
                <p>Customize the appearance of your website's reader-side.</p>
                <p><strong>Note:</strong> Header uses the primary color, footer uses the secondary color.</p>
              </div>

              <form onSubmit={handleColorSubmit} className="color-customization-form">
                <div className="color-groups">
                  {colorGroups.map((group, index) => (
                    <div key={index} className="color-group">
                      <div className="color-group-header">
                        <h4>{group.title}</h4>
                        <p className="color-group-description">{group.description}</p>
                      </div>
                      <div className="color-inputs">
                        {group.colors.map((colorKey) => (
                          <div key={colorKey} className="color-input">
                            <label className="color-label">{colorKey}</label>
                            <div className="color-picker-wrapper">
                              <input
                                type="color"
                                value={customTheme.colors[colorKey] || '#000000'}
                                onChange={(e) => handleColorChange(colorKey, e.target.value)}
                                className="color-picker"
                              />
                              <input
                                type="text"
                                value={customTheme.colors[colorKey] || ''}
                                onChange={(e) => handleColorChange(colorKey, e.target.value)}
                                className="color-text"
                                placeholder="#000000"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="color-form-actions">
                  <button
                    type="button"
                    onClick={resetColorsToDefault}
                    className="settings-btn settings-btn-secondary"
                  >
                    Reset to Default
                  </button>
                  <button
                    type="submit"
                    disabled={colorLoading || colorContextLoading}
                    className="settings-btn settings-btn-primary"
                  >
                    {colorLoading ? 'Saving Colors...' : 'Save Colors'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="settings-section">
              <h3 className="section-title">Logo & Wordmark Management</h3>
              
              {logoErrors.general && (
                <div className="settings-message error">
                  <ExclamationTriangleIcon className="settings-icon" />
                  <span>{logoErrors.general}</span>
                </div>
              )}

              {logoSuccess && (
                <div className="settings-message success">
                  <CheckCircleIcon className="settings-icon" />
                  <span>Assets uploaded successfully!</span>
                </div>
              )}

              <div className="asset-customization-info">
                <p>Upload custom logo and wordmark assets. Maximum file size: 10MB.</p>
              </div>

              <form onSubmit={handleLogoSubmit} className="logo-customization-form">
                <div className="logo-upload-sections">
                  <div className="logo-upload-section">
                    <h4 className="upload-section-title">
                      <PhotoIcon className="upload-section-icon" />
                      Logo Upload
                    </h4>
                    
                    <div className="upload-area">
                      {logoPreviews.logo && (
                        <div className="logo-preview">
                          <img 
                            src={logoPreviews.logo} 
                            alt="Logo Preview" 
                            className="preview-image"
                          />
                          <button
                            type="button" 
                            onClick={() => {
                              setLogoFiles(prev => ({ ...prev, logo: null }));
                              setLogoPreviews(prev => ({ ...prev, logo: null }));
                            }}
                            className="remove-preview-btn"
                          >
                            <XMarkIcon className="remove-icon" />
                          </button>
                        </div>
                      )}
                      
                      <div className="file-input-wrapper">
                        <label htmlFor="logo-file-input" className="file-input-label">
                          <ArrowUpTrayIcon className="upload-icon" />
                          {logoPreviews.logo ? 'Change Logo' : 'Choose Logo File'}
                        </label>
                        <input
                          id="logo-file-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLogoFileChange('logo', e.target.files[0])}
                          className="file-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="logo-upload-section">
                    <h4 className="upload-section-title">
                      <PhotoIcon className="upload-section-icon" />
                      Wordmark Upload
                    </h4>
                    
                    <div className="upload-area">
                      {logoPreviews.wordmark && (
                        <div className="logo-preview">
                          <img 
                            src={logoPreviews.wordmark} 
                            alt="Wordmark Preview" 
                            className="preview-image"
                          />
                          <button
                            type="button" 
                            onClick={() => {
                              setLogoFiles(prev => ({ ...prev, wordmark: null }));
                              setLogoPreviews(prev => ({ ...prev, wordmark: null }));
                            }}
                            className="remove-preview-btn"
                          >
                            <XMarkIcon className="remove-icon" />
                          </button>
                        </div>
                      )}
                      
                      <div className="file-input-wrapper">
                        <label htmlFor="wordmark-file-input" className="file-input-label">
                          <ArrowUpTrayIcon className="upload-icon" />
                          {logoPreviews.wordmark ? 'Change Wordmark' : 'Choose Wordmark File'}
                        </label>
                        <input
                          id="wordmark-file-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLogoFileChange('wordmark', e.target.files[0])}
                          className="file-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {(logoFiles.logo || logoFiles.wordmark) && (
                  <div className="upload-form-actions">
                    <button
                      type="submit"
                      disabled={logoUploadLoading}
                      className="settings-btn settings-btn-primary"
                    >
                      {logoUploadLoading ? 'Uploading...' : 'Upload Assets'}
                    </button>
                  </div>
                )}
              </form>

              <div className="current-assets-section">
                <h4 className="current-assets-title">Current Assets</h4>
                
                <div className="assets-group">
                  <h5 className="assets-group-title">Logos & Wordmarks</h5>
                  <div className="current-assets">
                    {assets.filter(asset => asset.assetType === 'logo' || asset.assetType === 'wordmark').map(asset => (
                      <div key={asset.id} className="asset-item">
                        <img 
                          src={`http://localhost:3001/uploads/${asset.fileName}`} 
                          alt={asset.assetType === 'logo' ? 'Logo' : 'Wordmark'} 
                          className="asset-preview"
                        />
                        <div className="asset-info">
                          <div className="asset-name">{asset.originalName}</div>
                          <div className="asset-details">
                            {(asset.fileSize / 1024).toFixed(1)} KB • {asset.mimeType}
                          </div>
                          {asset.isActive && <span className="active-badge">Active</span>}
                        </div>
                        <button
                          className="delete-asset-btn"
                          onClick={() => handleDeleteAsset(asset.id)}
                          title="Delete asset"
                        >
                          <TrashIcon className="delete-icon" />
                        </button>
                      </div>
                    ))}
                    {assets.filter(asset => asset.assetType === 'logo' || asset.assetType === 'wordmark').length === 0 && (
                      <p className="no-assets-message">No assets uploaded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'site-info' && (
            <div className="settings-section">
              <h3 className="section-title">Site Information</h3>
              
              {siteInfoErrors.general && (
                <div className="settings-message error">
                  <ExclamationTriangleIcon className="settings-icon" />
                  <span>{siteInfoErrors.general}</span>
                </div>
              )}

              {siteInfoSuccess && (
                <div className="settings-message success">
                  <CheckCircleIcon className="settings-icon" />
                  <span>Site information saved successfully!</span>
                </div>
              )}

              <form onSubmit={handleSiteInfoSubmit} className="site-info-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="site_name">Site Name *</label>
                    <input
                      type="text"
                      id="site_name"
                      value={siteInfo.site_name}
                      onChange={(e) => handleSiteInfoChange('site_name', e.target.value)}
                      placeholder="The AXIS"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <input
                      type="text"
                      id="address"
                      value={siteInfo.address}
                      onChange={(e) => handleSiteInfoChange('address', e.target.value)}
                      placeholder="123 University Street, City, State 12345"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="site_description">Site Description</label>
                    <textarea
                      id="site_description"
                      value={siteInfo.site_description}
                      onChange={(e) => handleSiteInfoChange('site_description', e.target.value)}
                      placeholder="Brief description of your publication"
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact_email">Contact Email *</label>
                    <input
                      type="email"
                      id="contact_email"
                      value={siteInfo.contact_email}
                      onChange={(e) => handleSiteInfoChange('contact_email', e.target.value)}
                      placeholder="contact@theaxis.local"
                      required
                    />
                  </div>


                  <div className="form-group">
                    <label htmlFor="year_copyright">Copyright Year</label>
                    <input
                      type="text"
                      id="year_copyright"
                      value={siteInfo.year_copyright}
                      onChange={(e) => handleSiteInfoChange('year_copyright', e.target.value)}
                      placeholder="2024"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="facebook_link">Facebook Link</label>
                    <input
                      type="url"
                      id="facebook_link"
                      value={siteInfo.facebook_link}
                      onChange={(e) => handleSiteInfoChange('facebook_link', e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="instagram_link">Instagram Link</label>
                    <input
                      type="url"
                      id="instagram_link"
                      value={siteInfo.instagram_link}
                      onChange={(e) => handleSiteInfoChange('instagram_link', e.target.value)}
                      placeholder="https://instagram.com/yourpage"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="x_link">X (Twitter) Link</label>
                    <input
                      type="url"
                      id="x_link"
                      value={siteInfo.x_link}
                      onChange={(e) => handleSiteInfoChange('x_link', e.target.value)}
                      placeholder="https://x.com/yourpage"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="save-button"
                    disabled={siteInfoLoading}
                  >
                    {siteInfoLoading ? 'Saving...' : 'Save Site Information'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="settings-section">
              <h3 className="section-title">Legal Content</h3>
              
              {legalErrors.general && (
                <div className="settings-message error">
                  <ExclamationTriangleIcon className="settings-icon" />
                  <span>{legalErrors.general}</span>
                </div>
              )}

              {legalSuccess && (
                <div className="settings-message success">
                  <CheckCircleIcon className="settings-icon" />
                  <span>Legal content saved successfully!</span>
                </div>
              )}

              <form onSubmit={handleLegalContentSubmit} className="legal-content-form">
                <div className="form-group">
                  <label htmlFor="privacy_policy">Privacy Policy</label>
                  <textarea
                    id="privacy_policy"
                    value={legalContent.privacy_policy}
                    onChange={(e) => handleLegalContentChange('privacy_policy', e.target.value)}
                    placeholder="Enter your privacy policy content..."
                    rows="15"
                    className="legal-textarea"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="terms_of_service">Terms of Service</label>
                  <textarea
                    id="terms_of_service"
                    value={legalContent.terms_of_service}
                    onChange={(e) => handleLegalContentChange('terms_of_service', e.target.value)}
                    placeholder="Enter your terms of service content..."
                    rows="15"
                    className="legal-textarea"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="save-button"
                    disabled={legalLoading}
                  >
                    {legalLoading ? 'Saving...' : 'Save Legal Content'}
                  </button>
              </div>
              </form>
            </div>
          )}

          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading settings...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
