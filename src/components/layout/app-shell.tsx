import { useState } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { AppSidebar } from './app-sidebar'
import { Header } from './header'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
  activeSection: string
  onSectionChange: (section: string) => void
}

export function AppShell({
  children,
  activeSection,
  onSectionChange,
}: AppShellProps) {
  const isMobile = useIsMobile()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <AppSidebar
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <Header
            activeSection={activeSection}
            onSectionChange={onSectionChange}
          />
        )}

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 overflow-auto',
            'custom-scrollbar'
          )}
        >
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
