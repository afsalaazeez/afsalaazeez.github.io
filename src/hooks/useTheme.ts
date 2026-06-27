import { useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

/**
 * Shared dark/light theme. Persists to localStorage, reflects onto
 * <html data-theme>, and fires a `themechange` event so the 3D scene can react.
 * The initial value mirrors the inline boot script in index.html (no flash).
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) || 'dark'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}
