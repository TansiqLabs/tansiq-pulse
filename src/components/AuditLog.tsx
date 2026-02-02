import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuditLogEntry {
  id: number
  action: string
  entityType: string
  entityId: number | null
  entityName: string | null
  details: string | null
  userId: string | null
  createdAt: string
}

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CREATE: UserPlus,
  UPDATE: Edit,
  DELETE: Trash2,
  VIEW: Eye,
  LOGIN: User,
  EXPORT: FileText,
  IMPORT: FileText,
  SETTING_CHANGE: Settings,
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  VIEW: 'bg-gray-100 text-gray-700',
  LOGIN: 'bg-purple-100 text-purple-700',
  EXPORT: 'bg-orange-100 text-orange-700',
  IMPORT: 'bg-teal-100 text-teal-700',
  SETTING_CHANGE: 'bg-yellow-100 text-yellow-700',
}

const entityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Patient: User,
  Doctor: User,
  Appointment: Calendar,
  Invoice: DollarSign,
  Service: FileText,
  Setting: Settings,
}

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')

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
        // Mock data for development
        setLogs([
          {
            id: 1,
            action: 'CREATE',
            entityType: 'Patient',
            entityId: 1,
            entityName: 'John Doe',
            details: 'New patient registered',
            userId: null,
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            action: 'UPDATE',
            entityType: 'Appointment',
            entityId: 5,
            entityName: 'APT-20260203-0001',
            details: 'Status changed to COMPLETED',
            userId: null,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 3,
            action: 'CREATE',
            entityType: 'Invoice',
            entityId: 10,
            entityName: 'INV-202602-0010',
            details: 'Invoice generated for $250.00',
            userId: null,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
          },
        ])
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.entityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter
    return matchesSearch && matchesAction && matchesEntity
  })

  const uniqueActions = [...new Set(logs.map((l) => l.action))]
  const uniqueEntities = [...new Set(logs.map((l) => l.entityType))]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Activity Log
            </CardTitle>
            <CardDescription>
              Track all changes and activities in the system
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueEntities.map((entity) => (
                <SelectItem key={entity} value={entity}>
                  {entity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Log Table */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity logs found</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Time</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredLogs.map((log) => {
                    const ActionIcon = actionIcons[log.action] || History
                    const EntityIcon = entityIcons[log.entityType] || FileText

                    return (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b"
                      >
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                            <ActionIcon className="h-3 w-3 mr-1" />
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <EntityIcon className="h-4 w-4 text-muted-foreground" />
                            {log.entityType}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {log.entityName && (
                              <span className="font-medium">{log.entityName}</span>
                            )}
                            {log.details && (
                              <p className="text-sm text-muted-foreground">{log.details}</p>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
