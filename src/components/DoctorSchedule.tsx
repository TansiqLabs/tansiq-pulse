import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  isToday,
  isWeekend,
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Clock,
  Stethoscope,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  Users,
  CalendarDays,
  FileText,
  Phone,
  Mail,
  MapPin,
  LayoutGrid,
  List,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { cn, getInitials } from '@/lib/utils'
import type { Doctor, Appointment } from '@/types'

interface DoctorScheduleProps {
  onNewAppointment?: (doctorId: number, date: Date, time: string) => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
]

const STATUS_CONFIG: Record<string, {
  label: string
  icon: typeof CheckCircle2
  color: string
  bgColor: string
}> = {
  SCHEDULED: {
    label: 'Scheduled',
    icon: Calendar,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300',
  },
  WAITING: {
    label: 'Waiting',
    icon: Timer,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: Activity,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-100 border-gray-200 text-gray-600 dark:bg-gray-800/30 dark:border-gray-700 dark:text-gray-400',
  },
  NO_SHOW: {
    label: 'No Show',
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300',
  },
}

const SPECIALIZATION_COLORS: Record<string, string> = {
  'Cardiology': 'from-red-500 to-rose-600',
  'Neurology': 'from-purple-500 to-violet-600',
  'Pediatrics': 'from-pink-500 to-rose-600',
  'Orthopedics': 'from-orange-500 to-amber-600',
  'Dermatology': 'from-cyan-500 to-teal-600',
  'General Medicine': 'from-blue-500 to-indigo-600',
  'Surgery': 'from-emerald-500 to-green-600',
  'Psychiatry': 'from-indigo-500 to-purple-600',
  'default': 'from-slate-500 to-gray-600',
}

export function DoctorSchedule({ onNewAppointment }: DoctorScheduleProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 0 })
  )
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [doctorsData, appointmentsData] = await Promise.all([
        window.electronAPI.doctors.getAll(),
        window.electronAPI.appointments.getAll(),
      ])
      setDoctors(doctorsData.filter((d: Doctor) => d.isActive))
      setAppointments(appointmentsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
  }, [currentWeekStart])

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev =>
      direction === 'prev' ? addDays(prev, -7) : addDays(prev, 7)
    )
  }

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))
  }

  const getAppointmentsForSlot = (doctorId: number, date: Date, time: string) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduledDate)
      const statusMatch = selectedStatus === 'all' || apt.status === selectedStatus
      return (
        apt.doctorId === doctorId &&
        isSameDay(aptDate, date) &&
        apt.scheduledTime === time &&
        statusMatch
      )
    })
  }

  const filteredDoctors = selectedDoctor === 'all' 
    ? doctors 
    : doctors.filter(d => d.id.toString() === selectedDoctor)

  // Stats calculation
  const weekStats = useMemo(() => {
    const weekAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.scheduledDate)
      return weekDays.some(day => isSameDay(aptDate, day))
    })

    const byStatus = weekAppointments.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: weekAppointments.length,
      scheduled: byStatus['SCHEDULED'] || 0,
      completed: byStatus['COMPLETED'] || 0,
      inProgress: byStatus['IN_PROGRESS'] || 0,
      cancelled: byStatus['CANCELLED'] || 0,
    }
  }, [appointments, weekDays])

  // Doctor workload for the week
  const doctorWorkloads = useMemo(() => {
    return doctors.map(doctor => {
      const doctorAppts = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduledDate)
        return apt.doctorId === doctor.id && weekDays.some(day => isSameDay(aptDate, day))
      })
      
      return {
        doctor,
        total: doctorAppts.length,
        completed: doctorAppts.filter(a => a.status === 'COMPLETED').length,
        utilization: Math.round((doctorAppts.length / (timeSlots.length * 5)) * 100), // 5 working days
      }
    }).sort((a, b) => b.total - a.total)
  }, [appointments, doctors, weekDays])

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setSheetOpen(true)
  }

  const getSpecializationGradient = (spec: string) => {
    return SPECIALIZATION_COLORS[spec] || SPECIALIZATION_COLORS['default']
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-40 bg-muted animate-pulse rounded" />
                <div className="h-4 w-60 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-muted animate-pulse rounded-lg" />
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header Card */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Doctor Schedule</CardTitle>
                  <CardDescription className="mt-1">
                    Weekly appointment schedule and doctor availability
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger className="w-[180px]">
                    <Stethoscope className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Doctors</SelectItem>
                    {doctors.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        Dr. {doctor.firstName} {doctor.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weekStats.total}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weekStats.scheduled}</p>
                <p className="text-xs text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weekStats.inProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weekStats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weekStats.cancelled}</p>
                <p className="text-xs text-muted-foreground">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Schedule Grid */}
        <motion.div variants={itemVariants} className="xl:col-span-3">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              {/* Week Navigation */}
              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToToday}
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Today
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold min-w-[220px] text-center">
                    {format(currentWeekStart, 'MMMM d')} - {format(addDays(currentWeekStart, 6), 'MMMM d, yyyy')}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="w-[80px]" />
              </div>
            </CardHeader>

            <CardContent>
              <ScrollArea className="h-[600px]">
                {filteredDoctors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
                    <Users className="h-12 w-12 mb-3 opacity-40" />
                    <p className="font-medium">No doctors found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  // Grid View
                  <div className="space-y-8">
                    {filteredDoctors.map(doctor => (
                      <div key={doctor.id} className="space-y-3">
                        {/* Doctor Header */}
                        <div className="flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                          <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-offset-background ring-primary/20">
                            <AvatarFallback className={cn(
                              'text-sm font-semibold text-white bg-gradient-to-br',
                              getSpecializationGradient(doctor.specialization || '')
                            )}>
                              {getInitials(doctor.firstName, doctor.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">
                              Dr. {doctor.firstName} {doctor.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {doctorWorkloads.find(d => d.doctor.id === doctor.id)?.total || 0} appointments
                          </Badge>
                        </div>

                        {/* Schedule Grid */}
                        <div className="border rounded-xl overflow-hidden shadow-sm">
                          {/* Day Headers */}
                          <div className="grid grid-cols-8 border-b bg-muted/30">
                            <div className="p-3 text-xs font-medium text-muted-foreground border-r flex items-center justify-center">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              Time
                            </div>
                            {weekDays.map(day => (
                              <div
                                key={day.toISOString()}
                                className={cn(
                                  'p-3 text-center border-r last:border-r-0 transition-colors',
                                  isToday(day) && 'bg-primary/10',
                                  isWeekend(day) && 'bg-muted/50'
                                )}
                              >
                                <p className={cn(
                                  'text-xs font-medium',
                                  isWeekend(day) && 'text-muted-foreground'
                                )}>
                                  {format(day, 'EEE')}
                                </p>
                                <p className={cn(
                                  'text-lg font-semibold',
                                  isToday(day) && 'text-primary',
                                  isWeekend(day) && 'text-muted-foreground'
                                )}>
                                  {format(day, 'd')}
                                </p>
                                {isToday(day) && (
                                  <Badge className="mt-1 text-[10px] px-1 py-0 bg-primary/20 text-primary border-0">
                                    Today
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Time Slots */}
                          <div className="max-h-[400px] overflow-y-auto">
                            {timeSlots.map((time, idx) => (
                              <div 
                                key={time} 
                                className={cn(
                                  'grid grid-cols-8 border-b last:border-b-0',
                                  idx % 2 === 0 && 'bg-muted/10'
                                )}
                              >
                                <div className="p-2 text-xs font-medium text-muted-foreground border-r bg-muted/20 flex items-center justify-center">
                                  {time}
                                </div>
                                {weekDays.map(day => {
                                  const slotAppointments = getAppointmentsForSlot(doctor.id, day, time)
                                  const appointment = slotAppointments[0]
                                  const statusConfig = appointment ? STATUS_CONFIG[appointment.status] || STATUS_CONFIG.SCHEDULED : null

                                  return (
                                    <div
                                      key={`${day.toISOString()}-${time}`}
                                      className={cn(
                                        'p-1 border-r last:border-r-0 min-h-[44px] relative group transition-colors',
                                        isToday(day) && 'bg-primary/5',
                                        isWeekend(day) && 'bg-muted/30'
                                      )}
                                    >
                                      {appointment ? (
                                        <motion.div
                                          initial={{ opacity: 0, scale: 0.9 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          whileHover={{ scale: 1.02 }}
                                          className={cn(
                                            'text-xs p-1.5 rounded-lg border cursor-pointer h-full',
                                            statusConfig?.bgColor
                                          )}
                                          onClick={() => handleAppointmentClick(appointment)}
                                        >
                                          <div className="flex items-center gap-1">
                                            {statusConfig && <statusConfig.icon className="h-3 w-3 flex-shrink-0" />}
                                            <p className="font-medium truncate">
                                              {appointment.patient?.firstName?.[0]}. {appointment.patient?.lastName}
                                            </p>
                                          </div>
                                        </motion.div>
                                      ) : (
                                        onNewAppointment && !isWeekend(day) && (
                                          <button
                                            className="absolute inset-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-primary/10 text-primary rounded-lg border-2 border-dashed border-primary/30"
                                            onClick={() => onNewAppointment(doctor.id, day, time)}
                                          >
                                            <Plus className="h-4 w-4" />
                                          </button>
                                        )
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // List View
                  <div className="space-y-4">
                    {filteredDoctors.map(doctor => {
                      const doctorAppointments = appointments.filter(apt => {
                        const aptDate = new Date(apt.scheduledDate)
                        const statusMatch = selectedStatus === 'all' || apt.status === selectedStatus
                        return apt.doctorId === doctor.id && weekDays.some(day => isSameDay(aptDate, day)) && statusMatch
                      }).sort((a, b) => {
                        const dateA = new Date(`${a.scheduledDate} ${a.scheduledTime}`)
                        const dateB = new Date(`${b.scheduledDate} ${b.scheduledTime}`)
                        return dateA.getTime() - dateB.getTime()
                      })

                      return (
                        <Card key={doctor.id} className="border shadow-sm">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={cn(
                                  'text-sm font-semibold text-white bg-gradient-to-br',
                                  getSpecializationGradient(doctor.specialization || '')
                                )}>
                                  {getInitials(doctor.firstName, doctor.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">Dr. {doctor.firstName} {doctor.lastName}</p>
                                <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                              </div>
                              <Badge variant="secondary" className="ml-auto">
                                {doctorAppointments.length} appointments
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {doctorAppointments.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No appointments this week
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {doctorAppointments.slice(0, 5).map(apt => {
                                  const statusConfig = STATUS_CONFIG[apt.status] || STATUS_CONFIG.SCHEDULED
                                  return (
                                    <div
                                      key={apt.id}
                                      className={cn(
                                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm',
                                        statusConfig.bgColor
                                      )}
                                      onClick={() => handleAppointmentClick(apt)}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                          {apt.patient?.firstName} {apt.patient?.lastName}
                                        </p>
                                        <p className="text-xs opacity-75">
                                          {format(new Date(apt.scheduledDate), 'EEE, MMM d')} at {apt.scheduledTime}
                                        </p>
                                      </div>
                                      <Badge variant="outline" className={cn('text-xs', statusConfig.color)}>
                                        <statusConfig.icon className="h-3 w-3 mr-1" />
                                        {statusConfig.label}
                                      </Badge>
                                    </div>
                                  )
                                })}
                                {doctorAppointments.length > 5 && (
                                  <p className="text-xs text-muted-foreground text-center pt-2">
                                    +{doctorAppointments.length - 5} more appointments
                                  </p>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Legend */}
              <Separator className="my-4" />
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">Status Legend:</span>
                {Object.entries(STATUS_CONFIG).slice(0, 4).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full border', config.bgColor)} />
                    <span className="text-xs text-muted-foreground">{config.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Doctor Workload Sidebar */}
        <motion.div variants={itemVariants} className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Doctor Workload
              </CardTitle>
              <CardDescription className="text-xs">
                Weekly appointment distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {doctorWorkloads.slice(0, 6).map(({ doctor, total, completed, utilization }) => (
                <div key={doctor.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className={cn(
                          'text-xs font-semibold text-white bg-gradient-to-br',
                          getSpecializationGradient(doctor.specialization || '')
                        )}>
                          {getInitials(doctor.firstName, doctor.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[120px]">
                          Dr. {doctor.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {completed}/{total} completed
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {utilization}%
                    </Badge>
                  </div>
                  <Progress 
                    value={utilization} 
                    className="h-1.5"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20">
            <CardContent className="pt-4">
              <div className="text-center space-y-2">
                <div className="p-3 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white w-fit mx-auto shadow-lg shadow-teal-500/25">
                  <Activity className="h-6 w-6" />
                </div>
                <p className="text-3xl font-bold">
                  {Math.round((weekStats.completed / (weekStats.total || 1)) * 100)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Completion Rate
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Appointment Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedAppointment && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Appointment Details
                  </SheetTitle>
                </div>
                <SheetDescription>
                  {format(new Date(selectedAppointment.scheduledDate), 'EEEE, MMMM d, yyyy')} at {selectedAppointment.scheduledTime}
                </SheetDescription>
              </SheetHeader>

              <Tabs defaultValue="details" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="patient">Patient</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  {/* Status */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <span className="text-sm font-medium">Status</span>
                    <Badge className={cn(
                      STATUS_CONFIG[selectedAppointment.status]?.bgColor || 'bg-gray-100'
                    )}>
                      {STATUS_CONFIG[selectedAppointment.status]?.label || selectedAppointment.status}
                    </Badge>
                  </div>

                  {/* Doctor Info */}
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-primary" />
                        Assigned Doctor
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedAppointment.doctor && (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={cn(
                              'text-sm font-semibold text-white bg-gradient-to-br',
                              getSpecializationGradient(selectedAppointment.doctor.specialization || '')
                            )}>
                              {getInitials(selectedAppointment.doctor.firstName, selectedAppointment.doctor.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              Dr. {selectedAppointment.doctor.firstName} {selectedAppointment.doctor.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {selectedAppointment.doctor.specialization}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Appointment Notes */}
                  {selectedAppointment.notes && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Notes
                      </div>
                      <p className="text-sm text-muted-foreground pl-6 p-3 bg-muted/50 rounded-lg">
                        {selectedAppointment.notes}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="patient" className="space-y-4 mt-4">
                  {selectedAppointment.patient && (
                    <>
                      {/* Patient Card */}
                      <Card className="border shadow-sm">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                {getInitials(selectedAppointment.patient.firstName, selectedAppointment.patient.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-lg">
                                {selectedAppointment.patient.firstName} {selectedAppointment.patient.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                MRN: {selectedAppointment.patient.mrn}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Contact Info */}
                      <div className="space-y-3">
                        {selectedAppointment.patient.phone && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedAppointment.patient.phone}</span>
                          </div>
                        )}
                        {selectedAppointment.patient.email && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedAppointment.patient.email}</span>
                          </div>
                        )}
                        {selectedAppointment.patient.address && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedAppointment.patient.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Patient Details */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <p className="text-xs text-muted-foreground">Gender</p>
                          <p className="font-medium">{selectedAppointment.patient.gender || 'N/A'}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <p className="text-xs text-muted-foreground">Blood Type</p>
                          <p className="font-medium">{selectedAppointment.patient.bloodType || 'N/A'}</p>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex gap-2 mt-6 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>
                  Close
                </Button>
                {selectedAppointment.status === 'SCHEDULED' && (
                  <Button className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Check In
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  )
}
