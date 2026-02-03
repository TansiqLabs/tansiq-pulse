import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  DollarSign,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn, formatCurrency } from '@/lib/utils'
import type { Appointment, Invoice } from '@/types'

interface DayData {
  date: Date
  appointments: Appointment[]
  revenue: number
  completedCount: number
  cancelledCount: number
}

export function AnalyticsCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [aptData, invData] = await Promise.all([
        window.electronAPI.appointments.getAll(),
        window.electronAPI.invoices.getAll(),
      ])
      setAppointments(aptData)
      setInvoices(invData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return days.map((date): DayData => {
      const dayAppointments = appointments.filter(apt => 
        isSameDay(new Date(apt.scheduledDate), date)
      )
      
      const dayInvoices = invoices.filter(inv => 
        isSameDay(new Date(inv.createdAt), date)
      )

      return {
        date,
        appointments: dayAppointments,
        revenue: dayInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
        completedCount: dayAppointments.filter(apt => apt.status === 'COMPLETED').length,
        cancelledCount: dayAppointments.filter(apt => apt.status === 'CANCELLED' || apt.status === 'NO_SHOW').length,
      }
    })
  }, [currentMonth, appointments, invoices])

  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)

    const monthAppointments = appointments.filter(apt => {
      const date = new Date(apt.scheduledDate)
      return date >= monthStart && date <= monthEnd
    })

    const monthInvoices = invoices.filter(inv => {
      const date = new Date(inv.createdAt)
      return date >= monthStart && date <= monthEnd
    })

    return {
      totalAppointments: monthAppointments.length,
      completedAppointments: monthAppointments.filter(apt => apt.status === 'COMPLETED').length,
      cancelledAppointments: monthAppointments.filter(apt => apt.status === 'CANCELLED' || apt.status === 'NO_SHOW').length,
      totalRevenue: monthInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
      uniquePatients: new Set(monthAppointments.map(apt => apt.patientId)).size,
    }
  }, [currentMonth, appointments, invoices])

  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null
    return calendarDays.find(d => isSameDay(d.date, selectedDay))
  }, [selectedDay, calendarDays])

  const getIntensityClass = (count: number) => {
    if (count === 0) return ''
    if (count <= 2) return 'bg-emerald-100 dark:bg-emerald-900/30'
    if (count <= 5) return 'bg-emerald-200 dark:bg-emerald-800/40'
    if (count <= 8) return 'bg-emerald-300 dark:bg-emerald-700/50'
    return 'bg-emerald-400 dark:bg-emerald-600/60'
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Month Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Appointments</span>
            </div>
            <p className="text-2xl font-bold mt-1">{monthStats.totalAppointments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{monthStats.completedAppointments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Cancelled</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{monthStats.cancelledAppointments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-600" />
              <span className="text-sm text-muted-foreground">Patients</span>
            </div>
            <p className="text-2xl font-bold mt-1">{monthStats.uniquePatients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">Revenue</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatCurrency(monthStats.totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Activity Calendar</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-semibold min-w-[140px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dayData, idx) => {
                const isCurrentMonth = isSameMonth(dayData.date, currentMonth)
                const isSelected = selectedDay && isSameDay(dayData.date, selectedDay)
                const hasAppointments = dayData.appointments.length > 0

                return (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedDay(dayData.date)}
                        className={cn(
                          'relative aspect-square p-1 rounded-lg transition-all',
                          !isCurrentMonth && 'opacity-30',
                          isToday(dayData.date) && 'ring-2 ring-primary',
                          isSelected && 'ring-2 ring-primary bg-primary/10',
                          getIntensityClass(dayData.appointments.length),
                          'hover:ring-2 hover:ring-primary/50'
                        )}
                      >
                        <span className={cn(
                          'text-sm font-medium',
                          isToday(dayData.date) && 'text-primary font-bold'
                        )}>
                          {format(dayData.date, 'd')}
                        </span>
                        {hasAppointments && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {dayData.completedCount > 0 && (
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            )}
                            {dayData.appointments.length - dayData.completedCount - dayData.cancelledCount > 0 && (
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            )}
                            {dayData.cancelledCount > 0 && (
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            )}
                          </div>
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-medium">{format(dayData.date, 'MMM d, yyyy')}</p>
                        {dayData.appointments.length > 0 ? (
                          <>
                            <p>{dayData.appointments.length} appointments</p>
                            {dayData.revenue > 0 && (
                              <p className="text-emerald-500">{formatCurrency(dayData.revenue)} revenue</p>
                            )}
                          </>
                        ) : (
                          <p className="text-muted-foreground">No appointments</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Scheduled</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Cancelled</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDay ? format(selectedDay, 'EEEE, MMM d') : 'Select a Day'}
            </CardTitle>
            <CardDescription>
              {selectedDayData
                ? `${selectedDayData.appointments.length} appointments`
                : 'Click on a day to see details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDayData ? (
              <div className="space-y-4">
                {/* Day Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{selectedDayData.appointments.length}</p>
                    <p className="text-xs text-muted-foreground">Appointments</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(selectedDayData.revenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>

                {/* Appointments List */}
                {selectedDayData.appointments.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {selectedDayData.appointments
                      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
                      .map((apt) => (
                        <div
                          key={apt.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-sm">
                              <span className="font-mono font-medium">{apt.scheduledTime}</span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {apt.patient?.firstName} {apt.patient?.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              apt.status === 'COMPLETED' ? 'default' :
                              apt.status === 'CANCELLED' || apt.status === 'NO_SHOW' ? 'destructive' :
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {apt.status}
                          </Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No appointments on this day</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select a day to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
