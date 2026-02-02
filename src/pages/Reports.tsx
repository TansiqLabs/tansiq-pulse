import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns'
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DatePicker } from '@/components/ui/date-picker'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface ReportData {
  totalRevenue: number
  totalPatients: number
  totalAppointments: number
  paidInvoices: number
  pendingInvoices: number
  revenueByDay: { date: string; amount: number }[]
  appointmentsByStatus: { status: string; count: number }[]
  topServices: { name: string; count: number; revenue: number }[]
  recentPayments: {
    id: number
    invoiceNumber: string
    patientName: string
    amount: number
    paymentMethod: string
    paidAt: string
  }[]
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export function Reports() {
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('month')
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()))
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()))
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    // Update date range based on selection
    const today = new Date()
    switch (dateRange) {
      case 'today':
        setStartDate(today)
        setEndDate(today)
        break
      case 'week':
        setStartDate(startOfWeek(today))
        setEndDate(endOfWeek(today))
        break
      case 'month':
        setStartDate(startOfMonth(today))
        setEndDate(endOfMonth(today))
        break
    }
  }, [dateRange])

  useEffect(() => {
    fetchReportData()
  }, [startDate, endDate])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      // Fetch all required data in parallel
      const [dashboardData, invoices, appointments, payments] = await Promise.all([
        window.electronAPI.dashboard.getStats(),
        window.electronAPI.invoices.getAll(),
        window.electronAPI.appointments.getAll(),
        // Get payments through invoices
        window.electronAPI.invoices.getAll(),
      ])

      // Filter by date range
      const filteredInvoices = invoices.filter((inv: any) => {
        const invDate = new Date(inv.createdAt)
        return invDate >= startDate && invDate <= endDate
      })

      const filteredAppointments = appointments.filter((apt: any) => {
        const aptDate = new Date(apt.scheduledDate)
        return aptDate >= startDate && aptDate <= endDate
      })

      // Calculate revenue by day
      const revenueMap: Record<string, number> = {}
      filteredInvoices.forEach((inv: any) => {
        const dateKey = format(new Date(inv.createdAt), 'MMM dd')
        revenueMap[dateKey] = (revenueMap[dateKey] || 0) + inv.paidAmount
      })

      const revenueByDay = Object.entries(revenueMap).map(([date, amount]) => ({
        date,
        amount,
      }))

      // Appointments by status
      const statusMap: Record<string, number> = {}
      filteredAppointments.forEach((apt: any) => {
        statusMap[apt.status] = (statusMap[apt.status] || 0) + 1
      })

      const appointmentsByStatus = Object.entries(statusMap).map(([status, count]) => ({
        status: status.replace('_', ' '),
        count,
      }))

      // Top services from invoice items
      const serviceMap: Record<string, { count: number; revenue: number }> = {}
      filteredInvoices.forEach((inv: any) => {
        inv.items?.forEach((item: any) => {
          const name = item.description
          if (!serviceMap[name]) {
            serviceMap[name] = { count: 0, revenue: 0 }
          }
          serviceMap[name].count += item.quantity
          serviceMap[name].revenue += item.totalPrice
        })
      })

      const topServices = Object.entries(serviceMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Recent payments
      const recentPayments: any[] = []
      filteredInvoices.forEach((inv: any) => {
        inv.payments?.forEach((payment: any) => {
          recentPayments.push({
            id: payment.id,
            invoiceNumber: inv.invoiceNumber,
            patientName: inv.patient?.fullName || 'Unknown',
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            paidAt: payment.paidAt,
          })
        })
      })

      recentPayments.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())

      setReportData({
        totalRevenue: filteredInvoices.reduce((sum: number, inv: any) => sum + inv.paidAmount, 0),
        totalPatients: dashboardData.totalPatients,
        totalAppointments: filteredAppointments.length,
        paidInvoices: filteredInvoices.filter((inv: any) => inv.status === 'PAID').length,
        pendingInvoices: filteredInvoices.filter((inv: any) => inv.status === 'PENDING').length,
        revenueByDay,
        appointmentsByStatus,
        topServices,
        recentPayments: recentPayments.slice(0, 10),
      })
    } catch (error) {
      console.error('Failed to fetch report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = async (type: 'revenue' | 'appointments' | 'payments') => {
    if (!reportData) return

    setExporting(true)
    try {
      let csvContent = ''
      let filename = ''

      switch (type) {
        case 'revenue':
          csvContent = 'Date,Amount\n'
          reportData.revenueByDay.forEach(row => {
            csvContent += `${row.date},${row.amount}\n`
          })
          filename = `revenue-report-${format(startDate, 'yyyy-MM-dd')}.csv`
          break
        case 'appointments':
          csvContent = 'Status,Count\n'
          reportData.appointmentsByStatus.forEach(row => {
            csvContent += `${row.status},${row.count}\n`
          })
          filename = `appointments-report-${format(startDate, 'yyyy-MM-dd')}.csv`
          break
        case 'payments':
          csvContent = 'Invoice,Patient,Amount,Method,Date\n'
          reportData.recentPayments.forEach(row => {
            csvContent += `${row.invoiceNumber},${row.patientName},${row.amount},${row.paymentMethod},${format(new Date(row.paidAt), 'yyyy-MM-dd')}\n`
          })
          filename = `payments-report-${format(startDate, 'yyyy-MM-dd')}.csv`
          break
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
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
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate insights and export data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Custom Date Range */}
      {dateRange === 'custom' && (
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">From:</span>
            <DatePicker date={startDate} onSelect={(d) => d && setStartDate(d)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">To:</span>
            <DatePicker date={endDate} onSelect={(d) => d && setEndDate(d)} />
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(reportData?.totalRevenue || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.totalAppointments || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {reportData?.paidInvoices || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {reportData?.pendingInvoices || 0}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue for selected period</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV('revenue')}
                disabled={exporting || loading}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData?.revenueByDay || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Appointments Pie Chart */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Appointments by Status</CardTitle>
                <CardDescription>Distribution of appointment statuses</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV('appointments')}
                disabled={exporting || loading}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData?.appointmentsByStatus || []}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {(reportData?.appointmentsByStatus || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Services & Recent Payments */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Services */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Top Services</CardTitle>
              <CardDescription>Most popular services by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {reportData?.topServices.map((service, index) => (
                    <div key={service.name} className="flex items-center gap-4">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {service.count} times
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(service.revenue)}</p>
                      </div>
                    </div>
                  ))}
                  {reportData?.topServices.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No service data for this period
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Payments */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest payment transactions</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV('payments')}
                disabled={exporting || loading}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.recentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-xs">
                          {payment.invoiceNumber}
                        </TableCell>
                        <TableCell className="truncate max-w-[120px]">
                          {payment.patientName}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted">
                            {payment.paymentMethod}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-600">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {reportData?.recentPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No payments for this period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
