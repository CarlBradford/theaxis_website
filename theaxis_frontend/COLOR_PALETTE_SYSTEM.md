# Color Palette System Documentation

## Overview

The Color Palette System is a comprehensive theming solution that allows administrators to customize the appearance of the reader-side of the website. It provides a flexible, maintainable way to manage colors, themes, and visual consistency across the entire application.

## Features

### 🎨 **Multiple Built-in Themes**
- **Classic**: Professional and clean design
- **Modern**: Contemporary and vibrant design  
- **Dark**: Elegant dark mode design
- **Warm**: Cozy and inviting design
- **Cool**: Calm and professional design

### 🛠️ **Custom Theme Creation**
- Visual color picker interface
- Real-time preview
- Import/export functionality
- Validation and error handling

### 🔧 **Developer-Friendly**
- CSS custom properties
- React hooks and context
- TypeScript support
- Utility classes

### ♿ **Accessibility**
- WCAG contrast checking
- Color blindness considerations
- High contrast options

## File Structure

```
src/
├── config/
│   └── colorPalette.js          # Core configuration and themes
├── contexts/
│   └── ColorPaletteContext.jsx  # React context and provider
├── hooks/
│   └── useColorPalette.js       # Custom hooks for color management
├── components/admin/
│   ├── ColorPaletteSettings.jsx # Admin interface for theme management
│   └── ColorPaletteSettings.css # Styles for admin interface
└── styles/
    └── color-palette.css        # CSS variables and utility classes
```

## Quick Start

### 1. Setup Color Palette Provider

Wrap your application with the `ColorPaletteProvider`:

```jsx
import { ColorPaletteProvider } from './contexts/ColorPaletteContext';

function App() {
  return (
    <ColorPaletteProvider>
      {/* Your app components */}
    </ColorPaletteProvider>
  );
}
```

### 2. Use Color Hooks in Components

```jsx
import { useColorPalette, useThemeColors, useColor } from './hooks/useColorPalette';

function MyComponent() {
  const { currentTheme, changeTheme } = useColorPalette();
  const colors = useThemeColors();
  const primaryColor = useColor('primary');
  
  return (
    <div style={{ backgroundColor: colors.background, color: colors.textPrimary }}>
      <h1 style={{ color: primaryColor }}>My Component</h1>
      <button onClick={() => changeTheme('dark')}>Switch to Dark</button>
    </div>
  );
}
```

### 3. Use CSS Custom Properties

```css
.my-component {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.my-button {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.my-button:hover {
  background-color: var(--color-primary-dark);
}
```

## API Reference

### ColorPaletteContext

#### State
- `currentTheme`: Current active theme object
- `isLoading`: Loading state for theme operations
- `customThemes`: Object of custom themes

#### Actions
- `changeTheme(themeName)`: Switch to a different theme
- `applyCustomTheme(theme)`: Apply a custom theme
- `resetToDefault(themeName)`: Reset to default theme
- `loadTheme()`: Load theme from storage/API

#### Utilities
- `getAvailableThemes()`: Get all available themes
- `getThemeCSSVariables()`: Get CSS custom properties
- `generateThemePreview(theme)`: Generate theme preview
- `exportTheme()`: Export current theme
- `importTheme(themeConfig)`: Import theme configuration

### Hooks

#### `useColorPalette()`
Main hook for accessing color palette functionality.

```jsx
const { currentTheme, changeTheme, isLoading } = useColorPalette();
```

#### `useThemeColors()`
Get current theme colors object.

```jsx
const colors = useThemeColors();
// colors.primary, colors.secondary, colors.background, etc.
```

#### `useColor(colorKey)`
Get a specific color value.

```jsx
const primaryColor = useColor('primary');
```

#### `useColorCombination(type)`
Get color combinations for common use cases.

```jsx
const primaryCombo = useColorCombination('primary');
// { main, light, dark, text, hover, focus }
```

#### `useStatusColors()`
Get status colors (success, warning, error, info).

```jsx
const statusColors = useStatusColors();
// statusColors.success.main, statusColors.warning.main, etc.
```

#### `useTextColors()`
Get text color variants.

```jsx
const textColors = useTextColors();
// textColors.primary, textColors.secondary, textColors.muted, etc.
```

#### `useBorderColors()`
Get border color variants.

```jsx
const borderColors = useBorderColors();
// borderColors.default, borderColors.light, borderColors.dark, etc.
```

#### `useInteractiveColors()`
Get interactive state colors.

```jsx
const interactiveColors = useInteractiveColors();
// interactiveColors.hover, interactiveColors.active, interactiveColors.focus
```

## Color Properties

Each theme includes the following color properties:

### Primary Colors
- `primary`: Main brand color
- `primaryLight`: Lighter variant
- `primaryDark`: Darker variant

### Secondary Colors
- `secondary`: Accent color
- `secondaryLight`: Lighter accent
- `secondaryDark`: Darker accent

### Background Colors
- `background`: Main background
- `surface`: Card/surface background
- `surfaceHover`: Hover state background

### Text Colors
- `textPrimary`: Main text color
- `textSecondary`: Secondary text color
- `textMuted`: Muted text color
- `textInverse`: Text on dark backgrounds

### Border Colors
- `border`: Default border color
- `borderLight`: Light border color
- `borderDark`: Dark border color

### Status Colors
- `success`: Success states
- `warning`: Warning states
- `error`: Error states
- `info`: Info states

### Interactive Colors
- `hover`: Hover background
- `active`: Active state
- `focus`: Focus ring color

### Special Colors
- `accent`: Special accent color
- `highlight`: Highlight background

## CSS Custom Properties

All colors are available as CSS custom properties:

```css
:root {
  --color-primary: #215d55;
  --color-primary-light: #2a7a6f;
  --color-primary-dark: #1c4643;
  --color-secondary: #3b82f6;
  /* ... and so on */
}
```

## Utility Classes

The system includes utility classes for common use cases:

### Color Classes
```css
.color-primary { color: var(--color-primary); }
.color-secondary { color: var(--color-secondary); }
.color-text-primary { color: var(--color-text-primary); }
/* ... */
```

### Background Classes
```css
.bg-primary { background-color: var(--color-primary); }
.bg-secondary { background-color: var(--color-secondary); }
.bg-surface { background-color: var(--color-surface); }
/* ... */
```

### Border Classes
```css
.border-primary { border-color: var(--color-primary); }
.border-secondary { border-color: var(--color-secondary); }
.border-default { border-color: var(--color-border); }
/* ... */
```

### Button Classes
```css
.btn-primary { /* Primary button styles */ }
.btn-secondary { /* Secondary button styles */ }
.btn-outline-primary { /* Outline primary button styles */ }
/* ... */
```

## Admin Interface

The `ColorPaletteSettings` component provides a comprehensive admin interface for:

- **Theme Selection**: Choose from built-in themes
- **Live Preview**: See changes in real-time
- **Custom Editor**: Create and edit custom themes
- **Import/Export**: Share themes between installations
- **Validation**: Ensure theme integrity

### Usage in Admin Panel

```jsx
import ColorPaletteSettings from './components/admin/ColorPaletteSettings';

function AdminSettings() {
  return (
    <div>
      <h1>Site Settings</h1>
      <ColorPaletteSettings />
    </div>
  );
}
```

## Best Practices

### 1. Use CSS Custom Properties
Prefer CSS custom properties over inline styles for better performance and maintainability.

```jsx
// ✅ Good
<div className="my-component" />

// ❌ Avoid
<div style={{ backgroundColor: colors.background }} />
```

### 2. Use Semantic Color Names
Use semantic color names that describe purpose, not appearance.

```jsx
// ✅ Good
const primaryColor = useColor('primary');
const errorColor = useColor('error');

// ❌ Avoid
const greenColor = useColor('green');
const redColor = useColor('red');
```

### 3. Test Color Combinations
Always test color combinations for accessibility and readability.

```jsx
const { checkContrast } = useColorAccessibility();
const contrast = checkContrast(colors.textPrimary, colors.background);
console.log(`Contrast ratio: ${contrast.ratio}, Level: ${contrast.level}`);
```

### 4. Provide Fallbacks
Always provide fallback colors for better reliability.

```css
.my-component {
  background-color: var(--color-background, #ffffff);
  color: var(--color-text-primary, #000000);
}
```

## Migration Guide

### From Hardcoded Colors

1. **Replace hardcoded colors** with CSS custom properties:
```css
/* Before */
.my-component { color: #215d55; }

/* After */
.my-component { color: var(--color-primary); }
```

2. **Update React components** to use hooks:
```jsx
// Before
const MyComponent = () => (
  <div style={{ color: '#215d55' }}>Content</div>
);

// After
const MyComponent = () => {
  const primaryColor = useColor('primary');
  return <div style={{ color: primaryColor }}>Content</div>;
};
```

3. **Add ColorPaletteProvider** to your app root.

## Troubleshooting

### Common Issues

1. **Colors not updating**: Ensure `ColorPaletteProvider` wraps your app
2. **CSS variables not working**: Check if `color-palette.css` is imported
3. **Theme not persisting**: Verify localStorage is available
4. **Admin interface not showing**: Check if component is properly imported

### Debug Mode

Enable debug mode to see color palette operations:

```jsx
// Add to your app
localStorage.setItem('color-palette-debug', 'true');
```

## Future Enhancements

- [ ] Theme inheritance system
- [ ] Color palette presets
- [ ] Advanced color picker with HSL/HSV
- [ ] Theme sharing marketplace
- [ ] Automatic dark mode detection
- [ ] Color palette analytics
- [ ] A/B testing for themes

## Contributing

When adding new themes or features:

1. Follow the existing color property structure
2. Test with all built-in themes
3. Ensure accessibility compliance
4. Update documentation
5. Add appropriate TypeScript types

## License

This color palette system is part of The AXIS website project and follows the same licensing terms.
