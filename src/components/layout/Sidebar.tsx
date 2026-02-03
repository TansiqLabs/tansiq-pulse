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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Appointments', href: '/appointments', icon: CalendarDays },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Queue', href: '/queue', icon: ListOrdered },
  { name: 'Billing', href: '/billing', icon: Receipt },
  { name: 'Expenses', href: '/expenses', icon: Wallet },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Doctors', href: '/doctors', icon: Stethoscope },
  { name: 'Services', href: '/services', icon: Package },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-card"
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b px-6 electron-drag">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary"
          >
            <Heart className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight">Tansiq Pulse</span>
            <span className="text-xs text-muted-foreground">Hospital Management</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item, index) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/' && location.pathname.startsWith(item.href))
            
            return (
              <motion.div
                key={item.name}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.href}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 rounded-lg bg-primary"
                          initial={false}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}
                      <item.icon className={cn(
                        'relative z-10 h-5 w-5 shrink-0',
                        isActive ? 'text-primary-foreground' : ''
                      )} />
                      <span className="relative z-10">{item.name}</span>
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="md:hidden">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">TP</span>
              </div>
              <span className="text-xs font-medium">Tansiq Pulse</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Version 1.0.0
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              © 2026 Tansiq Labs
            </p>
            <a 
              href="https://tansiqlabs.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-1 inline-block"
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
