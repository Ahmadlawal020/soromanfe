import { create } from 'zustand'

export type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  return 'light'
}

function applyTheme(_theme: Theme) {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  root.classList.remove('dark')
  localStorage.setItem('soroman-theme', 'light')
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
  theme: 'light',
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
  toggleMobileOpen: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
  toggleTheme: () => {
    applyTheme('light')
    return { theme: 'light' }
  },
  setTheme: () => {
    applyTheme('light')
    return { theme: 'light' }
  },
}))

