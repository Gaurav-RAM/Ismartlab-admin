// src/state/UIContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const UIContext = createContext(null);

const SCALE_MIN = 0.85;
const SCALE_MAX = 1.30;
const SCALE_STEP = 0.05;

export function UIProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [fontScale, setFontScale] = useState(() => {
    const v = parseFloat(localStorage.getItem('fontScale'));
    return Number.isFinite(v) ? Math.min(SCALE_MAX, Math.max(SCALE_MIN, v)) : 1;
  });

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));
  const smaller = () => setFontScale(s => Math.max(SCALE_MIN, +(s - SCALE_STEP).toFixed(2)));
  const resetSize = () => setFontScale(1);
  const larger = () => setFontScale(s => Math.min(SCALE_MAX, +(s + SCALE_STEP).toFixed(2)));

  useEffect(() => {
    document.documentElement.dataset.theme = theme; // <html data-theme="...">
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${Math.round(fontScale * 100)}%`; // affects rem
    localStorage.setItem('fontScale', String(fontScale));
  }, [fontScale]);

  const value = useMemo(
    () => ({ theme, toggleTheme, smaller, resetSize, larger, fontScale, SCALE_MIN, SCALE_MAX }),
    [theme, fontScale]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export const useUI = () => useContext(UIContext);
