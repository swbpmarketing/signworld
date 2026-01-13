import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type DisplayDensity = 'comfortable' | 'compact' | 'spacious';
export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface DisplayPreferences {
  theme: ThemeMode;
  density: DisplayDensity;
  sidebarCollapsed: boolean;
  sidebarShowLabels: boolean;
  fontSize: FontSize;
  /**
   * Icon color override.
   * '' or undefined means use the app's original multicolor icon theme (no override).
   * Any valid CSS color string enables the custom icon color theme.
   */
  iconColor: string;
}

interface DarkModeContextType {
  darkMode: boolean;
  theme: ThemeMode;
  density: DisplayDensity;
  sidebarCollapsed: boolean;
  sidebarShowLabels: boolean;
  fontSize: FontSize;
  iconColor: string;
  toggleDarkMode: () => void;
  setTheme: (theme: ThemeMode) => void;
  setDensity: (density: DisplayDensity) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarShowLabels: (show: boolean) => void;
  setFontSize: (size: FontSize) => void;
  setIconColor: (color: string) => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

const STORAGE_KEY = 'displayPreferences';

const getDefaultPreferences = (): DisplayPreferences => ({
  theme: 'auto',
  density: 'comfortable',
  sidebarCollapsed: false,
  sidebarShowLabels: true,
  fontSize: 'md',
  // Empty string = use original multicolor icon theme (no CSS override)
  iconColor: '',
});

const loadPreferences = (): DisplayPreferences => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...getDefaultPreferences(), ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error loading display preferences:', e);
  }
  return getDefaultPreferences();
};

const savePreferences = (prefs: DisplayPreferences) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Error saving display preferences:', e);
  }
};

export const DarkModeProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<DisplayPreferences>(loadPreferences);
  const [systemDarkMode, setSystemDarkMode] = useState<boolean>(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Determine actual dark mode based on theme preference
  const darkMode = preferences.theme === 'auto'
    ? systemDarkMode
    : preferences.theme === 'dark';

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Save preferences when they change
  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  // Update document class for dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Update document class for density
  useEffect(() => {
    document.documentElement.classList.remove('density-comfortable', 'density-compact', 'density-spacious');
    document.documentElement.classList.add(`density-${preferences.density}`);
  }, [preferences.density]);

  // Update CSS variables for font size
  useEffect(() => {
    const fontScales: Record<FontSize, number> = {
      xs: 0.875, // 14px base
      sm: 0.9375, // 15px base
      md: 1, // 16px base (default)
      lg: 1.125, // 18px base
      xl: 1.25, // 20px base
    };
    document.documentElement.style.setProperty('--font-scale', fontScales[preferences.fontSize].toString());
  }, [preferences.fontSize]);

  // Calculate hover color from base icon color
  // In light mode: darker shade, in dark mode: lighter shade
  // Ensures good contrast in both modes
  const calculateHoverColor = (color: string, isDark: boolean): string => {
    // Handle both hex and rgb formats
    let r: number, g: number, b: number;
    
    if (color.startsWith('#')) {
      // Hex format
      const hex = color.replace('#', '');
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else if (color.startsWith('rgb')) {
      // RGB format - extract values
      const matches = color.match(/\d+/g);
      if (matches && matches.length >= 3) {
        r = parseInt(matches[0]);
        g = parseInt(matches[1]);
        b = parseInt(matches[2]);
      } else {
        // Fallback to default
        return isDark ? 'rgb(139, 146, 255)' : 'rgb(79, 70, 229)';
      }
    } else {
      // Fallback to default
      return isDark ? 'rgb(139, 146, 255)' : 'rgb(79, 70, 229)';
    }

    if (isDark) {
      // Lighten for dark mode (add 25% brightness for better visibility)
      return `rgb(${Math.min(255, Math.round(r + (255 - r) * 0.25))}, ${Math.min(255, Math.round(g + (255 - g) * 0.25))}, ${Math.min(255, Math.round(b + (255 - b) * 0.25))})`;
    } else {
      // Darken for light mode (reduce 25% brightness for better contrast)
      return `rgb(${Math.max(0, Math.round(r * 0.75))}, ${Math.max(0, Math.round(g * 0.75))}, ${Math.max(0, Math.round(b * 0.75))})`;
    }
  };

  // Update CSS variables and toggle icon theme class
  useEffect(() => {
    const root = document.documentElement;

    // If iconColor is empty, disable custom icon theming (restore original multicolor icons)
    if (!preferences.iconColor) {
      root.classList.remove('icon-theme-custom');
      // Reset variables to allow original colors to show through
      root.style.removeProperty('--icon-color');
      root.style.removeProperty('--icon-hover-color');
      return;
    }

    // Enable custom icon theming
    root.classList.add('icon-theme-custom');

    root.style.setProperty('--icon-color', preferences.iconColor);
    const hoverColor = calculateHoverColor(preferences.iconColor, darkMode);
    root.style.setProperty('--icon-hover-color', hoverColor);
  }, [preferences.iconColor, darkMode]);

  const toggleDarkMode = () => {
    setPreferences(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  const setTheme = (theme: ThemeMode) => {
    setPreferences(prev => ({ ...prev, theme }));
  };

  const setDensity = (density: DisplayDensity) => {
    setPreferences(prev => ({ ...prev, density }));
  };

  const setSidebarCollapsed = (sidebarCollapsed: boolean) => {
    setPreferences(prev => ({ ...prev, sidebarCollapsed }));
  };

  const setSidebarShowLabels = (sidebarShowLabels: boolean) => {
    setPreferences(prev => ({ ...prev, sidebarShowLabels }));
  };

  const setFontSize = (fontSize: FontSize) => {
    setPreferences(prev => ({ ...prev, fontSize }));
  };

  const setIconColor = (iconColor: string) => {
    setPreferences(prev => ({ ...prev, iconColor }));
  };

  return (
    <DarkModeContext.Provider value={{
      darkMode,
      theme: preferences.theme,
      density: preferences.density,
      sidebarCollapsed: preferences.sidebarCollapsed,
      sidebarShowLabels: preferences.sidebarShowLabels,
      fontSize: preferences.fontSize,
      iconColor: preferences.iconColor,
      toggleDarkMode,
      setTheme,
      setDensity,
      setSidebarCollapsed,
      setSidebarShowLabels,
      setFontSize,
      setIconColor,
    }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};
