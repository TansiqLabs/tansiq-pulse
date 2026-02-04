import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  ArrowRightLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Send,
  User,
  Building,
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

interface Referral {
  id: string
  patientName: string
  patientId: string
  referringDoctor: string
  referringDepartment: string
  referredToDoctor: string
  referredToDepartment: string
  reason: string
  priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY'
  status: 'PENDING' | 'ACCEPTED' | 'SCHEDULED' | 'COMPLETED' | 'DECLINED'
  notes?: string
  appointmentDate?: string
  createdAt: string
  updatedAt: string
}

const DEPARTMENTS = [
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Oncology',
  'Dermatology',
  'Gastroenterology',
  'Pulmonology',
  'Nephrology',
  'Psychiatry',
  'Surgery',
  'ENT',
  'Ophthalmology',
]

const DOCTORS = [
  { name: 'Dr. Sarah Johnson', department: 'Cardiology' },
  { name: 'Dr. Michael Chen', department: 'Neurology' },
  { name: 'Dr. Emily Davis', department: 'Pediatrics' },
  { name: 'Dr. Robert Wilson', department: 'Orthopedics' },
  { name: 'Dr. Lisa Anderson', department: 'General Medicine' },
  { name: 'Dr. James Brown', department: 'Surgery' },
  { name: 'Dr. Maria Garcia', department: 'Oncology' },
  { name: 'Dr. David Lee', department: 'Gastroenterology' },
]

const STORAGE_KEY = 'patient_referrals'

export function PatientReferrals() {
  const toast = useToast()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null)

  const [form, setForm] = useState({
    patientName: '',
    patientId: '',
    referringDoctor: '',
    referringDepartment: '',
    referredToDoctor: '',
    referredToDepartment: '',
    reason: '',
    priority: 'ROUTINE' as Referral['priority'],
    notes: '',
  })

  const loadReferrals = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setReferrals(JSON.parse(stored))
    }
  }, [])

  const saveReferrals = (data: Referral[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setReferrals(data)
  }

  useEffect(() => {
    loadReferrals()
  }, [loadReferrals])

  const resetForm = () => {
    setForm({
      patientName: '',
      patientId: '',
      referringDoctor: '',
      referringDepartment: '',
      referredToDoctor: '',
      referredToDepartment: '',
      reason: '',
      priority: 'ROUTINE',
      notes: '',
    })
  }

  const handleSubmit = () => {
    if (!form.patientName || !form.referringDoctor || !form.referredToDoctor || !form.reason) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    if (editingReferral) {
      const updated = referrals.map(r =>
        r.id === editingReferral.id
          ? { ...r, ...form, updatedAt: new Date().toISOString() }
          : r
      )
      saveReferrals(updated)
      toast.success('Updated', 'Referral updated successfully')
    } else {
      const newReferral: Referral = {
        id: `REF-${Date.now()}`,
        ...form,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      saveReferrals([newReferral, ...referrals])
      toast.success('Created', 'Referral created successfully')
    }

    setShowAddDialog(false)
    setEditingReferral(null)
    resetForm()
  }

  const handleEdit = (referral: Referral) => {
    setEditingReferral(referral)
    setForm({
      patientName: referral.patientName,
      patientId: referral.patientId,
      referringDoctor: referral.referringDoctor,
      referringDepartment: referral.referringDepartment,
      referredToDoctor: referral.referredToDoctor,
      referredToDepartment: referral.referredToDepartment,
      reason: referral.reason,
      priority: referral.priority,
      notes: referral.notes || '',
    })
    setShowAddDialog(true)
  }

  const handleDelete = (id: string) => {
    const updated = referrals.filter(r => r.id !== id)
    saveReferrals(updated)
    toast.success('Deleted', 'Referral removed')
  }

  const handleStatusChange = (id: string, status: Referral['status']) => {
    const updated = referrals.map(r =>
      r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
    )
    saveReferrals(updated)
    toast.success('Updated', `Referral marked as ${status.toLowerCase()}`)
  }

  const filteredReferrals = referrals.filter(r => {
    const matchesSearch =
      r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referringDoctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referredToDoctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus
    const matchesPriority = filterPriority === 'all' || r.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusBadge = (status: Referral['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>
      case 'ACCEPTED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Accepted</Badge>
      case 'SCHEDULED':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Scheduled</Badge>
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>
      case 'DECLINED':
        return <Badge variant="destructive">Declined</Badge>
    }
  }

  const getPriorityBadge = (priority: Referral['priority']) => {
    switch (priority) {
      case 'ROUTINE':
        return <Badge variant="secondary">Routine</Badge>
      case 'URGENT':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Urgent</Badge>
      case 'EMERGENCY':
        return <Badge variant="destructive">Emergency</Badge>
    }
  }

  const stats = {
    total: referrals.length,
    pending: referrals.filter(r => r.status === 'PENDING').length,
    completed: referrals.filter(r => r.status === 'COMPLETED').length,
    urgent: referrals.filter(r => r.priority === 'URGENT' || r.priority === 'EMERGENCY').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Patient Referrals</h2>
          <p className="text-muted-foreground">
            Manage patient referrals between doctors and departments
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingReferral(null); setShowAddDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          New Referral
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Urgent/Emergency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search referrals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="DECLINED">Declined</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="ROUTINE">Routine</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
            <SelectItem value="EMERGENCY">Emergency</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Referrals List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredReferrals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No referrals found</p>
              </CardContent>
            </Card>
          ) : (
            filteredReferrals.map((referral) => (
              <motion.div
                key={referral.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(referral.patientName.split(' ')[0], referral.patientName.split(' ')[1] || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{referral.patientName}</h3>
                            <span className="text-xs text-muted-foreground">#{referral.id}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{referral.reason}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>From: {referral.referringDoctor}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ArrowRightLeft className="h-3 w-3" />
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>To: {referral.referredToDoctor}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Building className="h-3 w-3" />
                            <span>{referral.referringDepartment} → {referral.referredToDepartment}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(referral.priority)}
                          {getStatusBadge(referral.status)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(referral.createdAt), 'MMM d, yyyy')}
                        </span>
                        <div className="flex items-center gap-1">
                          {referral.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(referral.id, 'ACCEPTED')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(referral.id, 'DECLINED')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Decline
                              </Button>
                            </>
                          )}
                          {referral.status === 'ACCEPTED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(referral.id, 'SCHEDULED')}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Schedule
                            </Button>
                          )}
                          {referral.status === 'SCHEDULED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(referral.id, 'COMPLETED')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(referral)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(referral.id)}>
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
            <DialogTitle>{editingReferral ? 'Edit Referral' : 'New Referral'}</DialogTitle>
            <DialogDescription>
              {editingReferral ? 'Update referral details' : 'Create a new patient referral'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient Name *</Label>
                <Input
                  value={form.patientName}
                  onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  placeholder="Enter patient name"
                />
              </div>
              <div className="space-y-2">
                <Label>Patient ID</Label>
                <Input
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  placeholder="Patient ID (optional)"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Referring Doctor *</Label>
                <Select
                  value={form.referringDoctor}
                  onValueChange={(v) => {
                    const doc = DOCTORS.find(d => d.name === v)
                    setForm({ ...form, referringDoctor: v, referringDepartment: doc?.department || '' })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCTORS.map(doc => (
                      <SelectItem key={doc.name} value={doc.name}>
                        {doc.name} ({doc.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Referring Department</Label>
                <Select
                  value={form.referringDepartment}
                  onValueChange={(v) => setForm({ ...form, referringDepartment: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Referred To Doctor *</Label>
                <Select
                  value={form.referredToDoctor}
                  onValueChange={(v) => {
                    const doc = DOCTORS.find(d => d.name === v)
                    setForm({ ...form, referredToDoctor: v, referredToDepartment: doc?.department || '' })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCTORS.map(doc => (
                      <SelectItem key={doc.name} value={doc.name}>
                        {doc.name} ({doc.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Referred To Department</Label>
                <Select
                  value={form.referredToDepartment}
                  onValueChange={(v) => setForm({ ...form, referredToDepartment: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as Referral['priority'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROUTINE">Routine</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason for Referral *</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Describe the reason for this referral"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes or instructions"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>
              <Send className="h-4 w-4 mr-2" />
              {editingReferral ? 'Update Referral' : 'Create Referral'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
