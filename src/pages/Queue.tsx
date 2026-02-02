import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  Users,
  Clock,
  Play,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  User,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Patient, Doctor } from '@/types'

interface QueueItem {
  id: number
  appointmentNo: string
  patient: Patient
  doctor: Doctor
  scheduledTime: string
  status: string
  arrivedAt: string | null
  startedAt: string | null
  waitTime: number | null // in minutes
}

export function Queue() {
  const [appointments, setAppointments] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const fetchTodayQueue = useCallback(async () => {
    try {
      const data = await window.electronAPI.appointments.getAll()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Filter today's appointments and sort by status/time
      const todayAppointments = data
        .filter((apt: any) => {
          const aptDate = new Date(apt.scheduledDate)
          aptDate.setHours(0, 0, 0, 0)
          return aptDate.getTime() === today.getTime()
        })
        .map((apt: any) => {
          let waitTime = null
          if (apt.arrivedAt && !apt.startedAt) {
            waitTime = Math.floor(
              (new Date().getTime() - new Date(apt.arrivedAt).getTime()) / 60000
            )
          }
          return {
            id: apt.id,
            appointmentNo: apt.appointmentNo,
            patient: apt.patient,
            doctor: apt.doctor,
            scheduledTime: apt.scheduledTime,
            status: apt.status,
            arrivedAt: apt.arrivedAt,
            startedAt: apt.startedAt,
            waitTime,
          }
        })
        .sort((a: QueueItem, b: QueueItem) => {
          // Sort order: WAITING > IN_PROGRESS > SCHEDULED > COMPLETED > CANCELLED
          const statusOrder: Record<string, number> = {
            WAITING: 1,
            IN_PROGRESS: 2,
            SCHEDULED: 3,
            COMPLETED: 4,
            CANCELLED: 5,
          }
          const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99)
          if (statusDiff !== 0) return statusDiff
          // Within same status, sort by scheduled time
          return a.scheduledTime.localeCompare(b.scheduledTime)
        })

      setAppointments(todayAppointments)
    } catch (error) {
      console.error('Failed to fetch queue:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchTodayQueue()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTodayQueue, 30000)
    return () => clearInterval(interval)
  }, [fetchTodayQueue])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchTodayQueue()
  }

  const handleStatusChange = async (appointmentId: number, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus }

      if (newStatus === 'WAITING') {
        updateData.arrivedAt = new Date()
      } else if (newStatus === 'IN_PROGRESS') {
        updateData.startedAt = new Date()
      } else if (newStatus === 'COMPLETED') {
        updateData.completedAt = new Date()
      }

      await window.electronAPI.appointments.update(appointmentId, updateData)
      fetchTodayQueue()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const getPatientName = (patient: Patient) => `${patient.firstName} ${patient.lastName}`
  const getDoctorName = (doctor: Doctor) => `${doctor.firstName} ${doctor.lastName}`

  const waitingCount = appointments.filter((a) => a.status === 'WAITING').length
  const inProgressCount = appointments.filter((a) => a.status === 'IN_PROGRESS').length
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Queue Management</h1>
          <p className="text-muted-foreground">
            {format(currentTime, 'EEEE, MMMM d, yyyy')} • {format(currentTime, 'h:mm a')}
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{appointments.length}</div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Waiting</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">{waitingCount}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">In Progress</CardTitle>
            <Play className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{inProgressCount}</div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{completedCount}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Queue Display */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Waiting Queue */}
        <Card>
          <CardHeader className="bg-amber-50 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-800">Waiting Room</CardTitle>
            </div>
            <CardDescription>{waitingCount} patients waiting</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {appointments
                  .filter((a) => a.status === 'WAITING')
                  .map((apt, index) => (
                    <motion.div
                      key={apt.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="mb-3 last:mb-0"
                    >
                      <div className="p-4 rounded-lg border bg-white shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold">{getPatientName(apt.patient)}</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {apt.appointmentNo}
                              </p>
                            </div>
                          </div>
                          {apt.waitTime !== null && apt.waitTime > 15 && (
                            <Badge variant="destructive" className="text-xs">
                              {apt.waitTime}m wait
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {apt.scheduledTime}
                          </div>
                          <div className="flex items-center gap-1">
                            <Stethoscope className="h-3 w-3" />
                            Dr. {apt.doctor.lastName}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleStatusChange(apt.id, 'IN_PROGRESS')}
                        >
                          <Play className="mr-2 h-3 w-3" />
                          Start Consultation
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                {waitingCount === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No patients waiting</p>
                  </div>
                )}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardHeader className="bg-blue-50 border-b border-blue-200">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-800">In Consultation</CardTitle>
            </div>
            <CardDescription>{inProgressCount} patients with doctors</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {appointments
                  .filter((a) => a.status === 'IN_PROGRESS')
                  .map((apt) => (
                    <motion.div
                      key={apt.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="mb-3 last:mb-0"
                    >
                      <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50/50">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar>
                            <AvatarFallback className="bg-blue-200 text-blue-700">
                              {apt.patient.firstName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{getPatientName(apt.patient)}</p>
                            <p className="text-xs text-muted-foreground">
                              with Dr. {getDoctorName(apt.doctor)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-blue-600 mb-3">
                          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                          In progress since{' '}
                          {apt.startedAt
                            ? format(new Date(apt.startedAt), 'h:mm a')
                            : 'now'}
                        </div>

                        <Button
                          size="sm"
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                        >
                          <CheckCircle className="mr-2 h-3 w-3" />
                          Complete
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                {inProgressCount === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No active consultations</p>
                  </div>
                )}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>

        {/* Scheduled / Upcoming */}
        <Card>
          <CardHeader className="bg-slate-50 border-b">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-slate-600" />
              <CardTitle className="text-slate-800">Scheduled</CardTitle>
            </div>
            <CardDescription>Upcoming appointments</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {appointments
                  .filter((a) => a.status === 'SCHEDULED')
                  .map((apt) => (
                    <motion.div
                      key={apt.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      className="p-3 rounded-lg border bg-white"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{getPatientName(apt.patient)}</span>
                        </div>
                        <span className="text-sm font-mono text-muted-foreground">
                          {apt.scheduledTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Dr. {apt.doctor.lastName}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(apt.id, 'WAITING')}
                        >
                          Check In
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                {appointments.filter((a) => a.status === 'SCHEDULED').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No scheduled appointments</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completed Today */}
      {completedCount > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <CardTitle>Completed Today</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-4">
                {appointments
                  .filter((a) => a.status === 'COMPLETED')
                  .map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100"
                    >
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{getPatientName(apt.patient)}</p>
                        <p className="text-xs text-muted-foreground">
                          {apt.scheduledTime} • Dr. {apt.doctor.lastName}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
