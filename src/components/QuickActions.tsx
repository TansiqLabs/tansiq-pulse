import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  UserPlus,
  CalendarPlus,
  Receipt,
  Stethoscope,
  ClipboardList,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface QuickAction {
  icon: React.ElementType
  label: string
  description: string
  href: string
  color: string
}

const quickActions: QuickAction[] = [
  {
    icon: UserPlus,
    label: 'New Patient',
    description: 'Register a new patient',
    href: '/patients?action=new',
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    icon: CalendarPlus,
    label: 'New Appointment',
    description: 'Schedule an appointment',
    href: '/appointments?action=new',
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    icon: Receipt,
    label: 'New Invoice',
    description: 'Create a new invoice',
    href: '/billing?action=new',
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    icon: ClipboardList,
    label: 'View Queue',
    description: 'Check waiting patients',
    href: '/queue',
    color: 'bg-orange-500 hover:bg-orange-600',
  },
  {
    icon: Stethoscope,
    label: 'Doctors',
    description: 'Manage doctors',
    href: '/doctors',
    color: 'bg-teal-500 hover:bg-teal-600',
  },
  {
    icon: Settings,
    label: 'Settings',
    description: 'System settings',
    href: '/settings',
    color: 'bg-slate-500 hover:bg-slate-600',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 },
}

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-3 sm:grid-cols-6"
        >
          {quickActions.map((action) => (
            <motion.div key={action.label} variants={item}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex flex-col h-auto py-4 w-full gap-2 hover:bg-muted"
                    onClick={() => navigate(action.href)}
                  >
                    <div className={`p-2 rounded-lg ${action.color} text-white`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{action.description}</p>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  )
}
