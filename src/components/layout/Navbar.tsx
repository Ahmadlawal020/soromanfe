import { useState, useEffect } from 'react'
import {
  Menu,
  Search,
  Bell,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  Monitor,
  Check,
  SidebarCloseIcon,
  SidebarOpenIcon,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { StatusChip } from '#/components/ui/status-chip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { useAuthStore, useAdminLogout } from '#/modules/auth'
import { useLayoutStore, type ThemePreference } from '#/stores/layoutStore'
import { MICRO } from '#/lib/panel'
import CommandPalette from './CommandPalette'

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export default function Navbar() {
  const {
    isCollapsed,
    toggleCollapsed,
    toggleMobileOpen,
    themePreference,
    setTheme,
  } = useLayoutStore()
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logoutMutation = useAdminLogout()

  // Notifications are not yet integrated with the backend.
  // When a notification API is available, replace this with a useQuery hook.
  const notifications: { id: number; message: string; time: string; unread: boolean }[] = []
  const unreadCount = 0

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.surname?.[0] || ''}`.toUpperCase()
    : 'A'

  const displayName = user ? `${user.firstName} ${user.surname}` : 'Admin'
  const displayEmail = user?.email || 'admin@soroman.com'

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
    } catch {
      // Logout may fail if server is unreachable; clear local session anyway
    }
    window.location.href = '/login'
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-12 w-full shrink-0 items-center justify-between gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleMobileOpen}
            className="md:hidden"
          >
            <Menu />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleCollapsed}
            className="-ml-1 hidden text-muted-foreground hover:text-foreground md:flex"
          >
            {isCollapsed ? <SidebarOpenIcon /> : <SidebarCloseIcon />}
            <span className="sr-only">
              {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </span>
          </Button>

          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="relative ml-auto hidden h-7 w-64 cursor-pointer items-center justify-between rounded-lg border border-input px-2.5 text-sm text-muted-foreground transition-colors duration-250 ease-luxe outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:flex lg:w-80 dark:bg-input/30"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="size-3.5 shrink-0" />
              <span className="truncate">Search dashboard…</span>
            </span>
            <kbd className="pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-xs font-normal select-none">
              {navigator.userAgent?.includes('Mac') ? '⌘' : 'Ctrl+'}K
            </kbd>
          </button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCommandPaletteOpen(true)}
            className="ml-auto md:hidden"
          >
            <Search />
            <span className="sr-only">Open search</span>
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {/* Appearance is a three-option menu, never a blind flip — system
              preference has to stay reachable. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="relative">
                <Sun className="size-4 scale-100 rotate-0 transition-transform duration-700 ease-luxe dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute size-4 scale-0 rotate-90 transition-transform duration-700 ease-luxe dark:scale-100 dark:rotate-0" />
                <span className="sr-only">Change appearance</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => setTheme(value)}
                  className="cursor-pointer"
                >
                  <Icon />
                  <span className="flex-1">{label}</span>
                  {themePreference === value && (
                    <Check className="size-3.5 text-accent" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="relative">
                <Bell />
                {unreadCount > 0 && (
                  <span
                    aria-hidden
                    className="absolute top-1 right-1 size-1.5 rounded-full bg-accent"
                  />
                )}
                <span className="sr-only">
                  {`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-foreground/15 px-3 py-2.5">
                <span className={MICRO}>Notifications</span>
                {unreadCount > 0 && (
                  <StatusChip tone="accent">{unreadCount} new</StatusChip>
                )}
              </div>
              <div className="p-1">
                {notifications.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex cursor-pointer flex-col items-start gap-0.5 p-3"
                    >
                      <div className="flex w-full justify-between gap-2">
                        <span className="text-sm">{notification.message}</span>
                        {notification.unread && (
                          <span
                            aria-hidden
                            className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent"
                          />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {notification.time}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="rounded-full">
                <Avatar size="sm">
                  <AvatarFallback className="text-xs font-normal">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="px-2 py-1.5">
                <p className="truncate text-sm font-normal">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {displayEmail}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </>
  )
}
