'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export const THEME_STORAGE_KEY = 'gclt-theme';

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
  root.style.colorScheme = theme;
}

export default function ThemeToggle({ className = 'theme-toggle', size = 18 }) {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    const stored = (() => {
      try {
        return localStorage.getItem(THEME_STORAGE_KEY);
      } catch (err) {
        return null;
      }
    })();
    const current = stored === 'dark' || stored === 'light'
      ? stored
      : document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    setTheme(current);
    applyTheme(current);

    if (stored === 'dark' || stored === 'light') return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      setTheme(e.matches ? 'dark' : 'light');
      applyTheme(e.matches ? 'dark' : 'light');
    };
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (err) {
      /* storage may be unavailable (private mode) — theme still applies */
    }
  };

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={className}
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === null ? <Moon size={size} style={{ opacity: 0 }} /> : isDark ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  );
}
