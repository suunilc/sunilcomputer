export interface ThemeColor {
  id: string;
  name: string;
  colorName: string;
  hex: string;
  previewColor: string;
  description: string;
  isDark: boolean;
  borderAccent: string;
}

export interface TextColorOption {
  id: string;
  name: string;
  colorName: string;
  hex: string;
  previewColor: string;
  description: string;
}

export type MenuDensityScale = 'compact' | 'normal' | 'large' | 'xlarge';
export type HeaderScale = 'compact' | 'normal' | 'large';

export interface AppThemeConfig {
  appBgId: string;
  appBgHex: string;
  menuBgId: string;
  menuBgHex: string;
  textBgId: string;
  textBgHex: string;
  textColorId: string;
  textColorHex: string;
  menuWidth: number; // in pixels (e.g., 256)
  menuScale: MenuDensityScale;
  headerScale: HeaderScale;
}

// 12+ Background Color Presets
export const PRESET_APP_BG_THEMES: ThemeColor[] = [
  {
    id: 'white',
    name: 'Pure White',
    colorName: 'White',
    hex: '#ffffff',
    previewColor: '#ffffff',
    description: 'Clean & minimalist classic white layout',
    isDark: false,
    borderAccent: '#000000',
  },
  {
    id: 'slate',
    name: 'Slate Light',
    colorName: 'Slate / Gray',
    hex: '#f1f5f9',
    previewColor: '#cbd5e1',
    description: 'Modern, balanced cool gray backdrop',
    isDark: false,
    borderAccent: '#000000',
  },
  {
    id: 'red',
    name: 'Ruby Crimson',
    colorName: 'Red',
    hex: '#fee2e2',
    previewColor: '#ef4444',
    description: 'High energy soft crimson red background',
    isDark: false,
    borderAccent: '#991b1b',
  },
  {
    id: 'green',
    name: 'Emerald Mint',
    colorName: 'Green',
    hex: '#dcfce7',
    previewColor: '#22c55e',
    description: 'Fresh & soothing natural green atmosphere',
    isDark: false,
    borderAccent: '#166534',
  },
  {
    id: 'orange',
    name: 'Sunset Amber',
    colorName: 'Orange',
    hex: '#ffedd5',
    previewColor: '#f97316',
    description: 'Warm, vibrant and energetic orange tint',
    isDark: false,
    borderAccent: '#9a3412',
  },
  {
    id: 'blue',
    name: 'Sky Blue',
    colorName: 'Blue',
    hex: '#e0f2fe',
    previewColor: '#3b82f6',
    description: 'Crisp corporate sky blue aesthetic',
    isDark: false,
    borderAccent: '#1e40af',
  },
  {
    id: 'yellow',
    name: 'Sunny Gold',
    colorName: 'Yellow',
    hex: '#fef9c3',
    previewColor: '#eab308',
    description: 'Bright, cheerful and positive sunshine yellow',
    isDark: false,
    borderAccent: '#854d0e',
  },
  {
    id: 'pink',
    name: 'Rosy Blush',
    colorName: 'Pink',
    hex: '#fce7f3',
    previewColor: '#ec4899',
    description: 'Gentle pastel blush rose and magenta',
    isDark: false,
    borderAccent: '#9d174d',
  },
  {
    id: 'purple',
    name: 'Royal Violet',
    colorName: 'Purple',
    hex: '#f3e8ff',
    previewColor: '#a855f7',
    description: 'Elegant royal lavender purple hue',
    isDark: false,
    borderAccent: '#6b21a8',
  },
  {
    id: 'cyan',
    name: 'Ocean Teal',
    colorName: 'Cyan / Teal',
    hex: '#ccfbf1',
    previewColor: '#14b8a6',
    description: 'Refreshing cool aqua marine ocean teal',
    isDark: false,
    borderAccent: '#115e59',
  },
  {
    id: 'dark',
    name: 'Modern Charcoal',
    colorName: 'Dark Slate',
    hex: '#1e293b',
    previewColor: '#334155',
    description: 'Eye-friendly modern slate dark mode',
    isDark: true,
    borderAccent: '#64748b',
  },
  {
    id: 'black',
    name: 'Pitch Black (OLED)',
    colorName: 'Pure Black',
    hex: '#09090b',
    previewColor: '#000000',
    description: 'Ultra high-contrast deep black for night shifts',
    isDark: true,
    borderAccent: '#52525b',
  },
];

// Presets for Menu (Header & Sidebar) Background Color
export const PRESET_MENU_BG_THEMES: ThemeColor[] = [
  {
    id: 'menu-white',
    name: 'Clean White',
    colorName: 'White',
    hex: '#ffffff',
    previewColor: '#ffffff',
    description: 'Crisp classic bright white navigation menu',
    isDark: false,
    borderAccent: '#000000',
  },
  {
    id: 'menu-slate-light',
    name: 'Silver Mist',
    colorName: 'Light Gray',
    hex: '#f8fafc',
    previewColor: '#e2e8f0',
    description: 'Subtle clean light neutral menu backdrop',
    isDark: false,
    borderAccent: '#000000',
  },
  {
    id: 'menu-charcoal',
    name: 'Dark Slate Charcoal',
    colorName: 'Dark Slate',
    hex: '#0f172a',
    previewColor: '#1e293b',
    description: 'Professional high-contrast dark menu',
    isDark: true,
    borderAccent: '#334155',
  },
  {
    id: 'menu-black',
    name: 'Midnight Black',
    colorName: 'Black',
    hex: '#000000',
    previewColor: '#000000',
    description: 'Solid deep black navigation bar & menu',
    isDark: true,
    borderAccent: '#27272a',
  },
  {
    id: 'menu-blue',
    name: 'Corporate Royal Blue',
    colorName: 'Royal Blue',
    hex: '#1e3a8a',
    previewColor: '#2563eb',
    description: 'Crisp deep navy & corporate blue tone',
    isDark: true,
    borderAccent: '#1d4ed8',
  },
  {
    id: 'menu-green',
    name: 'Forest Emerald',
    colorName: 'Emerald Green',
    hex: '#064e3b',
    previewColor: '#059669',
    description: 'Rich dark emerald green institute menu',
    isDark: true,
    borderAccent: '#047857',
  },
  {
    id: 'menu-red',
    name: 'Crimson Velvet',
    colorName: 'Ruby Red',
    hex: '#7f1d1d',
    previewColor: '#dc2626',
    description: 'Vibrant bold crimson ruby header & sidebar',
    isDark: true,
    borderAccent: '#b91c1c',
  },
  {
    id: 'menu-orange',
    name: 'Amber Glow',
    colorName: 'Warm Orange',
    hex: '#7c2d12',
    previewColor: '#ea580c',
    description: 'Warm energetic amber and sunset tone',
    isDark: true,
    borderAccent: '#c2410c',
  },
  {
    id: 'menu-purple',
    name: 'Royal Majesty',
    colorName: 'Royal Purple',
    hex: '#581c87',
    previewColor: '#9333ea',
    description: 'Prestigious royal dark violet navigation',
    isDark: true,
    borderAccent: '#7e22ce',
  },
  {
    id: 'menu-teal',
    name: 'Deep Oceanic Teal',
    colorName: 'Teal / Cyan',
    hex: '#134e4a',
    previewColor: '#0d9488',
    description: 'Calming dark oceanic teal palette',
    isDark: true,
    borderAccent: '#0f766e',
  },
  {
    id: 'menu-yellow',
    name: 'Golden Sunshine',
    colorName: 'Warm Gold',
    hex: '#fef08a',
    previewColor: '#eab308',
    description: 'Bright cheerful Sunshine Institute golden menu',
    isDark: false,
    borderAccent: '#ca8a04',
  },
  {
    id: 'menu-pink',
    name: 'Pastel Blush Pink',
    colorName: 'Blush Pink',
    hex: '#fbcfe8',
    previewColor: '#db2777',
    description: 'Soft playful blush rose navigation bar',
    isDark: false,
    borderAccent: '#be185d',
  },
];

// Presets for Text & Card Background (Surface Background) Color Selection
export const PRESET_TEXT_BG_THEMES: ThemeColor[] = [
  {
    id: 'textbg-white',
    name: 'Pure White (Default)',
    colorName: 'White',
    hex: '#ffffff',
    previewColor: '#ffffff',
    description: 'Clean classic white text boxes, cards & surfaces',
    isDark: false,
    borderAccent: '#000000',
  },
  {
    id: 'textbg-green',
    name: 'Mint Emerald Green',
    colorName: 'Green',
    hex: '#dcfce7',
    previewColor: '#22c55e',
    description: 'Fresh & soothing natural mint green text box backdrop',
    isDark: false,
    borderAccent: '#166534',
  },
  {
    id: 'textbg-orange',
    name: 'Sunset Peach Orange',
    colorName: 'Orange',
    hex: '#ffedd5',
    previewColor: '#f97316',
    description: 'Warm energetic sunset peach orange text container',
    isDark: false,
    borderAccent: '#9a3412',
  },
  {
    id: 'textbg-blue',
    name: 'Sky Ice Blue',
    colorName: 'Blue',
    hex: '#e0f2fe',
    previewColor: '#3b82f6',
    description: 'Crisp corporate sky blue text card background',
    isDark: false,
    borderAccent: '#1e40af',
  },
  {
    id: 'textbg-yellow',
    name: 'Sunny Gold Yellow',
    colorName: 'Yellow',
    hex: '#fef9c3',
    previewColor: '#eab308',
    description: 'Bright cheerful golden sunshine text background',
    isDark: false,
    borderAccent: '#854d0e',
  },
  {
    id: 'textbg-red',
    name: 'Rose Crimson Red',
    colorName: 'Red',
    hex: '#fee2e2',
    previewColor: '#ef4444',
    description: 'Soft blush crimson red text box surface',
    isDark: false,
    borderAccent: '#991b1b',
  },
  {
    id: 'textbg-pink',
    name: 'Pastel Blush Pink',
    colorName: 'Pink',
    hex: '#fce7f3',
    previewColor: '#ec4899',
    description: 'Gentle playful blush rose & magenta surface',
    isDark: false,
    borderAccent: '#9d174d',
  },
  {
    id: 'textbg-black',
    name: 'Pitch Midnight Black',
    colorName: 'Pure Black',
    hex: '#09090b',
    previewColor: '#000000',
    description: 'Ultra high-contrast deep black card background (dark mode)',
    isDark: true,
    borderAccent: '#52525b',
  },
  {
    id: 'textbg-teal',
    name: 'Ocean Aqua Teal',
    colorName: 'Teal / Cyan',
    hex: '#ccfbf1',
    previewColor: '#14b8a6',
    description: 'Refreshing cool oceanic aqua teal background',
    isDark: false,
    borderAccent: '#115e59',
  },
  {
    id: 'textbg-purple',
    name: 'Royal Lavender Purple',
    colorName: 'Purple',
    hex: '#f3e8ff',
    previewColor: '#a855f7',
    description: 'Elegant royal light lavender purple surface',
    isDark: false,
    borderAccent: '#6b21a8',
  },
  {
    id: 'textbg-cream',
    name: 'Warm Antique Cream',
    colorName: 'Warm Cream',
    hex: '#faf5eb',
    previewColor: '#e7dbcd',
    description: 'Eye-friendly warm parchment paper tone',
    isDark: false,
    borderAccent: '#78350f',
  },
  {
    id: 'textbg-slate',
    name: 'Silver Mist Slate',
    colorName: 'Slate / Gray',
    hex: '#f1f5f9',
    previewColor: '#cbd5e1',
    description: 'Modern, balanced cool gray text backdrop',
    isDark: false,
    borderAccent: '#334155',
  },
];

// Presets for Global Whole-Text Color Selection
export const PRESET_TEXT_COLORS: TextColorOption[] = [
  {
    id: 'text-black',
    name: 'Solid Black (Recommended)',
    colorName: 'Pitch Black',
    hex: '#000000',
    previewColor: '#000000',
    description: 'Maximum contrast, razor-sharp typography for all displays',
  },
  {
    id: 'text-charcoal',
    name: 'Charcoal Slate',
    colorName: 'Deep Slate',
    hex: '#0f172a',
    previewColor: '#1e293b',
    description: 'Modern elegant dark slate readable typeface',
  },
  {
    id: 'text-navy',
    name: 'Midnight Navy Blue',
    colorName: 'Navy Blue',
    hex: '#1e3a8a',
    previewColor: '#1e40af',
    description: 'Rich executive blue text tone for corporate styling',
  },
  {
    id: 'text-forest',
    name: 'Deep Forest Pine',
    colorName: 'Dark Green',
    hex: '#064e3b',
    previewColor: '#047857',
    description: 'Natural soothing deep forest green typography',
  },
  {
    id: 'text-crimson',
    name: 'Dark Burgundy Crimson',
    colorName: 'Burgundy Red',
    hex: '#881337',
    previewColor: '#be123c',
    description: 'Distinguished burgundy red text aesthetic',
  },
  {
    id: 'text-chocolate',
    name: 'Dark Chocolate Brown',
    colorName: 'Deep Brown',
    hex: '#451a03',
    previewColor: '#78350f',
    description: 'Warm earth tone brown typography',
  },
  {
    id: 'text-purple',
    name: 'Deep Violet Indigo',
    colorName: 'Dark Violet',
    hex: '#4c1d95',
    previewColor: '#6d28d9',
    description: 'Vibrant indigo and royal purple text tint',
  },
  {
    id: 'text-teal',
    name: 'Dark Teal Marine',
    colorName: 'Dark Teal',
    hex: '#134e4a',
    previewColor: '#0f766e',
    description: 'Refreshing cool oceanic dark teal typography',
  },
  {
    id: 'text-white',
    name: 'Crisp Pure White',
    colorName: 'White',
    hex: '#ffffff',
    previewColor: '#ffffff',
    description: 'Best paired when working in dark mode backgrounds',
  },
  {
    id: 'text-amber',
    name: 'Golden Amber Bronze',
    colorName: 'Dark Gold',
    hex: '#78350f',
    previewColor: '#d97706',
    description: 'Warm golden amber typography accent',
  },
];

// Fallback alias for backward compatibility
export const PRESET_THEMES = PRESET_APP_BG_THEMES.map(t => ({
  ...t,
  bgHex: t.hex,
}));

// LocalStorage Keys
const THEME_CONFIG_STORAGE_KEY = 'sunshine_full_theme_config_v2';
const LEGACY_BG_KEY = 'sunshine_custom_bg_theme_v1';
const LEGACY_HEX_KEY = 'sunshine_custom_bg_hex_v1';

export function isColorDark(hexColor: string): boolean {
  if (!hexColor) return false;
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  // Perceived brightness formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 130;
}

export const DEFAULT_THEME_CONFIG: AppThemeConfig = {
  appBgId: 'white',
  appBgHex: '#ffffff',
  menuBgId: 'menu-white',
  menuBgHex: '#ffffff',
  textBgId: 'textbg-white',
  textBgHex: '#ffffff',
  textColorId: 'text-black',
  textColorHex: '#000000',
  menuWidth: 256,
  menuScale: 'normal',
  headerScale: 'normal',
};

export function loadSavedThemeConfig(): AppThemeConfig {
  try {
    const raw = localStorage.getItem(THEME_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_THEME_CONFIG,
        ...parsed,
        textBgId: parsed.textBgId || 'textbg-white',
        textBgHex: parsed.textBgHex || '#ffffff',
      };
    }

    // Fallback to legacy v1 keys if present
    const legacyThemeId = localStorage.getItem(LEGACY_BG_KEY);
    const legacyHex = localStorage.getItem(LEGACY_HEX_KEY);
    if (legacyThemeId || legacyHex) {
      const matched = PRESET_APP_BG_THEMES.find(t => t.id === legacyThemeId);
      const appBgHex = legacyHex || matched?.hex || '#ffffff';
      return {
        ...DEFAULT_THEME_CONFIG,
        appBgId: legacyThemeId || 'white',
        appBgHex: appBgHex,
      };
    }
  } catch (err) {
    console.error('Error loading theme config', err);
  }
  return DEFAULT_THEME_CONFIG;
}

export function saveFullThemeConfig(config: AppThemeConfig): void {
  try {
    localStorage.setItem(THEME_CONFIG_STORAGE_KEY, JSON.stringify(config));
    // Keep legacy keys in sync
    localStorage.setItem(LEGACY_BG_KEY, config.appBgId);
    localStorage.setItem(LEGACY_HEX_KEY, config.appBgHex);
  } catch (err) {
    console.error('Failed to save theme config', err);
  }
}

export function applyThemeToDOM(config: AppThemeConfig): void {
  try {
    const root = document.documentElement;
    const isAppDark = isColorDark(config.appBgHex);
    const isMenuDark = isColorDark(config.menuBgHex);
    const textBgHex = config.textBgHex || '#ffffff';
    const isTextBgDark = isColorDark(textBgHex);

    root.style.setProperty('--app-bg', config.appBgHex);
    root.style.setProperty('--menu-bg', config.menuBgHex);
    root.style.setProperty('--text-bg', textBgHex);
    root.style.setProperty('--app-text-color', config.textColorHex);
    root.style.setProperty('--menu-width', `${config.menuWidth}px`);

    // Determine high-contrast menu text color
    const menuTextColor = isMenuDark ? '#ffffff' : config.textColorHex;
    root.style.setProperty('--menu-text-color', menuTextColor);

    document.body.style.backgroundColor = config.appBgHex;
    document.body.style.color = config.textColorHex;

    if (isAppDark) {
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
    }

    if (isMenuDark) {
      root.classList.add('dark-menu');
    } else {
      root.classList.remove('dark-menu');
    }

    if (isTextBgDark) {
      root.classList.add('dark-text-bg');
    } else {
      root.classList.remove('dark-text-bg');
    }
  } catch (err) {
    console.error('Failed to apply theme to DOM', err);
  }
}

// Backward compatibility helper
export function getSavedThemeId(): string {
  return loadSavedThemeConfig().appBgId;
}

export function getSavedCustomHex(): string {
  return loadSavedThemeConfig().appBgHex;
}

export function saveThemePreference(themeId: string, customHex?: string): void {
  const current = loadSavedThemeConfig();
  const updated: AppThemeConfig = {
    ...current,
    appBgId: themeId,
    appBgHex: customHex || PRESET_APP_BG_THEMES.find(t => t.id === themeId)?.hex || current.appBgHex,
  };
  saveFullThemeConfig(updated);
}
