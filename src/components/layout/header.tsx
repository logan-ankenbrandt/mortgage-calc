import { Menu, Building2, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useTheme } from './theme-provider'
import { cn } from '@/lib/utils'
import {
  Home,
  DollarSign,
  PiggyBank,
  BarChart3,
  Calculator,
  TrendingUp,
  Newspaper,
  Settings,
} from 'lucide-react'

interface NavItem {
  title: string
  icon: React.ElementType
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
    items: [{ title: 'News & Insights', icon: Newspaper, id: 'market' }],
  },
]

interface HeaderProps {
  activeSection: string
  onSectionChange: (section: string) => void
  className?: string
}

export function Header({
  activeSection,
  onSectionChange,
  className,
}: HeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()

  const getSectionTitle = () => {
    for (const group of navGroups) {
      const item = group.items.find((i) => i.id === activeSection)
      if (item) return item.title
    }
    return 'Mortgage Calculator'
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden',
        className
      )}
    >
      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Mortgage Calculator
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-5rem)]">
            <nav className="space-y-6 p-4">
              {navGroups.map((group) => (
                <div key={group.title}>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.title}
                  </h4>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = activeSection === item.id
                      const Icon = item.icon

                      return (
                        <Button
                          key={item.id}
                          variant={isActive ? 'secondary' : 'ghost'}
                          className={cn(
                            'w-full justify-start',
                            isActive && 'bg-accent text-accent-foreground'
                          )}
                          onClick={() => onSectionChange(item.id)}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
            <Separator className="mx-4" />
            <div className="flex items-center gap-2 p-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
                }
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSectionChange('settings')}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Title */}
      <h1 className="text-lg font-semibold">{getSectionTitle()}</h1>

      {/* Theme Toggle (Mobile) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>
    </header>
  )
}
