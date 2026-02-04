import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  getDay,
  isBefore,
  startOfDay,
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  CalendarDays,
  List,
  LayoutGrid,
  Filter,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Hourglass,
  Play,
  UserX,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Appointment } from '@/types'

interface CalendarViewProps {
  appointments: Appointment[]
  onDateSelect: (date: Date) => void
  onAppointmentClick?: (appointment: Appointment) => void
  selectedDate?: Date
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; label: string; color: string; bgClass: string }> = {
  SCHEDULED: {
    icon: Calendar,
    label: 'Scheduled',
    color: 'blue',
    bgClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  WAITING: {
    icon: Hourglass,
    label: 'Waiting',
    color: 'amber',
    bgClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  IN_PROGRESS: {
    icon: Play,
    label: 'In Progress',
    color: 'purple',
    bgClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  },
  COMPLETED: {
    icon: CheckCircle2,
    label: 'Completed',
    color: 'emerald',
    bgClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  },
  CANCELLED: {
    icon: XCircle,
    label: 'Cancelled',
    color: 'slate',
    bgClass: 'bg-slate-100 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  },
  NO_SHOW: {
    icon: UserX,
    label: 'No Show',
    color: 'red',
    bgClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.02 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
}

export function CalendarView({
  appointments,
  onDateSelect,
  onAppointmentClick,
  selectedDate = new Date(),
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    if (filterStatus === 'all') return appointments
    return appointments.filter(apt => apt.status === filterStatus)
  }, [appointments, filterStatus])

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
    filteredAppointments.forEach((apt) => {
      const dateKey = format(new Date(apt.scheduledDate), 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(apt)
    })
    // Sort appointments by time within each day
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        const timeA = a.scheduledTime || '00:00'
        const timeB = b.scheduledTime || '00:00'
        return timeA.localeCompare(timeB)
      })
    })
    return grouped
  }, [filteredAppointments])

  // Stats for current month
  const monthStats = useMemo(() => {
    const monthAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.scheduledDate)
      return isSameMonth(aptDate, currentMonth)
    })
    return {
      total: monthAppointments.length,
      scheduled: monthAppointments.filter(a => a.status === 'SCHEDULED').length,
      completed: monthAppointments.filter(a => a.status === 'COMPLETED').length,
      cancelled: monthAppointments.filter(a => a.status === 'CANCELLED' || a.status === 'NO_SHOW').length,
    }
  }, [appointments, currentMonth])

  // Appointments for selected date
  const selectedDateAppointments = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    return appointmentsByDate[dateKey] || []
  }, [appointmentsByDate, selectedDate])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) =>
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    )
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
    onDateSelect(new Date())
  }

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.SCHEDULED
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const handleAppointmentClick = (apt: Appointment, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedAppointment(apt)
    onAppointmentClick?.(apt)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Appointment Calendar</CardTitle>
                <CardDescription>
                  Visual overview of scheduled appointments
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] shadow-sm">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      <span className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", `bg-${config.color}-500`)} />
                        {config.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex border rounded-md overflow-hidden shadow-sm">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className="rounded-none"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={goToToday} className="shadow-sm">
                Today
              </Button>
              <div className="flex items-center rounded-md border shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-4 font-semibold min-w-[140px] text-center">
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

          {/* Month Stats */}
          <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold">{monthStats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{monthStats.scheduled}</p>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{monthStats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{monthStats.cancelled}</p>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="border-0 shadow-md lg:col-span-3">
          <CardContent className="p-4">
            <div className="rounded-xl border overflow-hidden">
              {/* Week day headers */}
              <div className="grid grid-cols-7 bg-muted/50">
                {weekDays.map((day, idx) => (
                  <div
                    key={day}
                    className={cn(
                      "p-3 text-center text-sm font-semibold text-muted-foreground border-r last:border-r-0",
                      idx === 0 && "text-red-500",
                      idx === 6 && "text-red-500"
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-7"
              >
                {days.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const dayAppointments = appointmentsByDate[dateKey] || []
                  const isSelected = isSameDay(day, selectedDate)
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isTodayDate = isToday(day)
                  const isPast = isBefore(startOfDay(day), startOfDay(new Date())) && !isTodayDate
                  const dayOfWeek = getDay(day)
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                  return (
                    <motion.div
                      key={dateKey}
                      variants={itemVariants}
                      className={cn(
                        'min-h-[110px] border-r border-b last:border-r-0 p-1.5 cursor-pointer transition-all',
                        !isCurrentMonth && 'bg-muted/30',
                        isSelected && 'bg-primary/5 ring-2 ring-primary ring-inset',
                        isTodayDate && !isSelected && 'bg-indigo-50 dark:bg-indigo-950/30',
                        isPast && !isSelected && 'opacity-60',
                        isWeekend && !isSelected && !isTodayDate && 'bg-red-50/30 dark:bg-red-950/10',
                        'hover:bg-muted/50'
                      )}
                      onClick={() => onDateSelect(day)}
                    >
                      <div className="flex flex-col h-full">
                        {/* Day number */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={cn(
                              'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all',
                              !isCurrentMonth && 'text-muted-foreground',
                              isTodayDate && 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md',
                              isSelected && !isTodayDate && 'bg-primary/20 font-bold',
                              isWeekend && !isTodayDate && !isSelected && 'text-red-500'
                            )}
                          >
                            {format(day, 'd')}
                          </span>
                          {dayAppointments.length > 0 && (
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-xs h-5 px-1.5",
                                isTodayDate && "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                              )}
                            >
                              {dayAppointments.length}
                            </Badge>
                          )}
                        </div>

                        {/* Appointments preview */}
                        <div className="flex-1 space-y-1 overflow-hidden">
                          <TooltipProvider>
                            {dayAppointments.slice(0, 3).map((apt) => {
                              const statusConfig = getStatusConfig(apt.status)
                              return (
                                <Tooltip key={apt.id}>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        'text-xs p-1 rounded-md truncate border cursor-pointer transition-all hover:shadow-sm',
                                        statusConfig.bgClass
                                      )}
                                      onClick={(e) => handleAppointmentClick(apt, e)}
                                    >
                                      <span className="font-semibold">
                                        {apt.scheduledTime?.slice(0, 5) || 'TBD'}
                                      </span>{' '}
                                      <span className="opacity-80">
                                        {apt.patient?.firstName || 'Patient'}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs p-3">
                                    <div className="space-y-2">
                                      <p className="font-semibold">
                                        {apt.patient?.firstName} {apt.patient?.lastName}
                                      </p>
                                      <div className="space-y-1 text-sm">
                                        <p className="text-muted-foreground flex items-center gap-2">
                                          <Clock className="h-3.5 w-3.5" />
                                          {apt.scheduledTime} ({apt.duration} min)
                                        </p>
                                        <p className="text-muted-foreground flex items-center gap-2">
                                          <User className="h-3.5 w-3.5" />
                                          Dr. {apt.doctor?.lastName}
                                        </p>
                                        {apt.reason && (
                                          <p className="text-muted-foreground flex items-center gap-2">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            {apt.reason}
                                          </p>
                                        )}
                                      </div>
                                      <Badge className={cn("text-xs", statusConfig.bgClass)}>
                                        {statusConfig.label}
                                      </Badge>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )
                            })}
                            {dayAppointments.length > 3 && (
                              <div className="text-xs text-muted-foreground text-center font-medium">
                                +{dayAppointments.length - 3} more
                              </div>
                            )}
                          </TooltipProvider>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t flex-wrap">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              {Object.entries(STATUS_CONFIG).slice(0, 5).map(([status, config]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={cn('w-3 h-3 rounded-sm', config.bgClass.split(' ')[0])} />
                  <span className="text-xs text-muted-foreground">{config.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Sidebar */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {format(selectedDate, 'EEEE')}
                </CardTitle>
                <CardDescription>
                  {format(selectedDate, 'MMMM d, yyyy')}
                </CardDescription>
              </div>
              {isToday(selectedDate) && (
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600">Today</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedDateAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No appointments</p>
                <p className="text-xs text-muted-foreground mt-1">for this day</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-3">
                <div className="space-y-3">
                  <AnimatePresence>
                    {selectedDateAppointments.map((apt, idx) => {
                      const statusConfig = getStatusConfig(apt.status)
                      const StatusIcon = statusConfig.icon

                      return (
                        <motion.div
                          key={apt.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={cn(
                            "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                            statusConfig.bgClass.replace('text-', 'hover:border-').split(' ')[0]
                          )}
                          onClick={() => handleAppointmentClick(apt)}
                        >
                          <div className="flex items-start gap-2">
                            <div className={cn(
                              "p-1.5 rounded-md shrink-0",
                              statusConfig.bgClass
                            )}>
                              <StatusIcon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {apt.patient?.firstName} {apt.patient?.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" />
                                {apt.scheduledTime} • {apt.duration}min
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Dr. {apt.doctor?.lastName}
                              </p>
                              {apt.reason && (
                                <p className="text-xs mt-1 truncate opacity-70">{apt.reason}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Appointment Detail Sheet */}
      <Sheet open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <SheetContent className="sm:max-w-lg">
          {selectedAppointment && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  {(() => {
                    const statusConfig = getStatusConfig(selectedAppointment.status)
                    const StatusIcon = statusConfig.icon
                    return (
                      <div className={cn(
                        "p-3 rounded-xl",
                        statusConfig.bgClass
                      )}>
                        <StatusIcon className="h-6 w-6" />
                      </div>
                    )
                  })()}
                  <div>
                    <SheetTitle>
                      {selectedAppointment.patient?.firstName} {selectedAppointment.patient?.lastName}
                    </SheetTitle>
                    <SheetDescription>
                      Appointment on {format(new Date(selectedAppointment.scheduledDate), 'PPP')}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Status */}
                <Card className="border-0 shadow-sm bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status</span>
                      {(() => {
                        const statusConfig = getStatusConfig(selectedAppointment.status)
                        return (
                          <Badge className={statusConfig.bgClass}>
                            {statusConfig.label}
                          </Badge>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* Appointment Details */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Appointment Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Time</p>
                        <p className="font-medium">{selectedAppointment.scheduledTime}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-medium">{selectedAppointment.duration} minutes</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground">Doctor</p>
                        <p className="font-medium">Dr. {selectedAppointment.doctor?.firstName} {selectedAppointment.doctor?.lastName}</p>
                      </div>
                    </div>
                    {selectedAppointment.reason && (
                      <div className="flex items-start gap-2">
                        <Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Visit Reason</p>
                          <p className="font-medium">{selectedAppointment.reason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Reason */}
                {selectedAppointment.reason && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Reason for Visit</h4>
                    <div className="bg-muted/30 p-3 rounded-lg text-sm">
                      {selectedAppointment.reason}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedAppointment.notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Notes</h4>
                    <div className="bg-muted/30 p-3 rounded-lg text-sm">
                      {selectedAppointment.notes}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="grid gap-3 pt-4">
                  <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                    View Full Details
                  </Button>
                  <Button variant="outline" className="w-full">
                    Edit Appointment
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
