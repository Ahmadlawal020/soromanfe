import { create } from 'zustand'

/** What the user picked. System preference must stay reachable. */
export type ThemePreference = 'light' | 'dark' | 'system'
/** What that resolves to right now — this is what drives the .dark class. */
export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'soroman-theme'

function prefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function getInitialPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light' || stored === 'system') return stored
  } catch {
    // localStorage unavailable
  }
  return 'system'
}

function resolveTheme(preference: ThemePreference): Theme {
  if (preference === 'system') return prefersDark() ? 'dark' : 'light'
  return preference
}

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function persist(preference: ThemePreference) {
  try {
    localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // localStorage unavailable
  }
}

interface LayoutState {
  isCollapsed: boolean
  isMobileOpen: boolean
  /** The resolved theme — read this for rendering sun/moon state. */
  theme: Theme
  /** The user's choice, including 'system'. */
  themePreference: ThemePreference
  toggleCollapsed: () => void
  setCollapsed: (collapsed: boolean) => void
  toggleMobileOpen: () => void
  setMobileOpen: (open: boolean) => void
  /** Flips between light and dark, dropping out of 'system'. */
  toggleTheme: () => void
  setTheme: (preference: ThemePreference) => void
}

const initialPreference = getInitialPreference()
const initialTheme = resolveTheme(initialPreference)
applyTheme(initialTheme)

export const useLayoutStore = create<LayoutState>((set, get) => ({
  isCollapsed: false,
  isMobileOpen: false,
  theme: initialTheme,
  themePreference: initialPreference,
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
  toggleMobileOpen: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
  toggleTheme: () => get().setTheme(get().theme === 'light' ? 'dark' : 'light'),
  setTheme: (preference) => {
    const theme = resolveTheme(preference)
    applyTheme(theme)
    persist(preference)
    // Previously this returned the new state instead of calling set(), so the
    // store never updated and the UI kept rendering the old theme.
    set({ theme, themePreference: preference })
  },
}))

// While the preference is 'system', follow the OS as it changes.
if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      const { themePreference, setTheme } = useLayoutStore.getState()
      if (themePreference === 'system') setTheme('system')
    })
}
