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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'

interface ReportData {
  revenue: {
    total: number
    change: number
    byMonth: { month: string; amount: number }[]
  }
  patients: {
    total: number
    newThisPeriod: number
    change: number
  }
  appointments: {
    total: number
    completed: number
    cancelled: number
    noShow: number
  }
  topServices: { name: string; count: number; revenue: number }[]
  topDoctors: { name: string; appointments: number; revenue: number }[]
  insuranceClaims: {
    submitted: number
    approved: number
    denied: number
    pending: number
    totalClaimed: number
    totalApproved: number
  }
}

export function ReportsDashboard() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [period, setPeriod] = useState<string>('this_month')
  const [loading, setLoading] = useState(true)

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
          { month: 'Jan', amount: 38000 },
          { month: 'Feb', amount: 42000 },
          { month: 'Mar', amount: 45000 },
          { month: 'Apr', amount: 41000 },
          { month: 'May', amount: 48000 },
          { month: 'Jun', amount: 52000 },
        ].slice(0, period === 'this_year' ? 6 : 3),
      },
      patients: {
        total: Math.floor(1250 * multiplier),
        newThisPeriod: Math.floor(85 * multiplier),
        change: Math.floor(Math.random() * 20) - 5,
      },
      appointments: {
        total: Math.floor(320 * multiplier),
        completed: Math.floor(280 * multiplier),
        cancelled: Math.floor(25 * multiplier),
        noShow: Math.floor(15 * multiplier),
      },
      topServices: [
        { name: 'General Consultation', count: Math.floor(120 * multiplier), revenue: Math.floor(12000 * multiplier) },
        { name: 'Lab Tests', count: Math.floor(95 * multiplier), revenue: Math.floor(9500 * multiplier) },
        { name: 'X-Ray/Imaging', count: Math.floor(45 * multiplier), revenue: Math.floor(8100 * multiplier) },
        { name: 'Vaccination', count: Math.floor(60 * multiplier), revenue: Math.floor(3000 * multiplier) },
        { name: 'Physical Therapy', count: Math.floor(30 * multiplier), revenue: Math.floor(4500 * multiplier) },
      ],
      topDoctors: [
        { name: 'Dr. Sarah Johnson', appointments: Math.floor(85 * multiplier), revenue: Math.floor(12750 * multiplier) },
        { name: 'Dr. Michael Chen', appointments: Math.floor(72 * multiplier), revenue: Math.floor(10800 * multiplier) },
        { name: 'Dr. Emily Davis', appointments: Math.floor(68 * multiplier), revenue: Math.floor(10200 * multiplier) },
        { name: 'Dr. Robert Wilson', appointments: Math.floor(55 * multiplier), revenue: Math.floor(8250 * multiplier) },
      ],
      insuranceClaims: {
        submitted: Math.floor(150 * multiplier),
        approved: Math.floor(120 * multiplier),
        denied: Math.floor(15 * multiplier),
        pending: Math.floor(15 * multiplier),
        totalClaimed: Math.floor(75000 * multiplier),
        totalApproved: Math.floor(65000 * multiplier),
      },
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

  if (loading || !reportData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive overview of hospital performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
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
          <Button variant="outline" onClick={loadReportData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(reportData.revenue.total)}</div>
              <div className="flex items-center gap-1 mt-1">
                {reportData.revenue.change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${reportData.revenue.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {reportData.revenue.change >= 0 ? '+' : ''}{reportData.revenue.change}%
                </span>
                <span className="text-sm text-muted-foreground">vs last period</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Patients
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.patients.total.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">
                  +{reportData.patients.newThisPeriod} new
                </Badge>
                <span className={`text-sm ${reportData.patients.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {reportData.patients.change >= 0 ? '+' : ''}{reportData.patients.change}%
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Appointments
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.appointments.total}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                  {reportData.appointments.completed} completed
                </Badge>
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                  {reportData.appointments.noShow} no-show
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Insurance Claims
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.insuranceClaims.approved}</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-green-500">
                  {formatCurrency(reportData.insuranceClaims.totalApproved)}
                </span>
                <span className="text-sm text-muted-foreground">approved</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.revenue.byMonth.map((item, index) => {
                const maxAmount = Math.max(...reportData.revenue.byMonth.map(m => m.amount))
                const percentage = (item.amount / maxAmount) * 100
                return (
                  <div key={item.month} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.month}</span>
                      <span className="text-muted-foreground">{formatCurrency(item.amount)}</span>
                    </div>
                    <motion.div
                      className="h-2 bg-muted rounded-full overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                      />
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Appointment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Status</CardTitle>
            <CardDescription>Distribution of appointment outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Completed', value: reportData.appointments.completed, color: 'bg-green-500' },
                { label: 'Cancelled', value: reportData.appointments.cancelled, color: 'bg-yellow-500' },
                { label: 'No Show', value: reportData.appointments.noShow, color: 'bg-red-500' },
              ].map((item, index) => {
                const percentage = (item.value / reportData.appointments.total) * 100
                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-muted-foreground">{item.value} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <motion.div
                      className="h-3 bg-muted rounded-full overflow-hidden"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <motion.div
                        className={`h-full ${item.color} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                      />
                    </motion.div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topServices.map((service, index) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">{service.count} services</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(service.revenue)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Doctors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Top Doctors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topDoctors.map((doctor, index) => (
                <motion.div
                  key={doctor.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{doctor.name}</p>
                    <p className="text-sm text-muted-foreground">{doctor.appointments} appointments</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(doctor.revenue)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insurance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Claims Summary</CardTitle>
          <CardDescription>Overview of insurance claim processing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-700">{reportData.insuranceClaims.submitted}</p>
              <p className="text-sm text-blue-600">Submitted</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-700">{reportData.insuranceClaims.approved}</p>
              <p className="text-sm text-green-600">Approved</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-700">{reportData.insuranceClaims.pending}</p>
              <p className="text-sm text-yellow-600">Pending</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-700">{reportData.insuranceClaims.denied}</p>
              <p className="text-sm text-red-600">Denied</p>
            </div>
          </div>
          <div className="mt-6 flex justify-between items-center p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Total Claimed</p>
              <p className="text-xl font-bold">{formatCurrency(reportData.insuranceClaims.totalClaimed)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Approved</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(reportData.insuranceClaims.totalApproved)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Approval Rate</p>
              <p className="text-xl font-bold">
                {((reportData.insuranceClaims.approved / reportData.insuranceClaims.submitted) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
