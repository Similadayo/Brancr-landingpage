'use client';

import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../providers/ThemeProvider';

// Create a wrapper that handles the case where ThemeProvider might not be available
function ThemeToggleInner() {
  const context = useContext(ThemeContext);

  if (context) {
    return <ThemeToggleButton theme={context.theme} toggleTheme={context.toggleTheme} />;
  }

  // If ThemeProvider is not available, use standalone mode
  return <StandaloneThemeToggle />;
}

function StandaloneThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
      setTheme(initialTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      const root = document.documentElement;
      if (newTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 shadow-sm dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-secondary w-[36px] h-[36px]">
        <div className="h-5 w-5" />
      </div>
    );
  }

  return <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />;
}

function ThemeToggleButton({ theme, toggleTheme }: { theme: 'light' | 'dark'; toggleTheme: () => void }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-75
        ${isDark ? 'bg-gray-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]' : 'bg-gray-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]'}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="sr-only">Use setting</span>

      {/* Sun Icon in Track (Left) - Visible when Dark */}
      <span className={`absolute left-1.5 top-1.5 text-gray-400 transition-opacity duration-200 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </span>

      {/* Moon Icon in Track (Right) - Visible when Light */}
      <span className={`absolute right-1.5 top-1.5 text-gray-400 transition-opacity duration-200 ${!isDark ? 'opacity-100' : 'opacity-0'}`}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </span>

      {/* Thumb */}
      <span
        aria-hidden="true"
        className={`
          pointer-events-none flex items-center justify-center h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out -translate-y-0.5
          ${isDark ? 'translate-x-6 bg-gray-700' : 'translate-x-0 bg-white'}
        `}
      >
        {/* Icon inside Thumb */}
        {isDark ? (
          <svg className="h-4 w-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </span>
    </button>
  );
}

export default function ThemeToggle() {
  return <ThemeToggleInner />;
}

