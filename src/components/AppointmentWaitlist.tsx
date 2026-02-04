import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  Clock,
  Plus,
  Search,
  Phone,
  Mail,
  UserCheck,
  UserX,
  ArrowUp,
  ArrowDown,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { useToast } from '@/components/ui/toast'
import { getInitials } from '@/lib/utils'

interface WaitlistEntry {
  id: string
  patientName: string
  patientPhone: string
  patientEmail?: string
  reason: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  preferredDoctor?: string
  preferredDate?: string
  preferredTime?: string
  status: 'WAITING' | 'CONTACTED' | 'SCHEDULED' | 'CANCELLED'
  notes?: string
  addedAt: string
  contactedAt?: string
}

const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-700' },
  { value: 'NORMAL', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700' },
]

export function AppointmentWaitlist() {
  const toast = useToast()
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)

  const [entryForm, setEntryForm] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    reason: '',
    priority: 'NORMAL' as WaitlistEntry['priority'],
    preferredDoctor: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
  })

  const loadEntries = useCallback(() => {
    const stored = localStorage.getItem('appointment_waitlist')
    if (stored) {
      setEntries(JSON.parse(stored))
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const saveEntries = (newEntries: WaitlistEntry[]) => {
    localStorage.setItem('appointment_waitlist', JSON.stringify(newEntries))
    setEntries(newEntries)
  }

  const resetForm = () => {
    setEntryForm({
      patientName: '',
      patientPhone: '',
      patientEmail: '',
      reason: '',
      priority: 'NORMAL',
      preferredDoctor: '',
      preferredDate: '',
      preferredTime: '',
      notes: '',
    })
  }

  const handleAddEntry = () => {
    if (!entryForm.patientName || !entryForm.patientPhone || !entryForm.reason) {
      toast.error('Error', 'Please fill in required fields')
      return
    }

    const newEntry: WaitlistEntry = {
      id: crypto.randomUUID(),
      patientName: entryForm.patientName,
      patientPhone: entryForm.patientPhone,
      patientEmail: entryForm.patientEmail || undefined,
      reason: entryForm.reason,
      priority: entryForm.priority,
      preferredDoctor: entryForm.preferredDoctor || undefined,
      preferredDate: entryForm.preferredDate || undefined,
      preferredTime: entryForm.preferredTime || undefined,
      notes: entryForm.notes || undefined,
      status: 'WAITING',
      addedAt: new Date().toISOString(),
    }

    saveEntries([newEntry, ...entries])
    toast.success('Added', 'Patient added to waitlist')
    setShowAddDialog(false)
    resetForm()
  }

  const handleStatusChange = (id: string, status: WaitlistEntry['status']) => {
    const updated = entries.map(e => {
      if (e.id === id) {
        return {
          ...e,
          status,
          contactedAt: status === 'CONTACTED' ? new Date().toISOString() : e.contactedAt,
        }
      }
      return e
    })
    saveEntries(updated)
    toast.success('Updated', 'Status updated')
  }

  const handlePriorityChange = (id: string, direction: 'up' | 'down') => {
    const priorityOrder = ['LOW', 'NORMAL', 'HIGH', 'URGENT']
    const updated = entries.map(e => {
      if (e.id === id) {
        const currentIndex = priorityOrder.indexOf(e.priority)
        const newIndex = direction === 'up' 
          ? Math.min(currentIndex + 1, priorityOrder.length - 1)
          : Math.max(currentIndex - 1, 0)
        return { ...e, priority: priorityOrder[newIndex] as WaitlistEntry['priority'] }
      }
      return e
    })
    saveEntries(updated)
  }

  const handleRemove = (id: string) => {
    const updated = entries.filter(e => e.id !== id)
    saveEntries(updated)
    toast.success('Removed', 'Entry removed from waitlist')
  }

  const getPriorityConfig = (priority: WaitlistEntry['priority']) => {
    return PRIORITIES.find(p => p.value === priority) || PRIORITIES[1]
  }

  const getStatusBadge = (status: WaitlistEntry['status']) => {
    switch (status) {
      case 'WAITING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Waiting</Badge>
      case 'CONTACTED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Contacted</Badge>
      case 'SCHEDULED':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Scheduled</Badge>
      case 'CANCELLED':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">Cancelled</Badge>
    }
  }

  const filteredEntries = entries
    .filter(e => {
      const matchesSearch = e.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.patientPhone.includes(searchQuery)
      const matchesStatus = filterStatus === 'all' || e.status === filterStatus
      const matchesPriority = filterPriority === 'all' || e.priority === filterPriority
      return matchesSearch && matchesStatus && matchesPriority
    })
    .sort((a, b) => {
      const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

  const stats = {
    total: entries.length,
    waiting: entries.filter(e => e.status === 'WAITING').length,
    urgent: entries.filter(e => e.priority === 'URGENT' && e.status === 'WAITING').length,
    scheduled: entries.filter(e => e.status === 'SCHEDULED').length,
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total in Waitlist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Waiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{stats.waiting}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.urgent}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.scheduled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="WAITING">Waiting</SelectItem>
              <SelectItem value="CONTACTED">Contacted</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add to Waitlist
        </Button>
      </div>

      {/* Waitlist */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredEntries.map((entry, index) => {
            const priorityConfig = getPriorityConfig(entry.priority)
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={entry.priority === 'URGENT' ? 'border-red-300 bg-red-50/30' : ''}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 w-6 p-0"
                            onClick={() => handlePriorityChange(entry.id, 'up')}
                            disabled={entry.priority === 'URGENT'}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Badge className={`${priorityConfig.color} text-xs`}>
                            {priorityConfig.label}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 w-6 p-0"
                            onClick={() => handlePriorityChange(entry.id, 'down')}
                            disabled={entry.priority === 'LOW'}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>

                        <Avatar className="h-12 w-12">
                          <AvatarFallback>{getInitials(entry.patientName.split(' ')[0], entry.patientName.split(' ')[1] || '')}</AvatarFallback>
                        </Avatar>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{entry.patientName}</h4>
                            {getStatusBadge(entry.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{entry.reason}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {entry.patientPhone}
                            </span>
                            {entry.patientEmail && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {entry.patientEmail}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Added {formatDistanceToNow(new Date(entry.addedAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 sm:flex-col">
                        {entry.status === 'WAITING' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusChange(entry.id, 'CONTACTED')}
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              Contact
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => handleStatusChange(entry.id, 'SCHEDULED')}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Schedule
                            </Button>
                          </>
                        )}
                        {entry.status === 'CONTACTED' && (
                          <Button 
                            size="sm"
                            onClick={() => handleStatusChange(entry.id, 'SCHEDULED')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Scheduled
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500"
                          onClick={() => handleRemove(entry.id)}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {filteredEntries.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No patients in waitlist</p>
            <Button variant="link" onClick={() => setShowAddDialog(true)}>
              Add a patient
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add to Waitlist Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add to Waitlist</DialogTitle>
            <DialogDescription>Add a patient to the appointment waitlist</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient Name *</Label>
                <Input
                  value={entryForm.patientName}
                  onChange={(e) => setEntryForm({ ...entryForm, patientName: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={entryForm.patientPhone}
                  onChange={(e) => setEntryForm({ ...entryForm, patientPhone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={entryForm.patientEmail}
                onChange={(e) => setEntryForm({ ...entryForm, patientEmail: e.target.value })}
                placeholder="Email address"
              />
            </div>

            <div className="space-y-2">
              <Label>Reason for Appointment *</Label>
              <Input
                value={entryForm.reason}
                onChange={(e) => setEntryForm({ ...entryForm, reason: e.target.value })}
                placeholder="e.g., Follow-up consultation"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={entryForm.priority}
                  onValueChange={(value: WaitlistEntry['priority']) => setEntryForm({ ...entryForm, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preferred Doctor</Label>
                <Input
                  value={entryForm.preferredDoctor}
                  onChange={(e) => setEntryForm({ ...entryForm, preferredDoctor: e.target.value })}
                  placeholder="Any specific doctor"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preferred Date</Label>
                <Input
                  type="date"
                  value={entryForm.preferredDate}
                  onChange={(e) => setEntryForm({ ...entryForm, preferredDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Time</Label>
                <Input
                  type="time"
                  value={entryForm.preferredTime}
                  onChange={(e) => setEntryForm({ ...entryForm, preferredTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={entryForm.notes}
                onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry}>
              Add to Waitlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
