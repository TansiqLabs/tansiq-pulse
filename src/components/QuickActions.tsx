import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  UserPlus,
  CalendarPlus,
  Receipt,
  Stethoscope,
  ClipboardList,
  Settings,
  FileText,
  Pill,
  FlaskConical,
  Ambulance,
  BedDouble,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface QuickAction {
  icon: React.ElementType
  label: string
  description: string
  href: string
  gradient: string
  bgGradient: string
}

const quickActions: QuickAction[] = [
  {
    icon: UserPlus,
    label: 'New Patient',
    description: 'Register a new patient',
    href: '/patients?action=new',
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-950/50 dark:hover:to-blue-900/30',
  },
  {
    icon: CalendarPlus,
    label: 'Appointment',
    description: 'Schedule appointment',
    href: '/appointments?action=new',
    gradient: 'from-green-500 to-green-600',
    bgGradient: 'hover:from-green-50 hover:to-green-100 dark:hover:from-green-950/50 dark:hover:to-green-900/30',
  },
  {
    icon: Receipt,
    label: 'Invoice',
    description: 'Create new invoice',
    href: '/billing?action=new',
    gradient: 'from-purple-500 to-purple-600',
    bgGradient: 'hover:from-purple-50 hover:to-purple-100 dark:hover:from-purple-950/50 dark:hover:to-purple-900/30',
  },
  {
    icon: FileText,
    label: 'Prescription',
    description: 'Write prescription',
    href: '/prescriptions?action=new',
    gradient: 'from-cyan-500 to-cyan-600',
    bgGradient: 'hover:from-cyan-50 hover:to-cyan-100 dark:hover:from-cyan-950/50 dark:hover:to-cyan-900/30',
  },
  {
    icon: FlaskConical,
    label: 'Lab Order',
    description: 'Request lab tests',
    href: '/lab-results?action=new',
    gradient: 'from-amber-500 to-amber-600',
    bgGradient: 'hover:from-amber-50 hover:to-amber-100 dark:hover:from-amber-950/50 dark:hover:to-amber-900/30',
  },
  {
    icon: ClipboardList,
    label: 'View Queue',
    description: 'Patient waiting list',
    href: '/queue',
    gradient: 'from-orange-500 to-orange-600',
    bgGradient: 'hover:from-orange-50 hover:to-orange-100 dark:hover:from-orange-950/50 dark:hover:to-orange-900/30',
  },
  {
    icon: Ambulance,
    label: 'Emergency',
    description: 'ER Dashboard',
    href: '/emergency',
    gradient: 'from-red-500 to-red-600',
    bgGradient: 'hover:from-red-50 hover:to-red-100 dark:hover:from-red-950/50 dark:hover:to-red-900/30',
  },
  {
    icon: Pill,
    label: 'Pharmacy',
    description: 'Manage medications',
    href: '/pharmacy',
    gradient: 'from-pink-500 to-pink-600',
    bgGradient: 'hover:from-pink-50 hover:to-pink-100 dark:hover:from-pink-950/50 dark:hover:to-pink-900/30',
  },
  {
    icon: BedDouble,
    label: 'Beds',
    description: 'Bed management',
    href: '/beds',
    gradient: 'from-teal-500 to-teal-600',
    bgGradient: 'hover:from-teal-50 hover:to-teal-100 dark:hover:from-teal-950/50 dark:hover:to-teal-900/30',
  },
  {
    icon: Stethoscope,
    label: 'Doctors',
    description: 'Manage doctors',
    href: '/doctors',
    gradient: 'from-indigo-500 to-indigo-600',
    bgGradient: 'hover:from-indigo-50 hover:to-indigo-100 dark:hover:from-indigo-950/50 dark:hover:to-indigo-900/30',
  },
  {
    icon: Users,
    label: 'Staff',
    description: 'Staff directory',
    href: '/staff',
    gradient: 'from-violet-500 to-violet-600',
    bgGradient: 'hover:from-violet-50 hover:to-violet-100 dark:hover:from-violet-950/50 dark:hover:to-violet-900/30',
  },
  {
    icon: Settings,
    label: 'Settings',
    description: 'System settings',
    href: '/settings',
    gradient: 'from-slate-500 to-slate-600',
    bgGradient: 'hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-950/50 dark:hover:to-slate-900/30',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
}

const item = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
}

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription className="text-xs">Frequently used actions</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2"
        >
          {quickActions.map((action) => (
            <motion.div key={action.label} variants={item}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex flex-col h-auto py-3 px-2 w-full gap-1.5 rounded-xl transition-all duration-200",
                      "bg-gradient-to-br from-transparent to-transparent",
                      action.bgGradient,
                      "group"
                    )}
                    onClick={() => navigate(action.href)}
                  >
                    <div className={cn(
                      "p-2.5 rounded-xl bg-gradient-to-br text-white shadow-lg",
                      "transition-transform duration-200 group-hover:scale-110",
                      action.gradient
                    )}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-medium text-center leading-tight">
                      {action.label}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-foreground text-background">
                  <p className="font-medium">{action.label}</p>
                  <p className="text-xs opacity-80">{action.description}</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  )
}
