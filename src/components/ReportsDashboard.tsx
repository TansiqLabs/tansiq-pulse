import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Stethoscope,
  Activity,
  Download,
  RefreshCw,
  PieChart,
  FileText,
  ArrowUpRight,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Zap,
  Award,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
import { formatCurrency, cn } from '@/lib/utils'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'

interface ReportData {
  revenue: {
    total: number
    change: number
    byMonth: { month: string; amount: number; target: number }[]
  }
  patients: {
    total: number
    newThisPeriod: number
    returning: number
    change: number
  }
  appointments: {
    total: number
    completed: number
    cancelled: number
    noShow: number
    averageWaitTime: number
  }
  topServices: { name: string; count: number; revenue: number; trend: number }[]
  topDoctors: { name: string; appointments: number; revenue: number; rating: number; specialty: string }[]
  insuranceClaims: {
    submitted: number
    approved: number
    denied: number
    pending: number
    totalClaimed: number
    totalApproved: number
  }
  departmentPerformance: { department: string; patients: number; revenue: number; satisfaction: number }[]
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

export function ReportsDashboard() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [period, setPeriod] = useState<string>('this_month')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const loadReportData = useCallback(async () => {
    setLoading(true)

    // Simulated data loading
    await new Promise(resolve => setTimeout(resolve, 500))

    // Multiplier based on period for mock data generation
    let multiplier: number

    switch (period) {
      case 'today':
        multiplier = 0.1
        break
      case 'this_week':
        multiplier = 0.3
        break
      case 'this_month':
        multiplier = 1
        break
      case 'last_month':
        multiplier = 1
        break
      case 'this_year':
        multiplier = 12
        break
      default:
        multiplier = 1
    }

    const data: ReportData = {
      revenue: {
        total: Math.floor(45000 * multiplier + Math.random() * 10000),
        change: Math.floor(Math.random() * 30) - 10,
        byMonth: [
          { month: 'Jan', amount: 38000, target: 40000 },
          { month: 'Feb', amount: 42000, target: 40000 },
          { month: 'Mar', amount: 45000, target: 42000 },
          { month: 'Apr', amount: 41000, target: 43000 },
          { month: 'May', amount: 48000, target: 45000 },
          { month: 'Jun', amount: 52000, target: 48000 },
        ].slice(0, period === 'this_year' ? 6 : 4),
      },
      patients: {
        total: Math.floor(1250 * multiplier),
        newThisPeriod: Math.floor(85 * multiplier),
        returning: Math.floor(1165 * multiplier),
        change: Math.floor(Math.random() * 20) - 5,
      },
      appointments: {
        total: Math.floor(320 * multiplier),
        completed: Math.floor(280 * multiplier),
        cancelled: Math.floor(25 * multiplier),
        noShow: Math.floor(15 * multiplier),
        averageWaitTime: 12,
      },
      topServices: [
        { name: 'General Consultation', count: Math.floor(120 * multiplier), revenue: Math.floor(12000 * multiplier), trend: 15 },
        { name: 'Lab Tests', count: Math.floor(95 * multiplier), revenue: Math.floor(9500 * multiplier), trend: 8 },
        { name: 'X-Ray/Imaging', count: Math.floor(45 * multiplier), revenue: Math.floor(8100 * multiplier), trend: -3 },
        { name: 'Vaccination', count: Math.floor(60 * multiplier), revenue: Math.floor(3000 * multiplier), trend: 22 },
        { name: 'Physical Therapy', count: Math.floor(30 * multiplier), revenue: Math.floor(4500 * multiplier), trend: 5 },
      ],
      topDoctors: [
        { name: 'Dr. Sarah Johnson', appointments: Math.floor(85 * multiplier), revenue: Math.floor(12750 * multiplier), rating: 4.9, specialty: 'Cardiology' },
        { name: 'Dr. Michael Chen', appointments: Math.floor(72 * multiplier), revenue: Math.floor(10800 * multiplier), rating: 4.8, specialty: 'General Practice' },
        { name: 'Dr. Emily Davis', appointments: Math.floor(68 * multiplier), revenue: Math.floor(10200 * multiplier), rating: 4.7, specialty: 'Pediatrics' },
        { name: 'Dr. Robert Wilson', appointments: Math.floor(55 * multiplier), revenue: Math.floor(8250 * multiplier), rating: 4.6, specialty: 'Orthopedics' },
      ],
      insuranceClaims: {
        submitted: Math.floor(150 * multiplier),
        approved: Math.floor(120 * multiplier),
        denied: Math.floor(15 * multiplier),
        pending: Math.floor(15 * multiplier),
        totalClaimed: Math.floor(75000 * multiplier),
        totalApproved: Math.floor(65000 * multiplier),
      },
      departmentPerformance: [
        { department: 'Emergency', patients: Math.floor(450 * multiplier), revenue: Math.floor(18000 * multiplier), satisfaction: 4.2 },
        { department: 'Outpatient', patients: Math.floor(820 * multiplier), revenue: Math.floor(24000 * multiplier), satisfaction: 4.5 },
        { department: 'Surgery', patients: Math.floor(120 * multiplier), revenue: Math.floor(35000 * multiplier), satisfaction: 4.7 },
        { department: 'Radiology', patients: Math.floor(380 * multiplier), revenue: Math.floor(12000 * multiplier), satisfaction: 4.3 },
      ],
    }

    setReportData(data)
    setLoading(false)
  }, [period])

  useEffect(() => {
    loadReportData()
  }, [loadReportData])

  const exportReport = () => {
    if (!reportData) return

    const csvContent = `
Report Period: ${period}
Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}

REVENUE
Total Revenue: ${formatCurrency(reportData.revenue.total)}
Change: ${reportData.revenue.change}%

PATIENTS
Total Patients: ${reportData.patients.total}
New Patients: ${reportData.patients.newThisPeriod}

APPOINTMENTS
Total: ${reportData.appointments.total}
Completed: ${reportData.appointments.completed}
Cancelled: ${reportData.appointments.cancelled}
No Show: ${reportData.appointments.noShow}

TOP SERVICES
${reportData.topServices.map(s => `${s.name}: ${s.count} (${formatCurrency(s.revenue)})`).join('\n')}

TOP DOCTORS
${reportData.topDoctors.map(d => `${d.name}: ${d.appointments} appointments (${formatCurrency(d.revenue)})`).join('\n')}

INSURANCE CLAIMS
Submitted: ${reportData.insuranceClaims.submitted}
Approved: ${reportData.insuranceClaims.approved}
Total Claimed: ${formatCurrency(reportData.insuranceClaims.totalClaimed)}
Total Approved: ${formatCurrency(reportData.insuranceClaims.totalApproved)}
    `.trim()

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report_${period}_${format(new Date(), 'yyyy-MM-dd')}.txt`
    a.click()
  }

  const getAppointmentChartData = () => {
    if (!reportData) return []
    return [
      { name: 'Completed', value: reportData.appointments.completed, color: '#10b981' },
      { name: 'Cancelled', value: reportData.appointments.cancelled, color: '#f59e0b' },
      { name: 'No Show', value: reportData.appointments.noShow, color: '#ef4444' },
    ]
  }

  if (loading || !reportData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground">Loading report data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20">
              <BarChart3 className="h-7 w-7" />
            </div>
            Reports Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive analytics and performance insights
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px] shadow-sm">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadReportData} className="shadow-sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportReport} className="shadow-sm bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all overflow-hidden">
            <CardContent className="pt-5 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-full -mr-8 -mt-8" />
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold">{formatCurrency(reportData.revenue.total)}</p>
                  <div className="flex items-center gap-1.5">
                    {reportData.revenue.change >= 0 ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +{reportData.revenue.change}%
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 gap-1">
                        <TrendingDown className="h-3 w-3" />
                        {reportData.revenue.change}%
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">vs last period</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all overflow-hidden">
            <CardContent className="pt-5 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-full -mr-8 -mt-8" />
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                  <p className="text-3xl font-bold">{reportData.patients.total.toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs gap-1">
                      <ArrowUpRight className="h-3 w-3" />
                      +{reportData.patients.newThisPeriod} new
                    </Badge>
                    <span className={cn(
                      "text-xs font-medium",
                      reportData.patients.change >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {reportData.patients.change >= 0 ? '+' : ''}{reportData.patients.change}%
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all overflow-hidden">
            <CardContent className="pt-5 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-full -mr-8 -mt-8" />
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Appointments</p>
                  <p className="text-3xl font-bold">{reportData.appointments.total}</p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                      {reportData.appointments.completed} done
                    </Badge>
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">
                      {reportData.appointments.noShow} no-show
                    </Badge>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all overflow-hidden">
            <CardContent className="pt-5 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/10 to-violet-600/5 rounded-full -mr-8 -mt-8" />
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Claims Approved</p>
                  <p className="text-3xl font-bold">{reportData.insuranceClaims.approved}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-emerald-600">
                      {formatCurrency(reportData.insuranceClaims.totalApproved)}
                    </span>
                    <span className="text-xs text-muted-foreground">approved</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white">
                  <Shield className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-2">
            <PieChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-2">
            <Activity className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-2">
            <Stethoscope className="h-4 w-4" />
            Staff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Trend Chart */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>Monthly revenue vs target comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.revenue.byMonth}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(value) => `$${value / 1000}k`} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="url(#colorRevenue)"
                        name="Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="target"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="none"
                        name="Target"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Distribution */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Appointment Status
                </CardTitle>
                <CardDescription>Distribution of appointment outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <div className="h-[220px] w-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={getAppointmentChartData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getAppointmentChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4 flex-1">
                    {getAppointmentChartData().map((item) => (
                      <div key={item.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {item.value} ({((item.value / reportData.appointments.total) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <Progress
                          value={(item.value / reportData.appointments.total) * 100}
                          className={cn(
                            "h-2",
                            item.name === 'Completed' && "[&>div]:bg-emerald-500",
                            item.name === 'Cancelled' && "[&>div]:bg-amber-500",
                            item.name === 'No Show' && "[&>div]:bg-red-500"
                          )}
                        />
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Avg Wait Time</span>
                      <Badge variant="secondary">{reportData.appointments.averageWaitTime} min</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department Performance */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Department Performance
              </CardTitle>
              <CardDescription>Key metrics across hospital departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {reportData.departmentPerformance.map((dept, index) => (
                  <motion.div
                    key={dept.department}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{dept.department}</h4>
                      <Badge variant="outline" className="gap-1">
                        <Award className="h-3 w-3" />
                        {dept.satisfaction.toFixed(1)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Patients</span>
                        <span className="font-medium">{dept.patients}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-medium text-emerald-600">{formatCurrency(dept.revenue)}</span>
                      </div>
                      <Progress
                        value={(dept.satisfaction / 5) * 100}
                        className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-emerald-500"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6 mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Revenue Breakdown */}
            <Card className="border-0 shadow-md lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Revenue by Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.topServices} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                      <XAxis type="number" tickFormatter={(value) => `$${value / 1000}k`} />
                      <YAxis type="category" dataKey="name" width={120} className="text-xs" />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Services List */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Service Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {reportData.topServices.map((service, index) => (
                      <motion.div
                        key={service.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">{service.name}</p>
                          <p className="text-xs text-muted-foreground">{service.count} services</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{formatCurrency(service.revenue)}</p>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs gap-1",
                              service.trend >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            )}
                          >
                            {service.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {service.trend >= 0 ? '+' : ''}{service.trend}%
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Insurance Summary */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Insurance Claims Summary
              </CardTitle>
              <CardDescription>Overview of insurance claim processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl text-center">
                  <div className="p-2 rounded-full bg-blue-500/10 w-fit mx-auto mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{reportData.insuranceClaims.submitted}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-500">Submitted</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl text-center">
                  <div className="p-2 rounded-full bg-emerald-500/10 w-fit mx-auto mb-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{reportData.insuranceClaims.approved}</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-500">Approved</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl text-center">
                  <div className="p-2 rounded-full bg-amber-500/10 w-fit mx-auto mb-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-400">{reportData.insuranceClaims.pending}</p>
                  <p className="text-sm text-amber-600 dark:text-amber-500">Pending</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 rounded-xl text-center">
                  <div className="p-2 rounded-full bg-red-500/10 w-fit mx-auto mb-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-700 dark:text-red-400">{reportData.insuranceClaims.denied}</p>
                  <p className="text-sm text-red-600 dark:text-red-500">Denied</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 p-4 bg-muted/30 rounded-xl">
                <div>
                  <p className="text-sm text-muted-foreground">Total Claimed</p>
                  <p className="text-2xl font-bold">{formatCurrency(reportData.insuranceClaims.totalClaimed)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Approved</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(reportData.insuranceClaims.totalApproved)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approval Rate</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">
                      {((reportData.insuranceClaims.approved / reportData.insuranceClaims.submitted) * 100).toFixed(1)}%
                    </p>
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Good
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6 mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Appointment Metrics */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Appointment Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-xl text-center">
                      <p className="text-4xl font-bold">{reportData.appointments.total}</p>
                      <p className="text-sm text-muted-foreground">Total Appointments</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-xl text-center">
                      <p className="text-4xl font-bold text-emerald-600">
                        {((reportData.appointments.completed / reportData.appointments.total) * 100).toFixed(0)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Completion Rate</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-sm">Completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{reportData.appointments.completed}</span>
                        <span className="text-xs text-muted-foreground">
                          ({((reportData.appointments.completed / reportData.appointments.total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-sm">Cancelled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{reportData.appointments.cancelled}</span>
                        <span className="text-xs text-muted-foreground">
                          ({((reportData.appointments.cancelled / reportData.appointments.total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm">No Show</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{reportData.appointments.noShow}</span>
                        <span className="text-xs text-muted-foreground">
                          ({((reportData.appointments.noShow / reportData.appointments.total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patient Stats */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Patient Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl text-center">
                      <p className="text-4xl font-bold text-blue-700 dark:text-blue-400">{reportData.patients.total}</p>
                      <p className="text-sm text-blue-600">Total Patients</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl text-center">
                      <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">+{reportData.patients.newThisPeriod}</p>
                      <p className="text-sm text-emerald-600">New This Period</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">New vs Returning</span>
                      <span className="text-sm font-medium">
                        {reportData.patients.newThisPeriod} / {reportData.patients.returning}
                      </span>
                    </div>
                    <Progress
                      value={(reportData.patients.newThisPeriod / reportData.patients.total) * 100}
                      className="h-3"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>New Patients ({((reportData.patients.newThisPeriod / reportData.patients.total) * 100).toFixed(1)}%)</span>
                      <span>Returning ({((reportData.patients.returning / reportData.patients.total) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm">Growth Rate</span>
                    <Badge className={cn(
                      reportData.patients.change >= 0
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {reportData.patients.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {reportData.patients.change >= 0 ? '+' : ''}{reportData.patients.change}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6 mt-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Top Performing Doctors
              </CardTitle>
              <CardDescription>Based on appointments and revenue generated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.topDoctors.map((doctor, index) => (
                  <motion.div
                    key={doctor.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
                  >
                    <div className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg",
                      index === 0 && "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
                      index === 1 && "bg-gradient-to-br from-slate-300 to-slate-500 text-white",
                      index === 2 && "bg-gradient-to-br from-amber-600 to-amber-800 text-white",
                      index > 2 && "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{doctor.name}</h4>
                        <Badge variant="outline" className="text-xs">{doctor.specialty}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{doctor.appointments} appointments</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">{formatCurrency(doctor.revenue)}</p>
                      <div className="flex items-center gap-1 text-sm">
                        <Award className="h-4 w-4 text-amber-500" />
                        <span>{doctor.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
