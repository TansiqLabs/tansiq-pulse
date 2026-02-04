import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
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
  Activity,
  CalendarPlus,
  UserPlus,
  ClipboardList,
  AlertCircle,
  Bed,
  Pill,
  HeartPulse,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatTime, getInitials, getStatusColor, cn } from '@/lib/utils'
import type { DashboardStats, Appointment } from '@/types'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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
  gradient: string
  iconBg: string
}

function StatCard({ title, value, description, icon: Icon, trend, trendValue, gradient, iconBg }: StatCardProps) {
  return (
    <motion.div variants={item}>
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className={cn("absolute inset-0 opacity-[0.03] bg-gradient-to-br", gradient)} />
        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
          <div className={cn("w-full h-full rounded-full opacity-10 bg-gradient-to-br", gradient)} />
        </div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {title}
              </p>
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{description}</span>
                {trend && trendValue && (
                  <span className={cn(
                    "flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full",
                    trend === 'up' 
                      ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30' 
                      : 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30'
                  )}>
                    {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {trendValue}
                  </span>
                )}
              </div>
            </div>
            <div className={cn(
              "p-3 rounded-2xl bg-gradient-to-br shadow-lg group-hover:scale-110 transition-transform",
              iconBg
            )}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface QuickActionProps {
  icon: React.ElementType
  label: string
  description: string
  href: string
  gradient: string
}

function QuickActionCard({ icon: Icon, label, description, href, gradient }: QuickActionProps) {
  const navigate = useNavigate()
  
  return (
    <motion.div variants={item}>
      <Card 
        className="border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
        onClick={() => navigate(href)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-xl bg-gradient-to-br group-hover:scale-110 transition-transform shadow-lg",
              gradient
            )}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{label}</h3>
              <p className="text-xs text-muted-foreground truncate">{description}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
  const navigate = useNavigate()

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
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-7">
          <Skeleton className="h-[400px] lg:col-span-4" />
          <Skeleton className="h-[400px] lg:col-span-3" />
        </div>
      </div>
    )
  }

  const quickActions = [
    { icon: UserPlus, label: 'New Patient', description: 'Register a patient', href: '/patients?action=new', gradient: 'from-blue-500 to-blue-600' },
    { icon: CalendarPlus, label: 'New Appointment', description: 'Schedule visit', href: '/appointments?action=new', gradient: 'from-emerald-500 to-emerald-600' },
    { icon: Receipt, label: 'Create Invoice', description: 'Generate bill', href: '/billing?action=new', gradient: 'from-purple-500 to-purple-600' },
    { icon: ClipboardList, label: 'View Queue', description: 'Patient queue', href: '/queue', gradient: 'from-orange-500 to-orange-600' },
  ]

  const hospitalMetrics = [
    { label: 'Bed Occupancy', value: 72, icon: Bed, color: 'from-blue-500 to-blue-600' },
    { label: 'ER Capacity', value: 45, icon: HeartPulse, color: 'from-red-500 to-red-600' },
    { label: 'Pharmacy Stock', value: 88, icon: Pill, color: 'from-green-500 to-green-600' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome back! Here's your hospital at a glance.
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button variant="outline" className="shadow-sm">
            <Activity className="h-4 w-4 mr-2" />
            Live Status
          </Button>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
      >
        {quickActions.map((action) => (
          <QuickActionCard key={action.label} {...action} />
        ))}
      </motion.div>

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
          description="From invoices"
          icon={DollarSign}
          trend="up"
          trendValue="+12%"
          gradient="from-emerald-500 to-emerald-600"
          iconBg="from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Appointments"
          value={stats?.todayAppointments || 0}
          description="Scheduled today"
          icon={Calendar}
          gradient="from-blue-500 to-blue-600"
          iconBg="from-blue-500 to-blue-600"
        />
        <StatCard
          title="In Queue"
          value={stats?.patientsInQueue || 0}
          description="Waiting now"
          icon={Clock}
          gradient="from-orange-500 to-orange-600"
          iconBg="from-orange-500 to-orange-600"
        />
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients || 0}
          description="Registered"
          icon={Users}
          trend="up"
          trendValue="+5%"
          gradient="from-purple-500 to-purple-600"
          iconBg="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Active Doctors"
          value={stats?.activeDoctors || 0}
          description="Available"
          icon={Stethoscope}
          gradient="from-teal-500 to-teal-600"
          iconBg="from-teal-500 to-teal-600"
        />
        <StatCard
          title="Pending Bills"
          value={stats?.pendingInvoices || 0}
          description="Awaiting payment"
          icon={Receipt}
          gradient="from-red-500 to-red-600"
          iconBg="from-red-500 to-red-600"
        />
      </motion.div>

      {/* Charts and Content */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-4"
        >
          <Card className="border-0 shadow-lg h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    Revenue Overview
                  </CardTitle>
                  <CardDescription>Daily revenue for the last 30 days</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12.5%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).getDate().toString()}
                      className="text-xs"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(value) => `$${value}`}
                      className="text-xs"
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-xl border-0 bg-background/95 backdrop-blur p-3 shadow-xl">
                              <p className="text-xs text-muted-foreground">
                                {new Date(payload[0].payload.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
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
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
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
          <Card className="border-0 shadow-lg h-full flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    Today's Appointments
                  </CardTitle>
                  <CardDescription>
                    {todayAppointments.length} scheduled for today
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/appointments')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {todayAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Calendar className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="font-medium">No appointments today</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Schedule a new appointment to get started
                    </p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/appointments?action=new')}>
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      New Appointment
                    </Button>
                  </div>
                ) : (
                  todayAppointments.map((appointment, index) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 rounded-xl border-0 bg-muted/30 p-3 transition-colors hover:bg-muted/50 group cursor-pointer"
                    >
                      <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-sm font-semibold">
                          {appointment.patient
                            ? getInitials(appointment.patient.firstName, appointment.patient.lastName)
                            : '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {appointment.patient?.firstName} {appointment.patient?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Dr. {appointment.doctor?.lastName} • {formatTime(appointment.scheduledTime)}
                        </p>
                      </div>
                      <Badge className={cn("text-xs", getStatusColor(appointment.status))}>
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

      {/* Hospital Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                <Activity className="h-4 w-4 text-white" />
              </div>
              Hospital Capacity
            </CardTitle>
            <CardDescription>Current resource utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {hospitalMetrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded-lg bg-gradient-to-br", metric.color)}>
                        <metric.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-sm">{metric.label}</span>
                    </div>
                    <span className="text-2xl font-bold">{metric.value}%</span>
                  </div>
                  <Progress 
                    value={metric.value} 
                    className={cn(
                      "h-2.5",
                      metric.value > 80 ? "[&>div]:bg-red-500" : 
                      metric.value > 60 ? "[&>div]:bg-amber-500" : 
                      "[&>div]:bg-emerald-500"
                    )} 
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alerts Section */}
      {(stats?.pendingInvoices || 0) > 5 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-amber-900 dark:text-amber-100">Attention Required</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    You have {stats?.pendingInvoices} pending invoices that need attention
                  </p>
                </div>
                <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => navigate('/billing')}>
                  Review Bills
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
