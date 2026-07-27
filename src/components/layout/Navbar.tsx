import { useState, useEffect } from 'react'
import { Menu, Search, Bell, Settings, LogOut, User, ChevronsLeft, ChevronsRight, Sun, Moon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Separator } from '#/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { useAuthStore, useAdminLogout } from '#/modules/auth'
import { useLayoutStore } from '#/stores/layoutStore'
import CommandPalette from './CommandPalette'

export default function Navbar() {
  const { isCollapsed, toggleCollapsed, toggleMobileOpen, theme, toggleTheme } = useLayoutStore()
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logoutMutation = useAdminLogout()

  const notifications = [
    { id: 1, message: 'New driver registered', time: '5m ago', unread: true },
    { id: 2, message: 'Truck TRK-003 completed maintenance', time: '1h ago', unread: true },
    { id: 3, message: 'Depot capacity alert: Port Harcourt', time: '2h ago', unread: false },
  ]
  const unreadCount = notifications.filter((n) => n.unread).length

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
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 lg:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMobileOpen}
            className="md:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleCollapsed}
            className="hidden md:flex h-9 w-9 text-muted-foreground hover:text-foreground"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </Button>

          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-foreground">
              Soroman Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Logistics & Fleet Management
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="relative hidden md:flex items-center w-64 lg:w-80 ml-auto h-9 px-3 rounded-lg border border-input bg-background/50 hover:bg-accent text-sm text-muted-foreground transition-colors cursor-pointer justify-between"
            aria-label="Search dashboard (Ctrl+K)"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">Search dashboard...</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCommandPaletteOpen(true)}
            className="md:hidden ml-auto"
            aria-label="Open search command palette"
          >
            <Search size={18} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? (
              <Sun size={16} className="text-amber-400 transition-all duration-300 rotate-0 hover:rotate-45" />
            ) : (
              <Moon size={16} className="text-slate-700 transition-all duration-300" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell size={16} />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-2 py-1.5">
                <span className="text-sm font-semibold">Notifications</span>
              </div>
              <DropdownMenuSeparator />
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start p-3 cursor-pointer"
                >
                  <div className="flex w-full justify-between">
                    <span className="text-sm">{notification.message}</span>
                    {notification.unread && (
                      <div className="h-2 w-2 bg-primary rounded-full shrink-0 ml-2 mt-1" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {notification.time}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-lime-700 to-lime-500 flex items-center justify-center text-white font-bold text-sm">
                  {initials}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem disabled className="cursor-default">
                <User className="mr-2 h-4 w-4" />
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{displayEmail}</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
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

