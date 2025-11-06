'use client';

import { useState, useEffect } from 'react';
import { MoonIcon } from '@heroicons/react/24/outline';
import { MoonIcon as MoonIconSolid } from '@heroicons/react/24/solid';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Evitar hydration mismatch - renderizar apenas após montar
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-md transition-colors text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        disabled
      >
        <MoonIcon className="h-5 w-5" />
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-md transition-colors ${
        isDark 
          ? 'text-primary bg-primary/10 hover:bg-primary/20' 
          : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
      }`}
      title={isDark ? 'Desativar modo escuro' : 'Ativar modo escuro'}
    >
      {isDark ? (
        <MoonIconSolid className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  );
}