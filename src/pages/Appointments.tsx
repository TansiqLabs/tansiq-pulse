import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  CheckCircle,
  XCircle,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn, formatTime, getInitials, getStatusColor } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import type { Appointment, Patient, Doctor, AppointmentStatus } from '@/types'

const appointmentSchema = z.object({
  patientId: z.number().min(1, 'Patient is required'),
  doctorId: z.number().min(1, 'Doctor is required'),
  scheduledDate: z.date(),
  scheduledTime: z.string().min(1, 'Time is required'),
  duration: z.number().min(5).max(120),
  reason: z.string().optional(),
  symptoms: z.string().optional(),
})

type AppointmentForm = z.infer<typeof appointmentSchema>

const STATUS_ACTIONS: Record<AppointmentStatus, { next: AppointmentStatus | null; label: string; icon: any }[]> = {
  SCHEDULED: [
    { next: 'WAITING', label: 'Check In', icon: User },
    { next: 'CANCELLED', label: 'Cancel', icon: XCircle },
  ],
  WAITING: [
    { next: 'IN_PROGRESS', label: 'Start', icon: Play },
    { next: 'CANCELLED', label: 'Cancel', icon: XCircle },
  ],
  IN_PROGRESS: [
    { next: 'COMPLETED', label: 'Complete', icon: CheckCircle },
  ],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
}

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      duration: 15,
      scheduledDate: new Date(),
    },
  })

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    setLoading(true)
    try {
      const [appointmentsData, patientsData, doctorsData] = await Promise.all([
        window.electronAPI.appointments.getByDate(selectedDate.toISOString()),
        window.electronAPI.patients.getAll(),
        window.electronAPI.doctors.getAll(),
      ])
      setAppointments(appointmentsData)
      setPatients(patientsData)
      setDoctors(doctorsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const openCreateDialog = () => {
    reset({
      patientId: 0,
      doctorId: 0,
      scheduledDate: selectedDate,
      scheduledTime: '',
      duration: 15,
      reason: '',
      symptoms: '',
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: AppointmentForm) => {
    setSaving(true)
    try {
      await window.electronAPI.appointments.create({
        ...data,
        scheduledDate: data.scheduledDate,
      })
      setIsDialogOpen(false)
      toast.success('Appointment Created', 'New appointment has been scheduled.')
      loadData()
    } catch (error) {
      console.error('Failed to create appointment:', error)
      toast.error('Error', 'Failed to create appointment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (appointment: Appointment, newStatus: AppointmentStatus) => {
    try {
      await window.electronAPI.appointments.updateStatus(appointment.id, newStatus)
      const statusLabels: Record<AppointmentStatus, string> = {
        SCHEDULED: 'Scheduled',
        WAITING: 'Checked In',
        IN_PROGRESS: 'In Progress',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled',
        NO_SHOW: 'No Show',
      }
      toast.success('Status Updated', `Appointment marked as ${statusLabels[newStatus]}.`)
      loadData()
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Error', 'Failed to update appointment status.')
    }
  }

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  // Group appointments by status
  const groupedAppointments = {
    waiting: appointments.filter((a) => a.status === 'WAITING'),
    inProgress: appointments.filter((a) => a.status === 'IN_PROGRESS'),
    scheduled: appointments.filter((a) => a.status === 'SCHEDULED'),
    completed: appointments.filter((a) => a.status === 'COMPLETED'),
    cancelled: appointments.filter((a) => ['CANCELLED', 'NO_SHOW'].includes(a.status)),
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold tracking-tight"
          >
            Appointments
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground"
          >
            Manage patient appointments and schedules
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </motion.div>
      </div>

      {/* Date Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={() => handleDateChange(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="min-w-[240px]">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {!isToday && (
                  <Button variant="ghost" onClick={() => setSelectedDate(new Date())}>
                    Today
                  </Button>
                )}
              </div>
              <Button variant="outline" size="icon" onClick={() => handleDateChange(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Appointments Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No appointments</h3>
            <p className="text-muted-foreground">
              No appointments scheduled for this date
            </p>
            <Button onClick={openCreateDialog} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Schedule Appointment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Queue (Waiting + In Progress) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Queue
                </CardTitle>
                <CardDescription>
                  {groupedAppointments.waiting.length + groupedAppointments.inProgress.length} patients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <AnimatePresence>
                  {[...groupedAppointments.inProgress, ...groupedAppointments.waiting].map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </AnimatePresence>
                {groupedAppointments.waiting.length + groupedAppointments.inProgress.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No patients in queue
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Scheduled */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarIcon className="h-5 w-5 text-blue-500" />
                  Scheduled
                </CardTitle>
                <CardDescription>
                  {groupedAppointments.scheduled.length} upcoming
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <AnimatePresence>
                  {groupedAppointments.scheduled.map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </AnimatePresence>
                {groupedAppointments.scheduled.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No upcoming appointments
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Completed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Completed
                </CardTitle>
                <CardDescription>
                  {groupedAppointments.completed.length} finished
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                  {groupedAppointments.completed.map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onStatusChange={handleStatusChange}
                      compact
                    />
                  ))}
                </AnimatePresence>
                {groupedAppointments.completed.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No completed appointments
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Appointment</DialogTitle>
            <DialogDescription>
              Schedule a new appointment for {format(selectedDate, 'MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select onValueChange={(value) => setValue('patientId', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.firstName} {patient.lastName} ({patient.mrn})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.patientId && (
                <p className="text-sm text-destructive">{errors.patientId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Doctor *</Label>
              <Select onValueChange={(value) => setValue('doctorId', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                      Dr. {doctor.firstName} {doctor.lastName} ({doctor.specialization})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.doctorId && (
                <p className="text-sm text-destructive">{errors.doctorId.message}</p>
              )}
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Time *</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  {...register('scheduledTime')}
                />
                {errors.scheduledTime && (
                  <p className="text-sm text-destructive">{errors.scheduledTime.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Select
                  defaultValue="15"
                  onValueChange={(value) => setValue('duration', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit</Label>
              <Input id="reason" {...register('reason')} placeholder="e.g., Annual checkup" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symptoms">Symptoms</Label>
              <Textarea id="symptoms" {...register('symptoms')} placeholder="Describe any symptoms..." />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Scheduling...' : 'Schedule Appointment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface AppointmentCardProps {
  appointment: Appointment
  onStatusChange: (appointment: Appointment, status: AppointmentStatus) => void
  compact?: boolean
}

function AppointmentCard({ appointment, onStatusChange, compact }: AppointmentCardProps) {
  const actions = STATUS_ACTIONS[appointment.status] || []

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'rounded-lg border p-3 transition-all hover:shadow-md',
        appointment.status === 'IN_PROGRESS' && 'border-purple-200 bg-purple-50',
        appointment.status === 'WAITING' && 'border-yellow-200 bg-yellow-50'
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {appointment.patient
              ? getInitials(appointment.patient.firstName, appointment.patient.lastName)
              : '??'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium truncate">
              {appointment.patient?.firstName} {appointment.patient?.lastName}
            </p>
            <Badge className={cn('shrink-0', getStatusColor(appointment.status))}>
              {appointment.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatTime(appointment.scheduledTime)} • Dr. {appointment.doctor?.lastName}
          </p>
          {!compact && appointment.reason && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {appointment.reason}
            </p>
          )}
        </div>
      </div>
      {!compact && actions.length > 0 && (
        <div className="flex gap-2 mt-3">
          {actions.map((action) => (
            <Button
              key={action.next}
              size="sm"
              variant={action.next === 'CANCELLED' ? 'outline' : 'default'}
              className="flex-1"
              onClick={() => action.next && onStatusChange(appointment, action.next)}
            >
              <action.icon className="mr-1 h-3 w-3" />
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
