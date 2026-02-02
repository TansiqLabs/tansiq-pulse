import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign,
  Calendar,
  Users,
  Stethoscope,
  Clock,
  Receipt,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatTime, getInitials, getStatusColor } from '@/lib/utils'
import type { DashboardStats, Appointment } from '@/types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  trend?: 'up' | 'down'
  trendValue?: string
}

function StatCard({ title, value, description, icon: Icon, trend, trendValue }: StatCardProps) {
  return (
    <motion.div variants={item}>
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">{description}</p>
            {trend && trendValue && (
              <span className={`flex items-center text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {trendValue}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number }[]>([])
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, chartData, appointments] = await Promise.all([
          window.electronAPI.dashboard.getStats(),
          window.electronAPI.dashboard.getRevenueChart(),
          window.electronAPI.appointments.getToday(),
        ])
        setStats(statsData)
        setRevenueData(chartData)
        setTodayAppointments(appointments)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          Dashboard
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground"
        >
          Welcome back! Here's your hospital at a glance.
        </motion.p>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats?.todayRevenue || 0)}
          description="From paid invoices"
          icon={DollarSign}
          trend="up"
          trendValue="+12%"
        />
        <StatCard
          title="Appointments"
          value={stats?.todayAppointments || 0}
          description="Scheduled today"
          icon={Calendar}
        />
        <StatCard
          title="In Queue"
          value={stats?.patientsInQueue || 0}
          description="Waiting patients"
          icon={Clock}
        />
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients || 0}
          description="Registered patients"
          icon={Users}
        />
        <StatCard
          title="Active Doctors"
          value={stats?.activeDoctors || 0}
          description="Available today"
          icon={Stethoscope}
        />
        <StatCard
          title="Pending Bills"
          value={stats?.pendingInvoices || 0}
          description="Awaiting payment"
          icon={Receipt}
        />
      </motion.div>

      {/* Charts and Tables */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-4"
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Revenue Overview
                  </CardTitle>
                  <CardDescription>Daily revenue for the last 30 days</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).getDate().toString()}
                      className="text-xs"
                    />
                    <YAxis
                      tickFormatter={(value) => `$${value}`}
                      className="text-xs"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-3 shadow-lg">
                              <p className="text-sm font-medium">
                                {new Date(payload[0].payload.date).toLocaleDateString()}
                              </p>
                              <p className="text-lg font-bold text-primary">
                                {formatCurrency(payload[0].value as number)}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Today's Appointments
              </CardTitle>
              <CardDescription>
                {todayAppointments.length} appointments scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {todayAppointments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No appointments scheduled for today
                  </p>
                ) : (
                  todayAppointments.map((appointment) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {appointment.patient
                            ? getInitials(appointment.patient.firstName, appointment.patient.lastName)
                            : '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {appointment.patient?.firstName} {appointment.patient?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          Dr. {appointment.doctor?.lastName} • {formatTime(appointment.scheduledTime)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status.replace('_', ' ')}
                      </Badge>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
