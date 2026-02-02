import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  Activity,
  UserPlus,
  Calendar,
  DollarSign,
  Stethoscope,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'patient' | 'appointment' | 'payment' | 'doctor'
  title: string
  description: string
  timestamp: string
  metadata?: {
    amount?: number
    status?: string
    name?: string
  }
}

interface RecentActivityProps {
  maxItems?: number
}

const activityIcons = {
  patient: UserPlus,
  appointment: Calendar,
  payment: DollarSign,
  doctor: Stethoscope,
}

const activityColors = {
  patient: 'bg-blue-100 text-blue-600',
  appointment: 'bg-purple-100 text-purple-600',
  payment: 'bg-green-100 text-green-600',
  doctor: 'bg-orange-100 text-orange-600',
}

export function RecentActivity({ maxItems = 5 }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentActivity()
  }, [])

  const loadRecentActivity = async () => {
    setLoading(true)
    try {
      // Fetch recent data from all sources
      const [patients, appointments, invoices, doctors] = await Promise.all([
        window.electronAPI.patients.getAll(),
        window.electronAPI.appointments.getAll(),
        window.electronAPI.invoices.getAll(),
        window.electronAPI.doctors.getAll(),
      ])

      const activityList: ActivityItem[] = []

      // Add recent patients
      patients.slice(0, 3).forEach((patient: any) => {
        activityList.push({
          id: `patient-${patient.id}`,
          type: 'patient',
          title: 'New Patient Registered',
          description: `${patient.firstName} ${patient.lastName}`,
          timestamp: patient.createdAt,
          metadata: { name: `${patient.firstName} ${patient.lastName}` },
        })
      })

      // Add recent appointments
      appointments.slice(0, 3).forEach((apt: any) => {
        activityList.push({
          id: `appointment-${apt.id}`,
          type: 'appointment',
          title: 'Appointment Scheduled',
          description: `${apt.patient?.firstName || 'Patient'} with Dr. ${apt.doctor?.lastName || 'Doctor'}`,
          timestamp: apt.createdAt,
          metadata: { status: apt.status },
        })
      })

      // Add recent payments/invoices
      invoices.filter((inv: any) => inv.status === 'PAID').slice(0, 3).forEach((inv: any) => {
        activityList.push({
          id: `payment-${inv.id}`,
          type: 'payment',
          title: 'Payment Received',
          description: `Invoice #${inv.invoiceNumber}`,
          timestamp: inv.paidAt || inv.createdAt,
          metadata: { amount: inv.totalAmount },
        })
      })

      // Add recent doctors
      doctors.slice(0, 2).forEach((doctor: any) => {
        activityList.push({
          id: `doctor-${doctor.id}`,
          type: 'doctor',
          title: 'Doctor Added',
          description: `Dr. ${doctor.firstName} ${doctor.lastName} - ${doctor.specialization}`,
          timestamp: doctor.createdAt,
        })
      })

      // Sort by timestamp and limit
      const sorted = activityList
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, maxItems)

      setActivities(sorted)
    } catch (error) {
      console.error('Failed to load recent activity:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates from your hospital</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {activities.map((activity, index) => {
                const Icon = activityIcons[activity.type]
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn('p-2 rounded-full', activityColors[activity.type])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                        {activity.metadata?.amount && (
                          <Badge variant="secondary" className="text-xs">
                            {formatCurrency(activity.metadata.amount)}
                          </Badge>
                        )}
                        {activity.metadata?.status && (
                          <Badge variant="outline" className="text-xs">
                            {activity.metadata.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
