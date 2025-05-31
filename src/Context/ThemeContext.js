import React, { createContext, useContext, useEffect } from 'react';
import { greenTheme } from '../theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const theme = greenTheme; // Use the green theme or any other theme you define

  useEffect(() => {
    const root = document.documentElement;

    // Set theme colors as CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Set font and sizing
    Object.entries(theme.sizes).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });

    root.style.setProperty('--font-family', theme.font.family);
    root.style.setProperty('--font-size', theme.font.size);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
