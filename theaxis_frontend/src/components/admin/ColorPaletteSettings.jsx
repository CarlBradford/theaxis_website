import React, { useState, useEffect } from 'react';
import { useThemeManagement, useColorPalette } from '../../contexts/ColorPaletteContext';
import './ColorPaletteSettings.css';

const ColorPaletteSettings = () => {
  const { 
    applyCustomTheme
  } = useThemeManagement();
  
  const { currentTheme, isLoading } = useColorPalette();
  
  const [customTheme, setCustomTheme] = useState({
    colors: { ...currentTheme.colors }
  });
  const [isEditing, setIsEditing] = useState(false);

  // Update custom theme when current theme changes
  useEffect(() => {
    if (currentTheme) {
      setCustomTheme({
        colors: { ...currentTheme.colors }
      });
    }
  }, [currentTheme]);


  const handleColorChange = (colorKey, value) => {
    setCustomTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }));
  };

  const handleSaveCustomTheme = () => {
    applyCustomTheme(customTheme);
    setIsEditing(false);
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
    }
  ];

  if (isLoading) {
    return (
      <div className="color-palette-settings">
        <div className="loading">Loading color palette settings...</div>
      </div>
    );
  }

  return (
    <div className="color-palette-settings">

      {/* Color Customization */}
      <div className="custom-theme-section">
        <div className="section-header">
          <h3>Color Customization</h3>
          <div className="section-actions">
            <button 
              className="btn btn-outline-primary"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Colors'}
            </button>
            {isEditing && (
              <button 
                className="btn btn-primary"
                onClick={handleSaveCustomTheme}
              >
                Save Colors
              </button>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="color-editor-compact">
            <div className="color-groups-compact">
              {colorGroups.map((group, index) => (
                <div key={index} className="color-group-compact">
                  <div className="color-group-header-compact">
                    <h4>{group.title}</h4>
                    <p className="color-group-description-compact">{group.description}</p>
                  </div>
                  <div className="color-inputs-compact">
                    {group.colors.map((colorKey) => (
                      <div key={colorKey} className="color-input-compact">
                        <label className="color-label-compact">{colorKey}</label>
                        <div className="color-picker-wrapper-compact">
                          <input
                            type="color"
                            value={customTheme.colors[colorKey]}
                            onChange={(e) => handleColorChange(colorKey, e.target.value)}
                            className="color-picker-compact"
                          />
                          <input
                            type="text"
                            value={customTheme.colors[colorKey]}
                            onChange={(e) => handleColorChange(colorKey, e.target.value)}
                            className="color-text-compact"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>


    </div>
  );
};

export default ColorPaletteSettings;
