import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  isToday,
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, getInitials } from '@/lib/utils'
import type { Doctor, Appointment } from '@/types'

interface DoctorScheduleProps {
  onNewAppointment?: (doctorId: number, date: Date, time: string) => void
}

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
]

export function DoctorSchedule({ onNewAppointment }: DoctorScheduleProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all')
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 0 })
  )
  const [loading, setLoading] = useState(true)

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
      return (
        apt.doctorId === doctorId &&
        isSameDay(aptDate, date) &&
        apt.scheduledTime === time
      )
    })
  }

  const filteredDoctors = selectedDoctor === 'all' 
    ? doctors 
    : doctors.filter(d => d.id.toString() === selectedDoctor)

  const getSlotColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 border-blue-300 text-blue-700'
      case 'WAITING':
        return 'bg-yellow-100 border-yellow-300 text-yellow-700'
      case 'IN_PROGRESS':
        return 'bg-purple-100 border-purple-300 text-purple-700'
      case 'COMPLETED':
        return 'bg-green-100 border-green-300 text-green-700'
      case 'CANCELLED':
        return 'bg-gray-100 border-gray-300 text-gray-500'
      default:
        return 'bg-gray-50'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Doctor Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Doctor Schedule
            </CardTitle>
            <CardDescription>
              Weekly appointment schedule for doctors
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger className="w-[180px]">
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
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[200px] text-center">
              {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-[60px]" /> {/* Spacer for alignment */}
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          {filteredDoctors.map(doctor => (
            <div key={doctor.id} className="mb-6 last:mb-0">
              {/* Doctor Header */}
              <div className="flex items-center gap-3 mb-3 sticky left-0 bg-background">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(doctor.firstName, doctor.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    Dr. {doctor.firstName} {doctor.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                </div>
              </div>

              {/* Schedule Grid */}
              <div className="border rounded-lg overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-8 border-b bg-muted/50">
                  <div className="p-2 text-xs font-medium text-muted-foreground border-r">
                    Time
                  </div>
                  {weekDays.map(day => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'p-2 text-center border-r last:border-r-0',
                        isToday(day) && 'bg-primary/10'
                      )}
                    >
                      <p className="text-xs font-medium">{format(day, 'EEE')}</p>
                      <p className={cn(
                        'text-sm',
                        isToday(day) && 'font-bold text-primary'
                      )}>
                        {format(day, 'd')}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                <div className="max-h-[400px] overflow-y-auto">
                  {timeSlots.map(time => (
                    <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
                      <div className="p-2 text-xs text-muted-foreground border-r bg-muted/30 flex items-center">
                        {time}
                      </div>
                      {weekDays.map(day => {
                        const slotAppointments = getAppointmentsForSlot(doctor.id, day, time)
                        const appointment = slotAppointments[0]

                        return (
                          <div
                            key={`${day.toISOString()}-${time}`}
                            className={cn(
                              'p-1 border-r last:border-r-0 min-h-[40px] relative group',
                              isToday(day) && 'bg-primary/5'
                            )}
                          >
                            {appointment ? (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={cn(
                                  'text-xs p-1 rounded border cursor-pointer truncate',
                                  getSlotColor(appointment.status)
                                )}
                                title={`${appointment.patient?.firstName} ${appointment.patient?.lastName} - ${appointment.status}`}
                              >
                                <p className="font-medium truncate">
                                  {appointment.patient?.firstName?.[0]}. {appointment.patient?.lastName}
                                </p>
                              </motion.div>
                            ) : (
                              onNewAppointment && (
                                <button
                                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 text-primary"
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

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t flex-wrap">
          <span className="text-sm text-muted-foreground">Status:</span>
          {[
            { status: 'SCHEDULED', label: 'Scheduled' },
            { status: 'WAITING', label: 'Waiting' },
            { status: 'IN_PROGRESS', label: 'In Progress' },
            { status: 'COMPLETED', label: 'Completed' },
          ].map(({ status, label }) => (
            <div key={status} className="flex items-center gap-1">
              <div className={cn('w-3 h-3 rounded border', getSlotColor(status))} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
