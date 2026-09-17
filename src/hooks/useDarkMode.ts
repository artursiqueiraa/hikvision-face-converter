import { useEffect, useState } from 'react'

const STORAGE_KEY = 'hikvision-converter-theme'

function getInitialTheme(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark') return true
    if (stored === 'light') return false
  } catch {
    // ignore storage access errors (private mode, etc.)
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function useDarkMode(): [boolean, () => void] {
  const [isDark, setIsDark] = useState(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) root.classList.add('dark')
    else root.classList.remove('dark')
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
    } catch {
      // ignore
    }
  }, [isDark])

  const toggle = () => setIsDark((prev) => !prev)

  return [isDark, toggle]
}
