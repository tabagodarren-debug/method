import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeId, ThemeColors, themes } from '../constants/themes';

export type { ThemeColors };

const STORAGE_KEY = '@app/theme';

type ThemeContextValue = {
  themeId: ThemeId;
  theme: ThemeColors;
  setTheme: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  themeId: 'light',
  theme: themes.light,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved && saved in themes) setThemeId(saved as ThemeId);
    });
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  }, []);

  return (
    <ThemeContext.Provider value={{ themeId, theme: themes[themeId], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeColors {
  return useContext(ThemeContext).theme;
}

export function useThemeId(): ThemeId {
  return useContext(ThemeContext).themeId;
}

export function useSetTheme(): (id: ThemeId) => void {
  return useContext(ThemeContext).setTheme;
}
