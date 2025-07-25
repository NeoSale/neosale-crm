'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

// Simplified theme context - only light theme
interface ThemeContextType {
  theme: 'light';
  toggleTheme: () => void; // Kept for compatibility but does nothing
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  // Ensure light theme only
  useEffect(() => {
    // Remove any dark class that might exist
    document.documentElement.classList.remove('dark');
    // Clear any theme from localStorage
    localStorage.removeItem('theme');
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    // Do nothing - kept for compatibility
  };

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};