'use client';

import { SunIcon } from '@heroicons/react/24/outline';

// Simplified theme toggle - only shows light theme icon
export default function ThemeToggle() {
  return (
    <button
      className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
      title="Tema claro ativo"
      disabled
    >
      <SunIcon className="h-5 w-5" />
    </button>
  );
}