import React, { useState, useEffect } from 'react'
import {
  createRootRoute,
  useRouter,
  useRouterState,
  Link,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { useAuthStore } from '#/modules/auth'
import { useLayoutStore } from '#/stores/layoutStore'
import Sidebar from '#/components/layout/Sidebar'
import Navbar from '#/components/layout/Navbar'
import { QueryProvider } from '#/components/QueryProvider'
import { ToastContainer } from '#/components/ui/toast'
import { Button } from '#/components/ui/button'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Soroman Admin Dashboard',
      },
    ],
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous' as const,
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Onest:wght@100..900&display=swap',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center text-warning border border-warning/20">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-2xl font-bold text-foreground">Page Not Found</h2>
      <p className="text-muted-foreground max-w-sm">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link to="/overview">
        <Button>
          <ArrowLeft size={16} className="mr-2" />
          Back to Overview
        </Button>
      </Link>
    </div>
  )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const location = useRouterState({ select: (s) => s.location })

  // Instantly check if user session is already active or if accessing a public route 
  // to prevent showing a loading screen to already authenticated users.
  const [isReady, setIsReady] = useState(false)

  const isPublicRoute = location.pathname === '/login' || location.pathname === '/set-password'
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!isPublicRoute && !accessToken && !user) {
      router.navigate({ to: '/login' })
      return
    }

    setIsReady(true)
  }, [location.pathname, router, accessToken, user, isPublicRoute])

  if (!isReady && !isPublicRoute) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground transition-colors duration-300">
        <div className="relative flex flex-col items-center">
          {/* Logo container with pulse & subtle ring */}
          <div className="relative flex items-center justify-center w-24 h-24 mb-4">
            {/* Spinning gradient ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />

            {/* Pulsing glow background */}
            <div className="absolute inset-2 rounded-full bg-primary/10 blur-md animate-pulse" />

            {/* Centered logo */}
            <img
              src="/logo.png"
              alt="Soroman"
              className="relative w-10 h-10 object-contain"
            />
          </div>

          {/* Brand/Loading text */}
          <h2 className="text-sm font-semibold tracking-wider text-foreground uppercase animate-pulse">
            Soroman
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Securing session...
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useLayoutStore()
  const location = useRouterState({ select: (s) => s.location })
  const isLoginRoute = location.pathname === '/login'

  const isPublicRoute = isLoginRoute || location.pathname === '/set-password'

  return (
    <QueryProvider>
      <AuthGuard>
        {isPublicRoute ? (
          children
        ) : (
          <div className="flex min-h-screen text-foreground bg-background">
            <Sidebar />

            <div
              className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out
                ${isCollapsed ? 'md:pl-[72px]' : 'md:pl-64'}
              `}
            >
              <Navbar />

              <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                <div className="mx-auto max-w-7xl animate-fade-in">
                  {children}
                </div>
              </main>
            </div>
          </div>
        )}
      </AuthGuard>

      <ToastContainer />

      {import.meta.env.DEV && (
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      )}
    </QueryProvider>
  )
}
