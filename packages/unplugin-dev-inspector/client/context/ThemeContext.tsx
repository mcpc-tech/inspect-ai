import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';

interface InspectorThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
}

const InspectorThemeContext = createContext<InspectorThemeContextType | undefined>(undefined);

export const useInspectorTheme = () => {
  const context = useContext(InspectorThemeContext);
  if (!context) {
    throw new Error('useInspectorTheme must be used within an InspectorThemeProvider');
  }
  return context;
};

export const InspectorThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof localStorage !== 'undefined') {
      return (localStorage.getItem('inspector-theme') as Theme) || 'system';
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    localStorage.setItem('inspector-theme', theme);

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setResolvedTheme(media.matches ? 'dark' : 'light');
      };
      
      // Initial check
      handleChange();
      
      // Listen for changes
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  return (
    <InspectorThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </InspectorThemeContext.Provider>
  );
};
