import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isPast, addDays, differenceInDays } from 'date-fns'
import {
  Wrench,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Filter,
  Calendar,
  Settings,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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

interface Equipment {
  id: string
  name: string
  serialNumber: string
  category: string
  location: string
  manufacturer: string
  purchaseDate: string
  warrantyExpiry?: string
  lastMaintenanceDate?: string
  nextMaintenanceDate: string
  maintenanceInterval: number // in days
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'REPAIR' | 'OUT_OF_SERVICE'
  notes?: string
  maintenanceHistory: MaintenanceRecord[]
}

interface MaintenanceRecord {
  id: string
  date: string
  type: 'ROUTINE' | 'REPAIR' | 'CALIBRATION' | 'INSPECTION'
  technician: string
  description: string
  cost?: number
  partsReplaced?: string
}

const CATEGORIES = [
  'Diagnostic Equipment',
  'Monitoring Equipment',
  'Surgical Equipment',
  'Laboratory Equipment',
  'Imaging Equipment',
  'Life Support',
  'Sterilization',
  'Patient Care',
  'IT/Network',
  'HVAC',
]

const LOCATIONS = [
  'Emergency Room',
  'ICU',
  'Operating Room',
  'Laboratory',
  'Radiology',
  'Pharmacy',
  'General Ward',
  'Pediatric Ward',
  'Reception',
  'Storage',
]

const STORAGE_KEY = 'equipment_maintenance'

export function EquipmentMaintenance() {
  const toast = useToast()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)

  const [form, setForm] = useState({
    name: '',
    serialNumber: '',
    category: '',
    location: '',
    manufacturer: '',
    purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    warrantyExpiry: '',
    nextMaintenanceDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    maintenanceInterval: '90',
    notes: '',
  })

  const [maintenanceForm, setMaintenanceForm] = useState({
    type: 'ROUTINE' as MaintenanceRecord['type'],
    technician: '',
    description: '',
    cost: '',
    partsReplaced: '',
  })

  const loadEquipment = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setEquipment(JSON.parse(stored))
    }
  }, [])

  const saveEquipment = (data: Equipment[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setEquipment(data)
  }

  useEffect(() => {
    loadEquipment()
  }, [loadEquipment])

  const resetForm = () => {
    setForm({
      name: '',
      serialNumber: '',
      category: '',
      location: '',
      manufacturer: '',
      purchaseDate: format(new Date(), 'yyyy-MM-dd'),
      warrantyExpiry: '',
      nextMaintenanceDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      maintenanceInterval: '90',
      notes: '',
    })
  }

  const handleSubmit = () => {
    if (!form.name || !form.serialNumber || !form.category || !form.location) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    if (editingEquipment) {
      const updated = equipment.map(e =>
        e.id === editingEquipment.id
          ? {
              ...e,
              ...form,
              maintenanceInterval: parseInt(form.maintenanceInterval) || 90,
            }
          : e
      )
      saveEquipment(updated)
      toast.success('Updated', 'Equipment updated successfully')
    } else {
      const newEquipment: Equipment = {
        id: `EQ-${Date.now()}`,
        ...form,
        maintenanceInterval: parseInt(form.maintenanceInterval) || 90,
        status: 'OPERATIONAL',
        maintenanceHistory: [],
      }
      saveEquipment([newEquipment, ...equipment])
      toast.success('Added', 'Equipment added successfully')
    }

    setShowAddDialog(false)
    setEditingEquipment(null)
    resetForm()
  }

  const handleEdit = (eq: Equipment) => {
    setEditingEquipment(eq)
    setForm({
      name: eq.name,
      serialNumber: eq.serialNumber,
      category: eq.category,
      location: eq.location,
      manufacturer: eq.manufacturer,
      purchaseDate: eq.purchaseDate,
      warrantyExpiry: eq.warrantyExpiry || '',
      nextMaintenanceDate: eq.nextMaintenanceDate,
      maintenanceInterval: eq.maintenanceInterval.toString(),
      notes: eq.notes || '',
    })
    setShowAddDialog(true)
  }

  const handleDelete = (id: string) => {
    const updated = equipment.filter(e => e.id !== id)
    saveEquipment(updated)
    toast.success('Deleted', 'Equipment removed')
  }

  const handleStatusChange = (id: string, status: Equipment['status']) => {
    const updated = equipment.map(e =>
      e.id === id ? { ...e, status } : e
    )
    saveEquipment(updated)
    toast.success('Updated', `Equipment marked as ${status.replace('_', ' ').toLowerCase()}`)
  }

  const handleMaintenanceSubmit = () => {
    if (!selectedEquipment || !maintenanceForm.technician || !maintenanceForm.description) {
      toast.error('Error', 'Please fill in required fields')
      return
    }

    const newRecord: MaintenanceRecord = {
      id: `MR-${Date.now()}`,
      date: new Date().toISOString(),
      type: maintenanceForm.type,
      technician: maintenanceForm.technician,
      description: maintenanceForm.description,
      cost: maintenanceForm.cost ? parseFloat(maintenanceForm.cost) : undefined,
      partsReplaced: maintenanceForm.partsReplaced,
    }

    const updated = equipment.map(e => {
      if (e.id === selectedEquipment.id) {
        const nextDate = format(addDays(new Date(), e.maintenanceInterval), 'yyyy-MM-dd')
        return {
          ...e,
          lastMaintenanceDate: format(new Date(), 'yyyy-MM-dd'),
          nextMaintenanceDate: nextDate,
          status: 'OPERATIONAL' as Equipment['status'],
          maintenanceHistory: [newRecord, ...e.maintenanceHistory],
        }
      }
      return e
    })

    saveEquipment(updated)
    toast.success('Recorded', 'Maintenance record added')
    setShowMaintenanceDialog(false)
    setSelectedEquipment(null)
    setMaintenanceForm({
      type: 'ROUTINE',
      technician: '',
      description: '',
      cost: '',
      partsReplaced: '',
    })
  }

  const filteredEquipment = equipment.filter(e => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || e.category === filterCategory
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusBadge = (eq: Equipment) => {
    const daysUntilMaintenance = differenceInDays(new Date(eq.nextMaintenanceDate), new Date())
    
    if (eq.status === 'OUT_OF_SERVICE') {
      return <Badge variant="destructive">Out of Service</Badge>
    }
    if (eq.status === 'REPAIR') {
      return <Badge variant="outline" className="bg-red-50 text-red-700">In Repair</Badge>
    }
    if (eq.status === 'MAINTENANCE') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Maintenance</Badge>
    }
    if (isPast(new Date(eq.nextMaintenanceDate))) {
      return <Badge variant="destructive">Overdue</Badge>
    }
    if (daysUntilMaintenance <= 7) {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700">Due Soon</Badge>
    }
    return <Badge variant="outline" className="bg-green-50 text-green-700">Operational</Badge>
  }

  const stats = {
    total: equipment.length,
    operational: equipment.filter(e => e.status === 'OPERATIONAL').length,
    needsMaintenance: equipment.filter(e => 
      isPast(new Date(e.nextMaintenanceDate)) || 
      differenceInDays(new Date(e.nextMaintenanceDate), new Date()) <= 7
    ).length,
    outOfService: equipment.filter(e => e.status === 'OUT_OF_SERVICE' || e.status === 'REPAIR').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Equipment Maintenance</h2>
          <p className="text-muted-foreground">
            Track and manage medical equipment maintenance schedules
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingEquipment(null); setShowAddDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Equipment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Operational</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.operational}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Needs Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-orange-600">{stats.needsMaintenance}</div>
              {stats.needsMaintenance > 0 && <AlertTriangle className="h-5 w-5 text-orange-600" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfService}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <Activity className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="OPERATIONAL">Operational</SelectItem>
            <SelectItem value="MAINTENANCE">In Maintenance</SelectItem>
            <SelectItem value="REPAIR">In Repair</SelectItem>
            <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Equipment List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredEquipment.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No equipment found</p>
              </CardContent>
            </Card>
          ) : (
            filteredEquipment.map((eq) => {
              const isOverdue = isPast(new Date(eq.nextMaintenanceDate))
              const daysUntil = differenceInDays(new Date(eq.nextMaintenanceDate), new Date())
              
              return (
                <motion.div
                  key={eq.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className={isOverdue ? 'border-red-300' : ''}>
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{eq.name}</h3>
                            <Badge variant="outline">{eq.category}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>SN: {eq.serialNumber}</span>
                            <span>•</span>
                            <span>{eq.manufacturer}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Settings className="h-3 w-3" />
                              <span>{eq.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Next: {format(new Date(eq.nextMaintenanceDate), 'MMM d, yyyy')}
                                {isOverdue ? (
                                  <span className="text-red-600 ml-1">(Overdue)</span>
                                ) : daysUntil <= 7 ? (
                                  <span className="text-orange-600 ml-1">({daysUntil} days)</span>
                                ) : null}
                              </span>
                            </div>
                          </div>
                          {eq.lastMaintenanceDate && (
                            <p className="text-xs text-muted-foreground">
                              Last maintenance: {format(new Date(eq.lastMaintenanceDate), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(eq)}
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEquipment(eq)
                                setShowMaintenanceDialog(true)
                              }}
                            >
                              <Wrench className="h-4 w-4 mr-1" />
                              Log Maintenance
                            </Button>
                            {eq.status === 'OPERATIONAL' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusChange(eq.id, 'REPAIR')}
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            )}
                            {(eq.status === 'REPAIR' || eq.status === 'MAINTENANCE') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusChange(eq.id, 'OPERATIONAL')}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(eq)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(eq.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Maintenance History */}
                      {eq.maintenanceHistory.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Recent Maintenance</p>
                          <div className="space-y-2">
                            {eq.maintenanceHistory.slice(0, 3).map(record => (
                              <div key={record.id} className="flex items-center justify-between text-sm bg-muted/50 rounded p-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">{record.type}</Badge>
                                  <span>{record.description}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span>{record.technician}</span>
                                  <span>•</span>
                                  <span>{format(new Date(record.date), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit Equipment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEquipment ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
            <DialogDescription>
              {editingEquipment ? 'Update equipment details' : 'Add new equipment to track'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Equipment Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., MRI Scanner"
                />
              </div>
              <div className="space-y-2">
                <Label>Serial Number *</Label>
                <Input
                  value={form.serialNumber}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                  placeholder="e.g., SN-12345"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location *</Label>
                <Select
                  value={form.location}
                  onValueChange={(v) => setForm({ ...form, location: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Manufacturer</Label>
              <Input
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                placeholder="e.g., Siemens, GE Healthcare"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purchase Date</Label>
                <Input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Warranty Expiry</Label>
                <Input
                  type="date"
                  value={form.warrantyExpiry}
                  onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Next Maintenance Date</Label>
                <Input
                  type="date"
                  value={form.nextMaintenanceDate}
                  onChange={(e) => setForm({ ...form, nextMaintenanceDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Maintenance Interval (days)</Label>
                <Input
                  type="number"
                  value={form.maintenanceInterval}
                  onChange={(e) => setForm({ ...form, maintenanceInterval: e.target.value })}
                  placeholder="90"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes about this equipment"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editingEquipment ? 'Update Equipment' : 'Add Equipment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Maintenance Dialog */}
      <Dialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Maintenance</DialogTitle>
            <DialogDescription>
              Record maintenance for {selectedEquipment?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Maintenance Type</Label>
              <Select
                value={maintenanceForm.type}
                onValueChange={(v) => setMaintenanceForm({ ...maintenanceForm, type: v as MaintenanceRecord['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROUTINE">Routine Maintenance</SelectItem>
                  <SelectItem value="REPAIR">Repair</SelectItem>
                  <SelectItem value="CALIBRATION">Calibration</SelectItem>
                  <SelectItem value="INSPECTION">Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Technician Name *</Label>
              <Input
                value={maintenanceForm.technician}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, technician: e.target.value })}
                placeholder="Technician name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={maintenanceForm.description}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                placeholder="What was done during maintenance"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost ($)</Label>
                <Input
                  type="number"
                  value={maintenanceForm.cost}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Parts Replaced</Label>
                <Input
                  value={maintenanceForm.partsReplaced}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, partsReplaced: e.target.value })}
                  placeholder="List any parts replaced"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMaintenanceDialog(false)}>Cancel</Button>
            <Button onClick={handleMaintenanceSubmit}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Log Maintenance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
