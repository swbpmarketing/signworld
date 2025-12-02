import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type DisplayDensity = 'comfortable' | 'compact' | 'spacious';

interface DisplayPreferences {
  theme: ThemeMode;
  density: DisplayDensity;
  sidebarCollapsed: boolean;
  sidebarShowLabels: boolean;
}

interface DarkModeContextType {
  darkMode: boolean;
  theme: ThemeMode;
  density: DisplayDensity;
  sidebarCollapsed: boolean;
  sidebarShowLabels: boolean;
  toggleDarkMode: () => void;
  setTheme: (theme: ThemeMode) => void;
  setDensity: (density: DisplayDensity) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarShowLabels: (show: boolean) => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

const STORAGE_KEY = 'displayPreferences';

const getDefaultPreferences = (): DisplayPreferences => ({
  theme: 'auto',
  density: 'comfortable',
  sidebarCollapsed: false,
  sidebarShowLabels: true,
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

  return (
    <DarkModeContext.Provider value={{
      darkMode,
      theme: preferences.theme,
      density: preferences.density,
      sidebarCollapsed: preferences.sidebarCollapsed,
      sidebarShowLabels: preferences.sidebarShowLabels,
      toggleDarkMode,
      setTheme,
      setDensity,
      setSidebarCollapsed,
      setSidebarShowLabels,
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
