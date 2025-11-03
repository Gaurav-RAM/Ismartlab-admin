import React, { createContext, useContext, useMemo, useState } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [fontScale, setFontScale] = useState(1);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));
  const smaller = () => setFontScale(s => Math.max(0.9, +(s - 0.05).toFixed(2)));
  const larger = () => setFontScale(s => Math.min(1.2, +(s + 0.05).toFixed(2)));

  const value = useMemo(() => ({ theme, toggleTheme, fontScale, smaller, larger }), [theme, fontScale]);
  return (
    <UIContext.Provider value={value}>
      <div data-theme={theme} style={{ fontSize: `${fontScale}rem` }}>{children}</div>
    </UIContext.Provider>
  )
}

export const useUI = () => useContext(UIContext);
