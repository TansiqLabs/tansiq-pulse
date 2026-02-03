import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  BedDouble,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Search,
  Filter,
  Building,
  CheckCircle,
  Clock,
  AlertTriangle,
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

interface Bed {
  id: string
  bedNumber: string
  ward: string
  floor: string
  type: 'STANDARD' | 'ICU' | 'PRIVATE' | 'SEMI_PRIVATE' | 'PEDIATRIC' | 'MATERNITY'
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED'
  patientId?: number
  patientName?: string
  admissionDate?: string
  expectedDischarge?: string
  notes?: string
}

const WARDS = [
  'General Ward A',
  'General Ward B',
  'ICU',
  'NICU',
  'CCU',
  'Emergency',
  'Maternity',
  'Pediatric',
  'Surgical',
  'Orthopedic',
  'Oncology',
]

const FLOORS = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor']

export function BedManagement() {
  const toast = useToast()
  const [beds, setBeds] = useState<Bed[]>([])
  const [search, setSearch] = useState('')
  const [filterWard, setFilterWard] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [editingBed, setEditingBed] = useState<Bed | null>(null)
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null)

  const [bedForm, setBedForm] = useState({
    bedNumber: '',
    ward: '',
    floor: '',
    type: 'STANDARD' as Bed['type'],
    notes: '',
  })

  const [assignForm, setAssignForm] = useState({
    patientId: '',
    patientName: '',
    admissionDate: format(new Date(), 'yyyy-MM-dd'),
    expectedDischarge: '',
  })

  useEffect(() => {
    const stored = localStorage.getItem('hospital_beds')
    if (stored) {
      setBeds(JSON.parse(stored))
    } else {
      // Initialize with sample beds
      const sampleBeds: Bed[] = [
        { id: '1', bedNumber: 'A-101', ward: 'General Ward A', floor: '1st Floor', type: 'STANDARD', status: 'AVAILABLE' },
        { id: '2', bedNumber: 'A-102', ward: 'General Ward A', floor: '1st Floor', type: 'STANDARD', status: 'OCCUPIED', patientName: 'John Doe', admissionDate: '2024-01-15' },
        { id: '3', bedNumber: 'ICU-01', ward: 'ICU', floor: '2nd Floor', type: 'ICU', status: 'OCCUPIED', patientName: 'Jane Smith', admissionDate: '2024-01-18' },
        { id: '4', bedNumber: 'ICU-02', ward: 'ICU', floor: '2nd Floor', type: 'ICU', status: 'AVAILABLE' },
        { id: '5', bedNumber: 'P-201', ward: 'Pediatric', floor: '2nd Floor', type: 'PEDIATRIC', status: 'MAINTENANCE', notes: 'Equipment repair' },
        { id: '6', bedNumber: 'M-101', ward: 'Maternity', floor: '1st Floor', type: 'MATERNITY', status: 'RESERVED', patientName: 'Sarah Johnson', expectedDischarge: '2024-01-25' },
      ]
      setBeds(sampleBeds)
      localStorage.setItem('hospital_beds', JSON.stringify(sampleBeds))
    }
  }, [])

  const saveBeds = (newBeds: Bed[]) => {
    localStorage.setItem('hospital_beds', JSON.stringify(newBeds))
    setBeds(newBeds)
  }

  const resetBedForm = () => {
    setBedForm({
      bedNumber: '',
      ward: '',
      floor: '',
      type: 'STANDARD',
      notes: '',
    })
  }

  const resetAssignForm = () => {
    setAssignForm({
      patientId: '',
      patientName: '',
      admissionDate: format(new Date(), 'yyyy-MM-dd'),
      expectedDischarge: '',
    })
  }

  const handleSaveBed = () => {
    if (!bedForm.bedNumber || !bedForm.ward || !bedForm.floor) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    if (editingBed) {
      const updated = beds.map(b => {
        if (b.id === editingBed.id) {
          return { ...b, ...bedForm }
        }
        return b
      })
      saveBeds(updated)
      toast.success('Updated', 'Bed information updated')
    } else {
      const newBed: Bed = {
        id: crypto.randomUUID(),
        ...bedForm,
        status: 'AVAILABLE',
      }
      saveBeds([...beds, newBed])
      toast.success('Added', 'New bed added')
    }

    setShowAddDialog(false)
    setEditingBed(null)
    resetBedForm()
  }

  const handleEditBed = (bed: Bed) => {
    setEditingBed(bed)
    setBedForm({
      bedNumber: bed.bedNumber,
      ward: bed.ward,
      floor: bed.floor,
      type: bed.type,
      notes: bed.notes || '',
    })
    setShowAddDialog(true)
  }

  const handleDeleteBed = (id: string) => {
    const bed = beds.find(b => b.id === id)
    if (bed?.status === 'OCCUPIED') {
      toast.error('Error', 'Cannot delete an occupied bed')
      return
    }
    const updated = beds.filter(b => b.id !== id)
    saveBeds(updated)
    toast.success('Deleted', 'Bed removed')
  }

  const handleAssignPatient = () => {
    if (!selectedBed || !assignForm.patientName) {
      toast.error('Error', 'Please enter patient name')
      return
    }

    const updated = beds.map(b => {
      if (b.id === selectedBed.id) {
        return {
          ...b,
          status: 'OCCUPIED' as const,
          patientId: assignForm.patientId ? parseInt(assignForm.patientId) : undefined,
          patientName: assignForm.patientName,
          admissionDate: assignForm.admissionDate,
          expectedDischarge: assignForm.expectedDischarge,
        }
      }
      return b
    })
    saveBeds(updated)
    toast.success('Assigned', `Patient assigned to bed ${selectedBed.bedNumber}`)
    setShowAssignDialog(false)
    setSelectedBed(null)
    resetAssignForm()
  }

  const handleDischargePatient = (bedId: string) => {
    const updated = beds.map(b => {
      if (b.id === bedId) {
        return {
          ...b,
          status: 'AVAILABLE' as const,
          patientId: undefined,
          patientName: undefined,
          admissionDate: undefined,
          expectedDischarge: undefined,
        }
      }
      return b
    })
    saveBeds(updated)
    toast.success('Discharged', 'Patient discharged and bed is now available')
  }

  const openAssignDialog = (bed: Bed) => {
    setSelectedBed(bed)
    setShowAssignDialog(true)
  }

  const filteredBeds = beds.filter(bed => {
    const matchesSearch = bed.bedNumber.toLowerCase().includes(search.toLowerCase()) ||
      bed.patientName?.toLowerCase().includes(search.toLowerCase())
    const matchesWard = filterWard === 'all' || bed.ward === filterWard
    const matchesStatus = filterStatus === 'all' || bed.status === filterStatus
    return matchesSearch && matchesWard && matchesStatus
  })

  const stats = {
    total: beds.length,
    available: beds.filter(b => b.status === 'AVAILABLE').length,
    occupied: beds.filter(b => b.status === 'OCCUPIED').length,
    maintenance: beds.filter(b => b.status === 'MAINTENANCE').length,
    reserved: beds.filter(b => b.status === 'RESERVED').length,
  }

  const occupancyRate = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0

  const getStatusIcon = (status: Bed['status']) => {
    switch (status) {
      case 'AVAILABLE': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'OCCUPIED': return <BedDouble className="h-4 w-4 text-blue-500" />
      case 'MAINTENANCE': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'RESERVED': return <Clock className="h-4 w-4 text-purple-500" />
    }
  }

  const getStatusBadge = (status: Bed['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Available</Badge>
      case 'OCCUPIED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Occupied</Badge>
      case 'MAINTENANCE':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Maintenance</Badge>
      case 'RESERVED':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Reserved</Badge>
    }
  }

  const getTypeBadge = (type: Bed['type']) => {
    switch (type) {
      case 'ICU':
        return <Badge variant="destructive">ICU</Badge>
      case 'PRIVATE':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700">Private</Badge>
      case 'SEMI_PRIVATE':
        return <Badge variant="outline">Semi-Private</Badge>
      case 'PEDIATRIC':
        return <Badge variant="outline" className="bg-pink-50 text-pink-700">Pediatric</Badge>
      case 'MATERNITY':
        return <Badge variant="outline" className="bg-rose-50 text-rose-700">Maternity</Badge>
      default:
        return <Badge variant="secondary">Standard</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Beds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.available}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Occupied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.occupied}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{stats.maintenance}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <div className="h-2 bg-gray-100 rounded-full mt-2">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search beds or patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterWard} onValueChange={setFilterWard}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ward" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Wards</SelectItem>
              {WARDS.map(ward => (
                <SelectItem key={ward} value={ward}>{ward}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="OCCUPIED">Occupied</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="RESERVED">Reserved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bed
        </Button>
      </div>

      {/* Beds Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {filteredBeds.map((bed) => (
            <motion.div
              key={bed.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
            >
              <Card className={`${bed.status === 'OCCUPIED' ? 'border-blue-200' : bed.status === 'AVAILABLE' ? 'border-green-200' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(bed.status)}
                      <CardTitle className="text-lg">{bed.bedNumber}</CardTitle>
                    </div>
                    {getTypeBadge(bed.type)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-4 w-4" />
                    <span>{bed.ward} • {bed.floor}</span>
                  </div>

                  {getStatusBadge(bed.status)}

                  {bed.patientName && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                      <p className="font-medium text-sm">{bed.patientName}</p>
                      {bed.admissionDate && (
                        <p className="text-xs text-muted-foreground">
                          Admitted: {format(new Date(bed.admissionDate), 'MMM d, yyyy')}
                        </p>
                      )}
                      {bed.expectedDischarge && (
                        <p className="text-xs text-muted-foreground">
                          Expected discharge: {format(new Date(bed.expectedDischarge), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  )}

                  {bed.notes && (
                    <p className="text-xs text-muted-foreground">{bed.notes}</p>
                  )}

                  <div className="flex gap-2 pt-2">
                    {bed.status === 'AVAILABLE' && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => openAssignDialog(bed)}>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    )}
                    {bed.status === 'OCCUPIED' && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDischargePatient(bed.id)}>
                        <UserMinus className="h-4 w-4 mr-1" />
                        Discharge
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleEditBed(bed)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => handleDeleteBed(bed.id)}
                      disabled={bed.status === 'OCCUPIED'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredBeds.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BedDouble className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No beds found</p>
            {(search || filterWard !== 'all' || filterStatus !== 'all') && (
              <Button variant="link" onClick={() => {
                setSearch('')
                setFilterWard('all')
                setFilterStatus('all')
              }}>
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Bed Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open)
        if (!open) {
          setEditingBed(null)
          resetBedForm()
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingBed ? 'Edit Bed' : 'Add New Bed'}</DialogTitle>
            <DialogDescription>
              {editingBed ? 'Update bed information' : 'Add a new bed to the hospital'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bed Number *</Label>
              <Input
                value={bedForm.bedNumber}
                onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                placeholder="e.g., A-101"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ward *</Label>
                <Select
                  value={bedForm.ward}
                  onValueChange={(value) => setBedForm({ ...bedForm, ward: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {WARDS.map(ward => (
                      <SelectItem key={ward} value={ward}>{ward}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Floor *</Label>
                <Select
                  value={bedForm.floor}
                  onValueChange={(value) => setBedForm({ ...bedForm, floor: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select floor" />
                  </SelectTrigger>
                  <SelectContent>
                    {FLOORS.map(floor => (
                      <SelectItem key={floor} value={floor}>{floor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bed Type</Label>
              <Select
                value={bedForm.type}
                onValueChange={(value: Bed['type']) => setBedForm({ ...bedForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="ICU">ICU</SelectItem>
                  <SelectItem value="PRIVATE">Private</SelectItem>
                  <SelectItem value="SEMI_PRIVATE">Semi-Private</SelectItem>
                  <SelectItem value="PEDIATRIC">Pediatric</SelectItem>
                  <SelectItem value="MATERNITY">Maternity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={bedForm.notes}
                onChange={(e) => setBedForm({ ...bedForm, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false)
              setEditingBed(null)
              resetBedForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveBed}>
              {editingBed ? 'Update' : 'Add Bed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Patient Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={(open) => {
        setShowAssignDialog(open)
        if (!open) {
          setSelectedBed(null)
          resetAssignForm()
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Assign Patient to Bed {selectedBed?.bedNumber}</DialogTitle>
            <DialogDescription>
              Enter patient information for bed assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Patient ID (optional)</Label>
              <Input
                type="number"
                value={assignForm.patientId}
                onChange={(e) => setAssignForm({ ...assignForm, patientId: e.target.value })}
                placeholder="Enter patient ID"
              />
            </div>

            <div className="space-y-2">
              <Label>Patient Name *</Label>
              <Input
                value={assignForm.patientName}
                onChange={(e) => setAssignForm({ ...assignForm, patientName: e.target.value })}
                placeholder="Enter patient name"
              />
            </div>

            <div className="space-y-2">
              <Label>Admission Date</Label>
              <Input
                type="date"
                value={assignForm.admissionDate}
                onChange={(e) => setAssignForm({ ...assignForm, admissionDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Expected Discharge Date</Label>
              <Input
                type="date"
                value={assignForm.expectedDischarge}
                onChange={(e) => setAssignForm({ ...assignForm, expectedDischarge: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAssignDialog(false)
              setSelectedBed(null)
              resetAssignForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleAssignPatient}>
              Assign Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
