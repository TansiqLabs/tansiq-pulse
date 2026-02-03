import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { isToday, differenceInMinutes } from 'date-fns'
import {
  Bell,
  Clock,
  Calendar,
  User,
  X,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Appointment } from '@/types'

interface Reminder {
  id: string
  appointmentId: number
  type: 'upcoming' | 'starting_soon' | 'overdue' | 'waiting'
  title: string
  message: string
  time: string
  patient: string
  doctor: string
  priority: 'low' | 'medium' | 'high'
  read: boolean
}

export function AppointmentReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadReminders()
    // Refresh every minute
    const interval = setInterval(loadReminders, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadReminders = async () => {
    try {
      const appointments = await window.electronAPI.appointments.getAll()
      const now = new Date()
      const generatedReminders: Reminder[] = []

      appointments.forEach((apt: Appointment) => {
        const aptDate = new Date(apt.scheduledDate)
        const [hours, minutes] = (apt.scheduledTime || '00:00').split(':').map(Number)
        aptDate.setHours(hours, minutes, 0, 0)

        const minutesUntil = differenceInMinutes(aptDate, now)
        const patientName = apt.patient 
          ? `${apt.patient.firstName} ${apt.patient.lastName}` 
          : 'Unknown Patient'
        const doctorName = apt.doctor 
          ? `Dr. ${apt.doctor.lastName}` 
          : 'Unknown Doctor'

        // Starting soon (within 30 minutes)
        if (apt.status === 'SCHEDULED' && minutesUntil > 0 && minutesUntil <= 30) {
          generatedReminders.push({
            id: `starting-${apt.id}`,
            appointmentId: apt.id,
            type: 'starting_soon',
            title: 'Appointment Starting Soon',
            message: `${patientName}'s appointment starts in ${minutesUntil} minutes`,
            time: apt.scheduledTime || '',
            patient: patientName,
            doctor: doctorName,
            priority: 'high',
            read: false,
          })
        }

        // Upcoming today (more than 30 minutes but today)
        if (apt.status === 'SCHEDULED' && isToday(aptDate) && minutesUntil > 30) {
          generatedReminders.push({
            id: `upcoming-${apt.id}`,
            appointmentId: apt.id,
            type: 'upcoming',
            title: 'Upcoming Appointment Today',
            message: `${patientName} has an appointment at ${apt.scheduledTime}`,
            time: apt.scheduledTime || '',
            patient: patientName,
            doctor: doctorName,
            priority: 'medium',
            read: false,
          })
        }

        // Waiting patients
        if (apt.status === 'WAITING') {
          const waitTime = apt.arrivedAt 
            ? differenceInMinutes(now, new Date(apt.arrivedAt))
            : 0
          generatedReminders.push({
            id: `waiting-${apt.id}`,
            appointmentId: apt.id,
            type: 'waiting',
            title: 'Patient Waiting',
            message: `${patientName} has been waiting for ${waitTime} minutes`,
            time: apt.scheduledTime || '',
            patient: patientName,
            doctor: doctorName,
            priority: waitTime > 15 ? 'high' : 'medium',
            read: false,
          })
        }

        // Overdue (scheduled but past time)
        if (apt.status === 'SCHEDULED' && minutesUntil < 0 && minutesUntil > -120) {
          generatedReminders.push({
            id: `overdue-${apt.id}`,
            appointmentId: apt.id,
            type: 'overdue',
            title: 'Overdue Appointment',
            message: `${patientName}'s appointment was scheduled ${Math.abs(minutesUntil)} minutes ago`,
            time: apt.scheduledTime || '',
            patient: patientName,
            doctor: doctorName,
            priority: 'high',
            read: false,
          })
        }
      })

      // Sort by priority
      generatedReminders.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

      setReminders(generatedReminders)
      setUnreadCount(generatedReminders.filter(r => !r.read).length)
    } catch (error) {
      console.error('Failed to load reminders:', error)
    }
  }

  const markAsRead = (id: string) => {
    setReminders(prev =>
      prev.map(r => (r.id === id ? { ...r, read: true } : r))
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setReminders(prev => prev.map(r => ({ ...r, read: true })))
    setUnreadCount(0)
  }

  const dismissReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'starting_soon':
        return <Clock className="h-4 w-4" />
      case 'waiting':
        return <User className="h-4 w-4" />
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </SheetTitle>
              <SheetDescription>
                {reminders.length} active reminders
              </SheetDescription>
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4 -mx-6 px-6">
          {reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">All caught up!</p>
              <p className="text-sm">No pending reminders</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {reminders.map((reminder) => (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={cn(
                      'relative rounded-lg border p-4 transition-colors',
                      reminder.read ? 'bg-muted/30' : 'bg-background',
                      !reminder.read && 'border-l-4',
                      !reminder.read && reminder.priority === 'high' && 'border-l-red-500',
                      !reminder.read && reminder.priority === 'medium' && 'border-l-yellow-500',
                      !reminder.read && reminder.priority === 'low' && 'border-l-blue-500'
                    )}
                    onClick={() => markAsRead(reminder.id)}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        dismissReminder(reminder.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>

                    <div className="flex items-start gap-3 pr-8">
                      <div className={cn('p-2 rounded-full', getPriorityColor(reminder.priority))}>
                        {getTypeIcon(reminder.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{reminder.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {reminder.time}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {reminder.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {reminder.patient}
                          </span>
                          <span>{reminder.doctor}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
