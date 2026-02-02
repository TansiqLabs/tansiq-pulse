import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Appointment } from '@/types'

interface CalendarViewProps {
  appointments: Appointment[]
  onDateSelect: (date: Date) => void
  onAppointmentClick?: (appointment: Appointment) => void
  selectedDate?: Date
}

export function CalendarView({
  appointments,
  onDateSelect,
  onAppointmentClick,
  selectedDate = new Date(),
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Get days to display
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {}
    appointments.forEach((apt) => {
      const dateKey = format(new Date(apt.scheduledDate), 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(apt)
    })
    return grouped
  }, [appointments])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) =>
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    )
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
    onDateSelect(new Date())
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-200',
      WAITING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      IN_PROGRESS: 'bg-purple-100 text-purple-700 border-purple-200',
      COMPLETED: 'bg-green-100 text-green-700 border-green-200',
      CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
      NO_SHOW: 'bg-red-100 text-red-700 border-red-200',
    }
    return colors[status] || colors.SCHEDULED
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Appointment Calendar
            </CardTitle>
            <CardDescription>
              Visual overview of scheduled appointments
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center rounded-md border">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-4 font-medium">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          {/* Week day headers */}
          <div className="grid grid-cols-7 bg-muted/50">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {days.map((day, idx) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayAppointments = appointmentsByDate[dateKey] || []
              const isSelected = isSameDay(day, selectedDate)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isTodayDate = isToday(day)

              return (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.01 }}
                  className={cn(
                    'min-h-[100px] border-r border-b last:border-r-0 p-1 cursor-pointer transition-colors',
                    !isCurrentMonth && 'bg-muted/30',
                    isSelected && 'bg-primary/5 ring-2 ring-primary ring-inset',
                    isTodayDate && 'bg-primary/10',
                    'hover:bg-muted/50'
                  )}
                  onClick={() => onDateSelect(day)}
                >
                  <div className="flex flex-col h-full">
                    {/* Day number */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                          !isCurrentMonth && 'text-muted-foreground',
                          isTodayDate && 'bg-primary text-primary-foreground',
                          isSelected && !isTodayDate && 'bg-primary/20'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {dayAppointments.length > 0 && (
                        <Badge variant="secondary" className="text-xs h-5">
                          {dayAppointments.length}
                        </Badge>
                      )}
                    </div>

                    {/* Appointments preview */}
                    <div className="flex-1 space-y-1 overflow-hidden">
                      <TooltipProvider>
                        {dayAppointments.slice(0, 3).map((apt) => (
                          <Tooltip key={apt.id}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  'text-xs p-1 rounded truncate border cursor-pointer',
                                  getStatusBadgeColor(apt.status)
                                )}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onAppointmentClick?.(apt)
                                }}
                              >
                                <span className="font-medium">
                                  {apt.scheduledTime?.slice(0, 5) || 'TBD'}
                                </span>{' '}
                                {apt.patient?.firstName || 'Patient'}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {apt.patient?.firstName} {apt.patient?.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {apt.scheduledTime} ({apt.duration} min)
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Dr. {apt.doctor?.lastName}
                                </p>
                                {apt.reason && (
                                  <p className="text-sm">{apt.reason}</p>
                                )}
                                <Badge className={getStatusBadgeColor(apt.status)}>
                                  {apt.status}
                                </Badge>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {dayAppointments.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{dayAppointments.length - 3} more
                          </div>
                        )}
                      </TooltipProvider>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t flex-wrap">
          <span className="text-sm text-muted-foreground">Status:</span>
          {[
            { status: 'SCHEDULED', label: 'Scheduled' },
            { status: 'WAITING', label: 'Waiting' },
            { status: 'IN_PROGRESS', label: 'In Progress' },
            { status: 'COMPLETED', label: 'Completed' },
            { status: 'CANCELLED', label: 'Cancelled' },
          ].map(({ status, label }) => (
            <div key={status} className="flex items-center gap-1">
              <div className={cn('w-3 h-3 rounded', getStatusBadgeColor(status))} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
