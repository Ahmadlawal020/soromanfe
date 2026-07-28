import { create } from 'zustand'

export type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem('soroman-theme')
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // localStorage unavailable
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  try {
    localStorage.setItem('soroman-theme', theme)
  } catch {
    // localStorage unavailable
  }
}

interface LayoutState {
  isCollapsed: boolean
  isMobileOpen: boolean
  theme: Theme
  toggleCollapsed: () => void
  setCollapsed: (collapsed: boolean) => void
  toggleMobileOpen: () => void
  setMobileOpen: (open: boolean) => void
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const initialTheme = getInitialTheme()
applyTheme(initialTheme)

export const useLayoutStore = create<LayoutState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  theme: initialTheme,
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
  toggleMobileOpen: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light'
      applyTheme(next)
      return { theme: next }
    }),
  setTheme: (theme) => {
    applyTheme(theme)
    return { theme }
  },
}))
