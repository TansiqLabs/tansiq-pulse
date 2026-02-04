import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isToday, isTomorrow, addDays } from 'date-fns'
import {
  Scissors,
  Plus,
  Search,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  Filter,
  Calendar,
  User,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import { useToast } from '@/components/ui/toast'
import { getInitials } from '@/lib/utils'

interface Surgery {
  id: string
  patientName: string
  patientId: string
  patientAge: number
  surgeryType: string
  surgeon: string
  anesthesiologist: string
  operatingRoom: string
  scheduledDate: string
  scheduledTime: string
  estimatedDuration: number // in minutes
  priority: 'ELECTIVE' | 'URGENT' | 'EMERGENCY'
  status: 'SCHEDULED' | 'PRE_OP' | 'IN_PROGRESS' | 'POST_OP' | 'COMPLETED' | 'CANCELLED'
  preOpNotes?: string
  postOpNotes?: string
  createdAt: string
}

const SURGERY_TYPES = [
  'Appendectomy',
  'Cholecystectomy',
  'Hernia Repair',
  'Knee Replacement',
  'Hip Replacement',
  'Coronary Bypass',
  'Cataract Surgery',
  'Cesarean Section',
  'Spinal Fusion',
  'Mastectomy',
  'Prostatectomy',
  'Thyroidectomy',
  'Gastric Bypass',
  'Laparoscopy',
  'Angioplasty',
]

const SURGEONS = [
  'Dr. James Brown',
  'Dr. Sarah Mitchell',
  'Dr. Robert Garcia',
  'Dr. Amanda White',
  'Dr. Thomas Lee',
  'Dr. Jennifer Kim',
]

const ANESTHESIOLOGISTS = [
  'Dr. Mark Johnson',
  'Dr. Lisa Chen',
  'Dr. David Wilson',
  'Dr. Rachel Adams',
]

const OPERATING_ROOMS = ['OR-1', 'OR-2', 'OR-3', 'OR-4', 'OR-5', 'OR-6']

const STORAGE_KEY = 'surgery_schedule'

export function SurgeryScheduler() {
  const toast = useToast()
  const [surgeries, setSurgeries] = useState<Surgery[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingSurgery, setEditingSurgery] = useState<Surgery | null>(null)

  const [form, setForm] = useState({
    patientName: '',
    patientId: '',
    patientAge: '',
    surgeryType: '',
    surgeon: '',
    anesthesiologist: '',
    operatingRoom: '',
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    scheduledTime: '08:00',
    estimatedDuration: '60',
    priority: 'ELECTIVE' as Surgery['priority'],
    preOpNotes: '',
  })

  const loadSurgeries = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setSurgeries(JSON.parse(stored))
    }
  }, [])

  const saveSurgeries = (data: Surgery[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setSurgeries(data)
  }

  useEffect(() => {
    loadSurgeries()
  }, [loadSurgeries])

  const resetForm = () => {
    setForm({
      patientName: '',
      patientId: '',
      patientAge: '',
      surgeryType: '',
      surgeon: '',
      anesthesiologist: '',
      operatingRoom: '',
      scheduledDate: format(new Date(), 'yyyy-MM-dd'),
      scheduledTime: '08:00',
      estimatedDuration: '60',
      priority: 'ELECTIVE',
      preOpNotes: '',
    })
  }

  const handleSubmit = () => {
    if (!form.patientName || !form.surgeryType || !form.surgeon || !form.operatingRoom) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    if (editingSurgery) {
      const updated = surgeries.map(s =>
        s.id === editingSurgery.id
          ? {
              ...s,
              ...form,
              patientAge: parseInt(form.patientAge) || 0,
              estimatedDuration: parseInt(form.estimatedDuration) || 60,
            }
          : s
      )
      saveSurgeries(updated)
      toast.success('Updated', 'Surgery updated successfully')
    } else {
      const newSurgery: Surgery = {
        id: `SURG-${Date.now()}`,
        ...form,
        patientAge: parseInt(form.patientAge) || 0,
        estimatedDuration: parseInt(form.estimatedDuration) || 60,
        status: 'SCHEDULED',
        createdAt: new Date().toISOString(),
      }
      saveSurgeries([newSurgery, ...surgeries])
      toast.success('Scheduled', 'Surgery scheduled successfully')
    }

    setShowAddDialog(false)
    setEditingSurgery(null)
    resetForm()
  }

  const handleEdit = (surgery: Surgery) => {
    setEditingSurgery(surgery)
    setForm({
      patientName: surgery.patientName,
      patientId: surgery.patientId,
      patientAge: surgery.patientAge.toString(),
      surgeryType: surgery.surgeryType,
      surgeon: surgery.surgeon,
      anesthesiologist: surgery.anesthesiologist,
      operatingRoom: surgery.operatingRoom,
      scheduledDate: surgery.scheduledDate,
      scheduledTime: surgery.scheduledTime,
      estimatedDuration: surgery.estimatedDuration.toString(),
      priority: surgery.priority,
      preOpNotes: surgery.preOpNotes || '',
    })
    setShowAddDialog(true)
  }

  const handleDelete = (id: string) => {
    const updated = surgeries.filter(s => s.id !== id)
    saveSurgeries(updated)
    toast.success('Deleted', 'Surgery removed from schedule')
  }

  const handleStatusChange = (id: string, status: Surgery['status']) => {
    const updated = surgeries.map(s =>
      s.id === id ? { ...s, status } : s
    )
    saveSurgeries(updated)
    toast.success('Updated', `Surgery status changed to ${status.replace('_', ' ').toLowerCase()}`)
  }

  const filteredSurgeries = surgeries.filter(s => {
    const matchesSearch =
      s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.surgeryType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.surgeon.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus
    
    let matchesDate = true
    if (filterDate === 'today') {
      matchesDate = isToday(new Date(s.scheduledDate))
    } else if (filterDate === 'tomorrow') {
      matchesDate = isTomorrow(new Date(s.scheduledDate))
    } else if (filterDate === 'week') {
      const surgeryDate = new Date(s.scheduledDate)
      const weekEnd = addDays(new Date(), 7)
      matchesDate = surgeryDate >= new Date() && surgeryDate <= weekEnd
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusBadge = (status: Surgery['status']) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Scheduled</Badge>
      case 'PRE_OP':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pre-Op</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">In Progress</Badge>
      case 'POST_OP':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Post-Op</Badge>
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
    }
  }

  const getPriorityBadge = (priority: Surgery['priority']) => {
    switch (priority) {
      case 'ELECTIVE':
        return <Badge variant="secondary">Elective</Badge>
      case 'URGENT':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Urgent</Badge>
      case 'EMERGENCY':
        return <Badge variant="destructive">Emergency</Badge>
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const stats = {
    total: surgeries.length,
    today: surgeries.filter(s => isToday(new Date(s.scheduledDate)) && s.status !== 'CANCELLED').length,
    inProgress: surgeries.filter(s => s.status === 'IN_PROGRESS').length,
    completed: surgeries.filter(s => s.status === 'COMPLETED').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Surgery Scheduler</h2>
          <p className="text-muted-foreground">
            Schedule and manage surgical procedures
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingSurgery(null); setShowAddDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Surgery
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Surgeries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search surgeries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterDate} onValueChange={setFilterDate}>
          <SelectTrigger className="w-[150px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="tomorrow">Tomorrow</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="PRE_OP">Pre-Op</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="POST_OP">Post-Op</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Surgeries List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredSurgeries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Scissors className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No surgeries scheduled</p>
              </CardContent>
            </Card>
          ) : (
            filteredSurgeries.map((surgery) => (
              <motion.div
                key={surgery.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className={surgery.priority === 'EMERGENCY' ? 'border-red-300' : ''}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(surgery.patientName.split(' ')[0], surgery.patientName.split(' ')[1] || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{surgery.patientName}</h3>
                            {surgery.patientAge > 0 && (
                              <span className="text-sm text-muted-foreground">({surgery.patientAge} yrs)</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-primary">{surgery.surgeryType}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{surgery.surgeon}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              <span>{surgery.operatingRoom}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(surgery.scheduledDate), 'MMM d, yyyy')}</span>
                            <Clock className="h-3 w-3 ml-2" />
                            <span>{surgery.scheduledTime} ({formatDuration(surgery.estimatedDuration)})</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(surgery.priority)}
                          {getStatusBadge(surgery.status)}
                        </div>
                        <span className="text-xs text-muted-foreground">#{surgery.id}</span>
                        <div className="flex items-center gap-1">
                          {surgery.status === 'SCHEDULED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(surgery.id, 'PRE_OP')}
                            >
                              Start Pre-Op
                            </Button>
                          )}
                          {surgery.status === 'PRE_OP' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(surgery.id, 'IN_PROGRESS')}
                            >
                              Begin Surgery
                            </Button>
                          )}
                          {surgery.status === 'IN_PROGRESS' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(surgery.id, 'POST_OP')}
                            >
                              Complete
                            </Button>
                          )}
                          {surgery.status === 'POST_OP' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(surgery.id, 'COMPLETED')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Discharge
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(surgery)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(surgery.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSurgery ? 'Edit Surgery' : 'Schedule Surgery'}</DialogTitle>
            <DialogDescription>
              {editingSurgery ? 'Update surgery details' : 'Schedule a new surgical procedure'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Patient Name *</Label>
                <Input
                  value={form.patientName}
                  onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  placeholder="Patient name"
                />
              </div>
              <div className="space-y-2">
                <Label>Patient ID</Label>
                <Input
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  placeholder="ID (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input
                  type="number"
                  value={form.patientAge}
                  onChange={(e) => setForm({ ...form, patientAge: e.target.value })}
                  placeholder="Age"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Surgery Type *</Label>
                <Select
                  value={form.surgeryType}
                  onValueChange={(v) => setForm({ ...form, surgeryType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select surgery type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SURGERY_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v as Surgery['priority'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ELECTIVE">Elective</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Surgeon *</Label>
                <Select
                  value={form.surgeon}
                  onValueChange={(v) => setForm({ ...form, surgeon: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select surgeon" />
                  </SelectTrigger>
                  <SelectContent>
                    {SURGEONS.map(surgeon => (
                      <SelectItem key={surgeon} value={surgeon}>{surgeon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Anesthesiologist</Label>
                <Select
                  value={form.anesthesiologist}
                  onValueChange={(v) => setForm({ ...form, anesthesiologist: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select anesthesiologist" />
                  </SelectTrigger>
                  <SelectContent>
                    {ANESTHESIOLOGISTS.map(doc => (
                      <SelectItem key={doc} value={doc}>{doc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Operating Room *</Label>
                <Select
                  value={form.operatingRoom}
                  onValueChange={(v) => setForm({ ...form, operatingRoom: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select OR" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATING_ROOMS.map(or => (
                      <SelectItem key={or} value={or}>{or}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Input
                  type="time"
                  value={form.scheduledTime}
                  onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estimated Duration (minutes)</Label>
              <Input
                type="number"
                value={form.estimatedDuration}
                onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })}
                placeholder="60"
              />
            </div>
            <div className="space-y-2">
              <Label>Pre-Op Notes</Label>
              <Textarea
                value={form.preOpNotes}
                onChange={(e) => setForm({ ...form, preOpNotes: e.target.value })}
                placeholder="Pre-operative notes and instructions"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>
              <Scissors className="h-4 w-4 mr-2" />
              {editingSurgery ? 'Update Surgery' : 'Schedule Surgery'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
