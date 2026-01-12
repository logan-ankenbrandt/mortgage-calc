import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  DollarSign,
  Building2,
  PiggyBank,
  BarChart3,
  Calculator,
  TrendingUp,
  Newspaper,
  Settings,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTheme } from './theme-provider'

interface NavItem {
  title: string
  icon: React.ElementType
  href?: string
  id: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: 'Calculator',
    items: [
      { title: 'Dashboard', icon: Home, id: 'dashboard' },
      { title: 'Income', icon: DollarSign, id: 'income' },
      { title: 'Property', icon: Building2, id: 'property' },
      { title: 'Savings', icon: PiggyBank, id: 'savings' },
      { title: 'Scenarios', icon: BarChart3, id: 'scenarios' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { title: 'Amortization', icon: Calculator, id: 'amortization' },
      { title: 'Analysis', icon: TrendingUp, id: 'analysis' },
    ],
  },
  {
    title: 'Market',
    items: [
      { title: 'News & Insights', icon: Newspaper, id: 'market' },
    ],
  },
]

interface AppSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function AppSidebar({
  activeSection,
  onSectionChange,
  collapsed = false,
  onCollapsedChange,
}: AppSidebarProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const [isCollapsed, setIsCollapsed] = useState(collapsed)

  const handleCollapse = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onCollapsedChange?.(newCollapsed)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'relative flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground',
          isCollapsed ? 'items-center' : ''
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex h-16 items-center border-b px-4',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2"
              >
                <Building2 className="h-6 w-6 text-sidebar-primary" />
                <span className="font-semibold">Mortgage Calc</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCollapse}
            className="h-8 w-8"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="space-y-6">
            {navGroups.map((group) => (
              <div key={group.title}>
                {!isCollapsed && (
                  <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                    {group.title}
                  </h4>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = activeSection === item.id
                    const Icon = item.icon

                    const button = (
                      <Button
                        key={item.id}
                        variant={isActive ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start',
                          isCollapsed && 'justify-center px-2',
                          isActive &&
                            'bg-sidebar-accent text-sidebar-accent-foreground'
                        )}
                        onClick={() => onSectionChange(item.id)}
                      >
                        <Icon className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
                        {!isCollapsed && <span>{item.title}</span>}
                      </Button>
                    )

                    if (isCollapsed) {
                      return (
                        <Tooltip key={item.id}>
                          <TooltipTrigger asChild>{button}</TooltipTrigger>
                          <TooltipContent side="right">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }

                    return button
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-2">
          <Separator className="mb-2" />
          <div className={cn('flex', isCollapsed ? 'flex-col gap-1' : 'gap-1')}>
            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
                  }
                  className="h-8 w-8"
                >
                  {resolvedTheme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isCollapsed ? 'right' : 'top'}>
                Toggle theme
              </TooltipContent>
            </Tooltip>

            {/* Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSectionChange('settings')}
                  className="h-8 w-8"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isCollapsed ? 'right' : 'top'}>
                Settings
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
