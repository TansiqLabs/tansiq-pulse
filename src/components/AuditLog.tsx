import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import {
  History,
  User,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Download,
  Clock,
  Activity,
  Shield,
  LogIn,
  LogOut,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Stethoscope,
  Pill,
  FlaskConical,
  Bed,
  CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AuditLogEntry {
  id: number
  action: string
  entityType: string
  entityId: number | null
  entityName: string | null
  details: string | null
  userId: string | null
  userName?: string
  createdAt: string
  ipAddress?: string
  severity?: 'info' | 'warning' | 'error' | 'success'
}

const ACTION_CONFIG: Record<string, { icon: typeof History; label: string; color: string; bgClass: string }> = {
  CREATE: {
    icon: UserPlus,
    label: 'Created',
    color: 'emerald',
    bgClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  UPDATE: {
    icon: Edit,
    label: 'Updated',
    color: 'blue',
    bgClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  DELETE: {
    icon: Trash2,
    label: 'Deleted',
    color: 'red',
    bgClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  VIEW: {
    icon: Eye,
    label: 'Viewed',
    color: 'slate',
    bgClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400',
  },
  LOGIN: {
    icon: LogIn,
    label: 'Logged In',
    color: 'purple',
    bgClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  LOGOUT: {
    icon: LogOut,
    label: 'Logged Out',
    color: 'amber',
    bgClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  EXPORT: {
    icon: Download,
    label: 'Exported',
    color: 'orange',
    bgClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  IMPORT: {
    icon: FileText,
    label: 'Imported',
    color: 'teal',
    bgClass: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  },
  SETTING_CHANGE: {
    icon: Settings,
    label: 'Settings',
    color: 'yellow',
    bgClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  ERROR: {
    icon: AlertCircle,
    label: 'Error',
    color: 'red',
    bgClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
}

const ENTITY_CONFIG: Record<string, { icon: typeof User; color: string }> = {
  Patient: { icon: User, color: 'blue' },
  Doctor: { icon: Stethoscope, color: 'emerald' },
  Appointment: { icon: Calendar, color: 'purple' },
  Invoice: { icon: DollarSign, color: 'green' },
  Service: { icon: FileText, color: 'orange' },
  Setting: { icon: Settings, color: 'slate' },
  Prescription: { icon: Pill, color: 'teal' },
  LabTest: { icon: FlaskConical, color: 'violet' },
  Bed: { icon: Bed, color: 'cyan' },
  Payment: { icon: CreditCard, color: 'emerald' },
  User: { icon: User, color: 'indigo' },
  System: { icon: Shield, color: 'slate' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
}

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [expandedDays, setExpandedDays] = useState<string[]>([format(new Date(), 'yyyy-MM-dd')])

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setLoading(true)
    try {
      if (window.electronAPI?.auditLog?.getAll) {
        const data = await window.electronAPI.auditLog.getAll()
        setLogs(data)
      } else {
        // More comprehensive mock data for development
        setLogs([
          {
            id: 1,
            action: 'CREATE',
            entityType: 'Patient',
            entityId: 1,
            entityName: 'John Doe',
            details: 'New patient registered with ID P-2026-0001',
            userId: 'admin',
            userName: 'Admin User',
            createdAt: new Date().toISOString(),
            severity: 'success',
          },
          {
            id: 2,
            action: 'UPDATE',
            entityType: 'Appointment',
            entityId: 5,
            entityName: 'APT-20260203-0001',
            details: 'Status changed from SCHEDULED to COMPLETED',
            userId: 'dr_smith',
            userName: 'Dr. Smith',
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            severity: 'info',
          },
          {
            id: 3,
            action: 'CREATE',
            entityType: 'Invoice',
            entityId: 10,
            entityName: 'INV-202602-0010',
            details: 'Invoice generated for $250.00',
            userId: 'billing',
            userName: 'Billing Dept',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            severity: 'success',
          },
          {
            id: 4,
            action: 'LOGIN',
            entityType: 'User',
            entityId: 1,
            entityName: 'admin',
            details: 'Successful login from 192.168.1.100',
            userId: 'admin',
            userName: 'Admin User',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            ipAddress: '192.168.1.100',
            severity: 'info',
          },
          {
            id: 5,
            action: 'DELETE',
            entityType: 'Appointment',
            entityId: 3,
            entityName: 'APT-20260201-0003',
            details: 'Appointment cancelled by patient request',
            userId: 'receptionist',
            userName: 'Front Desk',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            severity: 'warning',
          },
          {
            id: 6,
            action: 'UPDATE',
            entityType: 'Patient',
            entityId: 15,
            entityName: 'Jane Smith',
            details: 'Medical history updated',
            userId: 'dr_jones',
            userName: 'Dr. Jones',
            createdAt: new Date(Date.now() - 90000000).toISOString(),
            severity: 'info',
          },
          {
            id: 7,
            action: 'CREATE',
            entityType: 'Prescription',
            entityId: 42,
            entityName: 'RX-2026-0042',
            details: 'Amoxicillin 500mg prescribed for Jane Smith',
            userId: 'dr_smith',
            userName: 'Dr. Smith',
            createdAt: new Date(Date.now() - 100000000).toISOString(),
            severity: 'success',
          },
          {
            id: 8,
            action: 'EXPORT',
            entityType: 'Invoice',
            entityId: null,
            entityName: null,
            details: 'Monthly invoices exported to CSV',
            userId: 'billing',
            userName: 'Billing Dept',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            severity: 'info',
          },
          {
            id: 9,
            action: 'SETTING_CHANGE',
            entityType: 'System',
            entityId: null,
            entityName: 'Notification Settings',
            details: 'Email notifications enabled',
            userId: 'admin',
            userName: 'Admin User',
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            severity: 'info',
          },
          {
            id: 10,
            action: 'ERROR',
            entityType: 'System',
            entityId: null,
            entityName: 'Backup Process',
            details: 'Scheduled backup failed - disk space low',
            userId: 'system',
            userName: 'System',
            createdAt: new Date(Date.now() - 345600000).toISOString(),
            severity: 'error',
          },
        ])
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.entityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userName?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesAction = actionFilter === 'all' || log.action === actionFilter
      const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter
      return matchesSearch && matchesAction && matchesEntity
    })
  }, [logs, searchQuery, actionFilter, entityFilter])

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, AuditLogEntry[]> = {}
    filteredLogs.forEach(log => {
      const dateKey = format(new Date(log.createdAt), 'yyyy-MM-dd')
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(log)
    })
    return groups
  }, [filteredLogs])

  const stats = useMemo(() => {
    const today = logs.filter(l => isToday(new Date(l.createdAt)))
    return {
      total: logs.length,
      today: today.length,
      creates: logs.filter(l => l.action === 'CREATE').length,
      updates: logs.filter(l => l.action === 'UPDATE').length,
      deletes: logs.filter(l => l.action === 'DELETE').length,
      errors: logs.filter(l => l.severity === 'error').length,
    }
  }, [logs])

  const uniqueActions = [...new Set(logs.map((l) => l.action))]
  const uniqueEntities = [...new Set(logs.map((l) => l.entityType))]

  const getActionConfig = (action: string) => {
    return ACTION_CONFIG[action] || { icon: History, label: action, color: 'slate', bgClass: 'bg-slate-100 text-slate-700' }
  }

  const getEntityConfig = (entityType: string) => {
    return ENTITY_CONFIG[entityType] || { icon: FileText, color: 'slate' }
  }

  const getDateLabel = (dateKey: string) => {
    const date = new Date(dateKey)
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM d, yyyy')
  }

  const toggleDay = (dateKey: string) => {
    setExpandedDays(prev =>
      prev.includes(dateKey)
        ? prev.filter(d => d !== dateKey)
        : [...prev, dateKey]
    )
  }

  const exportLogs = () => {
    const csv = [
      ['Time', 'Action', 'Entity Type', 'Entity Name', 'Details', 'User'].join(','),
      ...logs.map(l => [
        format(new Date(l.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        l.action,
        l.entityType,
        `"${l.entityName || ''}"`,
        `"${l.details || ''}"`,
        `"${l.userName || ''}"`,
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_log_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-lg shadow-slate-500/20">
              <History className="h-6 w-6" />
            </div>
            Activity Log
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track all changes and activities in the system
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs} className="shadow-sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading} className="shadow-sm">
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Today</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.today}</p>
                </div>
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Created</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.creates}</p>
                </div>
                <UserPlus className="h-5 w-5 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Updated</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.updates}</p>
                </div>
                <Edit className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Deleted</p>
                  <p className="text-2xl font-bold text-red-600">{stats.deletes}</p>
                </div>
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className={cn(
            "border-0 shadow-md hover:shadow-lg transition-all",
            stats.errors > 0 && "ring-2 ring-red-500/20"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 shadow-sm"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[150px] shadow-sm">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => {
                  const config = getActionConfig(action)
                  return (
                    <SelectItem key={action} value={action}>
                      <span className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", `bg-${config.color}-500`)} />
                        {config.label}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[150px] shadow-sm">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueEntities.map((entity) => (
                  <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {loading ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <History className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Activities Found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              No activity logs match your current filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedLogs)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([dateKey, dayLogs]) => {
              const isExpanded = expandedDays.includes(dateKey)

              return (
                <Card key={dateKey} className="border-0 shadow-md overflow-hidden">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleDay(dateKey)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <CardTitle className="text-base">{getDateLabel(dateKey)}</CardTitle>
                              <CardDescription>{dayLogs.length} activities</CardDescription>
                            </div>
                          </div>
                          <Badge variant="secondary">{dayLogs.length}</Badge>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <motion.div
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                          className="relative pl-6 space-y-4"
                        >
                          {/* Timeline line */}
                          <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-muted" />

                          <AnimatePresence>
                            {dayLogs.map((log) => {
                              const actionConfig = getActionConfig(log.action)
                              const entityConfig = getEntityConfig(log.entityType)
                              const ActionIcon = actionConfig.icon
                              const EntityIcon = entityConfig.icon

                              return (
                                <motion.div
                                  key={log.id}
                                  variants={itemVariants}
                                  className="relative group"
                                >
                                  {/* Timeline dot */}
                                  <div className={cn(
                                    "absolute left-[-24px] w-5 h-5 rounded-full border-2 border-background flex items-center justify-center z-10",
                                    `bg-${actionConfig.color}-500`
                                  )}>
                                    <ActionIcon className="h-3 w-3 text-white" />
                                  </div>

                                  {/* Log content */}
                                  <div className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                          <Badge className={cn("gap-1 text-xs", actionConfig.bgClass)}>
                                            {actionConfig.label}
                                          </Badge>
                                          <Badge variant="outline" className="gap-1 text-xs">
                                            <EntityIcon className="h-3 w-3" />
                                            {log.entityType}
                                          </Badge>
                                          {log.severity === 'error' && (
                                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">
                                              Error
                                            </Badge>
                                          )}
                                        </div>

                                        <div className="space-y-1">
                                          {log.entityName && (
                                            <p className="font-medium">{log.entityName}</p>
                                          )}
                                          {log.details && (
                                            <p className="text-sm text-muted-foreground">{log.details}</p>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(log.createdAt), 'HH:mm:ss')}
                                          </span>
                                          {log.userName && (
                                            <span className="flex items-center gap-1">
                                              <User className="h-3 w-3" />
                                              {log.userName}
                                            </span>
                                          )}
                                          {log.ipAddress && (
                                            <span className="font-mono">{log.ipAddress}</span>
                                          )}
                                        </div>
                                      </div>

                                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              )
                            })}
                          </AnimatePresence>
                        </motion.div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )
            })}
        </div>
      )}
    </div>
  )
}
