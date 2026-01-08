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

import { Switch } from './ui/Switch';

function ThemeToggleButton({ theme, toggleTheme }: { theme: 'light' | 'dark'; toggleTheme: () => void }) {
  const isDark = theme === 'dark';

  return (
    <Switch
      checked={isDark}
      onChange={toggleTheme}
      size="md"
      activeColor="bg-gray-800"
      iconOn={
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      }
      iconOff={
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      }
    />
  );
}

export default function ThemeToggle() {
  return <ThemeToggleInner />;

