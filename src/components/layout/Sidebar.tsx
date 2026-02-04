import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Receipt,
  Stethoscope,
  Settings,
  Heart,
  BarChart3,
  ListOrdered,
  Package,
  Wallet,
  Calendar,
  PieChart,
  UserCog,
  BedDouble,
  Bell,
  Clock,
  Boxes,
  FileText,
  ClipboardList,
  Shield,
  ArrowRightLeft,
  Scissors,
  MessageSquare,
  Wrench,
  Pill,
  Ambulance,
  Inbox,
  ChevronDown,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: string | number
  badgeColor?: string
}

interface NavGroup {
  name: string
  icon: React.ElementType
  items: NavItem[]
}

const navigation: (NavItem | NavGroup)[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  {
    name: 'Patients',
    icon: Users,
    items: [
      { name: 'All Patients', href: '/patients', icon: Users },
      { name: 'Queue', href: '/queue', icon: ListOrdered, badge: '3', badgeColor: 'bg-amber-500' },
      { name: 'Waitlist', href: '/waitlist', icon: ClipboardList },
      { name: 'Referrals', href: '/referrals', icon: ArrowRightLeft },
    ],
  },
  {
    name: 'Appointments',
    icon: CalendarDays,
    items: [
      { name: 'All Appointments', href: '/appointments', icon: CalendarDays },
      { name: 'Schedule', href: '/schedule', icon: Calendar },
      { name: 'Surgery', href: '/surgery', icon: Scissors },
    ],
  },
  { name: 'Emergency', href: '/emergency', icon: Ambulance, badge: '!', badgeColor: 'bg-red-500' },
  { name: 'Pharmacy', href: '/pharmacy', icon: Pill },
  {
    name: 'Finance',
    icon: Receipt,
    items: [
      { name: 'Billing', href: '/billing', icon: Receipt },
      { name: 'Expenses', href: '/expenses', icon: Wallet },
      { name: 'Claims', href: '/claims', icon: Shield },
    ],
  },
  {
    name: 'Reports',
    icon: BarChart3,
    items: [
      { name: 'Reports', href: '/reports', icon: BarChart3 },
      { name: 'Analytics', href: '/analytics', icon: PieChart },
      { name: 'Feedback', href: '/feedback', icon: MessageSquare },
    ],
  },
  { name: 'Messages', href: '/messages', icon: Inbox, badge: 5, badgeColor: 'bg-indigo-500' },
  {
    name: 'Staff',
    icon: UserCog,
    items: [
      { name: 'Doctors', href: '/doctors', icon: Stethoscope },
      { name: 'Staff Directory', href: '/staff', icon: UserCog },
      { name: 'Shifts', href: '/shifts', icon: Clock },
    ],
  },
  {
    name: 'Resources',
    icon: Boxes,
    items: [
      { name: 'Beds', href: '/beds', icon: BedDouble },
      { name: 'Inventory', href: '/inventory', icon: Boxes },
      { name: 'Equipment', href: '/equipment', icon: Wrench },
      { name: 'Documents', href: '/documents', icon: FileText },
      { name: 'Services', href: '/services', icon: Package },
    ],
  },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
]

function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return 'items' in item
}

function NavItemComponent({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <NavLink
      to={item.href}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/25'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <item.icon className={cn(
        'h-4.5 w-4.5 shrink-0 transition-transform duration-200',
        isActive ? 'text-primary-foreground' : 'group-hover:scale-110'
      )} />
      <span className="flex-1">{item.name}</span>
      {item.badge && (
        <Badge 
          className={cn(
            "h-5 min-w-5 px-1.5 text-[10px] font-bold text-white justify-center",
            item.badgeColor || "bg-primary"
          )}
        >
          {item.badge}
        </Badge>
      )}
    </NavLink>
  )
}

function NavGroupComponent({ group }: { group: NavGroup }) {
  const location = useLocation()
  const isGroupActive = group.items.some(
    item => location.pathname === item.href || 
    (item.href !== '/' && location.pathname.startsWith(item.href))
  )
  const [isOpen, setIsOpen] = useState(isGroupActive)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className={cn(
        'group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
        isGroupActive
          ? 'bg-muted/80 text-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}>
        <group.icon className="h-4.5 w-4.5 shrink-0" />
        <span className="flex-1 text-left">{group.name}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ml-4 mt-1 space-y-1 border-l-2 border-muted pl-3"
        >
          {group.items.map(item => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href))
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  'group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <Badge 
                    className={cn(
                      "h-4 min-w-4 px-1 text-[9px] font-bold text-white justify-center",
                      item.badgeColor || "bg-primary"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            )
          })}
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function Sidebar() {
  const location = useLocation()

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/50 bg-gradient-to-b from-card to-card/95"
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border/50 px-5 electron-drag">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-lg shadow-primary/25"
          >
            <Heart className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Tansiq Pulse
            </span>
            <span className="text-[11px] text-muted-foreground">Hospital Management</span>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navigation.map((item, index) => {
              if (isNavGroup(item)) {
                return <NavGroupComponent key={item.name} group={item} />
              }
              
              const isActive = location.pathname === item.href ||
                (item.href !== '/' && location.pathname.startsWith(item.href))
              
              return (
                <motion.div
                  key={item.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <NavItemComponent item={item} isActive={isActive} />
                </motion.div>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border/50 p-3">
          <div className="rounded-xl bg-gradient-to-br from-muted/80 to-muted/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xs font-semibold">Tansiq Pulse</span>
                <span className="text-[10px] text-muted-foreground block">v1.0.0</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              © 2026 Tansiq Labs
            </p>
            <a 
              href="https://tansiqlabs.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline mt-0.5 inline-block font-medium"
              onClick={(e) => {
                e.preventDefault()
                window.electronAPI?.shell?.openExternal('https://tansiqlabs.com')
              }}
            >
              tansiqlabs.com
            </a>
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
