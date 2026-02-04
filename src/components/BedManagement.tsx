import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, differenceInDays } from 'date-fns'
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
  Users,
  Sparkles,
  LayoutGrid,
  List,
  ChevronRight,
  Calendar,
  Wrench,
  HeartPulse,
  Baby,
  Heart,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface Bed {
  id: string
  bedNumber: string
  ward: string
  floor: string
  type: 'STANDARD' | 'ICU' | 'PRIVATE' | 'SEMI_PRIVATE' | 'PEDIATRIC' | 'MATERNITY'
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED'
  patientId?: number
  patientName?: string
  patientAge?: number
  patientDiagnosis?: string
  admissionDate?: string
  expectedDischarge?: string
  notes?: string
  createdAt?: string
}

const WARDS = [
  { name: 'General Ward A', icon: '🏥', color: 'blue' },
  { name: 'General Ward B', icon: '🏥', color: 'blue' },
  { name: 'ICU', icon: '🚨', color: 'red' },
  { name: 'NICU', icon: '👶', color: 'pink' },
  { name: 'CCU', icon: '❤️', color: 'rose' },
  { name: 'Emergency', icon: '🚑', color: 'orange' },
  { name: 'Maternity', icon: '🤰', color: 'purple' },
  { name: 'Pediatric', icon: '🧒', color: 'cyan' },
  { name: 'Surgical', icon: '🔪', color: 'indigo' },
  { name: 'Orthopedic', icon: '🦴', color: 'amber' },
  { name: 'Oncology', icon: '🎗️', color: 'violet' },
]

const FLOORS = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor']

const BED_TYPES = [
  { value: 'STANDARD', label: 'Standard', icon: BedDouble, color: 'slate' },
  { value: 'ICU', label: 'ICU', icon: HeartPulse, color: 'red' },
  { value: 'PRIVATE', label: 'Private', icon: Sparkles, color: 'amber' },
  { value: 'SEMI_PRIVATE', label: 'Semi-Private', icon: Users, color: 'blue' },
  { value: 'PEDIATRIC', label: 'Pediatric', icon: Baby, color: 'pink' },
  { value: 'MATERNITY', label: 'Maternity', icon: Heart, color: 'rose' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function BedManagement() {
  const toast = useToast()
  const [beds, setBeds] = useState<Bed[]>([])
  const [search, setSearch] = useState('')
  const [filterWard, setFilterWard] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [editingBed, setEditingBed] = useState<Bed | null>(null)
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null)
  const [viewingBed, setViewingBed] = useState<Bed | null>(null)

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
    patientAge: '',
    patientDiagnosis: '',
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
        { id: '1', bedNumber: 'A-101', ward: 'General Ward A', floor: '1st Floor', type: 'STANDARD', status: 'AVAILABLE', createdAt: new Date().toISOString() },
        { id: '2', bedNumber: 'A-102', ward: 'General Ward A', floor: '1st Floor', type: 'STANDARD', status: 'OCCUPIED', patientName: 'John Doe', patientAge: 45, patientDiagnosis: 'Pneumonia', admissionDate: '2024-01-15', createdAt: new Date().toISOString() },
        { id: '3', bedNumber: 'ICU-01', ward: 'ICU', floor: '2nd Floor', type: 'ICU', status: 'OCCUPIED', patientName: 'Jane Smith', patientAge: 62, patientDiagnosis: 'Post-Surgery Care', admissionDate: '2024-01-18', createdAt: new Date().toISOString() },
        { id: '4', bedNumber: 'ICU-02', ward: 'ICU', floor: '2nd Floor', type: 'ICU', status: 'AVAILABLE', createdAt: new Date().toISOString() },
        { id: '5', bedNumber: 'P-201', ward: 'Pediatric', floor: '2nd Floor', type: 'PEDIATRIC', status: 'MAINTENANCE', notes: 'Equipment repair scheduled', createdAt: new Date().toISOString() },
        { id: '6', bedNumber: 'M-101', ward: 'Maternity', floor: '1st Floor', type: 'MATERNITY', status: 'RESERVED', patientName: 'Sarah Johnson', expectedDischarge: '2024-01-25', createdAt: new Date().toISOString() },
        { id: '7', bedNumber: 'A-103', ward: 'General Ward A', floor: '1st Floor', type: 'STANDARD', status: 'OCCUPIED', patientName: 'Michael Brown', patientAge: 38, admissionDate: '2024-01-20', createdAt: new Date().toISOString() },
        { id: '8', bedNumber: 'E-001', ward: 'Emergency', floor: 'Ground Floor', type: 'STANDARD', status: 'AVAILABLE', createdAt: new Date().toISOString() },
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
      patientAge: '',
      patientDiagnosis: '',
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
        createdAt: new Date().toISOString(),
      }
      saveBeds([...beds, newBed])
      toast.success('Added', 'New bed added to the system')
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
    toast.success('Deleted', 'Bed removed from the system')
    setViewingBed(null)
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
          patientAge: assignForm.patientAge ? parseInt(assignForm.patientAge) : undefined,
          patientDiagnosis: assignForm.patientDiagnosis,
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
          patientAge: undefined,
          patientDiagnosis: undefined,
          admissionDate: undefined,
          expectedDischarge: undefined,
        }
      }
      return b
    })
    saveBeds(updated)
    toast.success('Discharged', 'Patient discharged and bed is now available')
    setViewingBed(null)
  }

  const handleSetMaintenance = (bedId: string) => {
    const updated = beds.map(b => {
      if (b.id === bedId) {
        return {
          ...b,
          status: 'MAINTENANCE' as const,
        }
      }
      return b
    })
    saveBeds(updated)
    toast.info('Maintenance', 'Bed set to maintenance mode')
  }

  const handleSetAvailable = (bedId: string) => {
    const updated = beds.map(b => {
      if (b.id === bedId) {
        return {
          ...b,
          status: 'AVAILABLE' as const,
          notes: undefined,
        }
      }
      return b
    })
    saveBeds(updated)
    toast.success('Available', 'Bed is now available')
  }

  const openAssignDialog = (bed: Bed) => {
    setSelectedBed(bed)
    setShowAssignDialog(true)
  }

  const filteredBeds = useMemo(() => {
    return beds.filter(bed => {
      const matchesSearch = bed.bedNumber.toLowerCase().includes(search.toLowerCase()) ||
        bed.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        bed.ward.toLowerCase().includes(search.toLowerCase())
      const matchesWard = filterWard === 'all' || bed.ward === filterWard
      const matchesStatus = filterStatus === 'all' || bed.status === filterStatus
      const matchesType = filterType === 'all' || bed.type === filterType
      return matchesSearch && matchesWard && matchesStatus && matchesType
    })
  }, [beds, search, filterWard, filterStatus, filterType])

  const stats = useMemo(() => {
    return {
      total: beds.length,
      available: beds.filter(b => b.status === 'AVAILABLE').length,
      occupied: beds.filter(b => b.status === 'OCCUPIED').length,
      maintenance: beds.filter(b => b.status === 'MAINTENANCE').length,
      reserved: beds.filter(b => b.status === 'RESERVED').length,
    }
  }, [beds])

  const occupancyRate = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0

  const getWardInfo = (wardName: string) => {
    return WARDS.find(w => w.name === wardName) || { name: wardName, icon: '🏥', color: 'gray' }
  }

  const getBedTypeInfo = (type: Bed['type']) => {
    return BED_TYPES.find(t => t.value === type) || BED_TYPES[0]
  }

  const getStatusConfig = (status: Bed['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return { icon: CheckCircle, label: 'Available', color: 'emerald', bgClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' }
      case 'OCCUPIED':
        return { icon: Users, label: 'Occupied', color: 'blue', bgClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
      case 'MAINTENANCE':
        return { icon: Wrench, label: 'Maintenance', color: 'amber', bgClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
      case 'RESERVED':
        return { icon: Clock, label: 'Reserved', color: 'violet', bgClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' }
    }
  }

  const getDaysInHospital = (admissionDate?: string) => {
    if (!admissionDate) return null
    return differenceInDays(new Date(), new Date(admissionDate))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <BedDouble className="h-7 w-7" />
            </div>
            Bed Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Monitor and manage hospital bed allocation
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="shadow-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Bed
        </Button>
      </div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 grid-cols-2 lg:grid-cols-5"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Beds</p>
                  <p className="text-3xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 text-white">
                  <BedDouble className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available</p>
                  <p className="text-3xl font-bold mt-1 text-emerald-600">{stats.available}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Occupied</p>
                  <p className="text-3xl font-bold mt-1 text-blue-600">{stats.occupied}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Maintenance</p>
                  <p className="text-3xl font-bold mt-1 text-amber-600">{stats.maintenance}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                  <Wrench className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all col-span-2 lg:col-span-1">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Occupancy Rate</p>
                <span className="text-2xl font-bold">{occupancyRate}%</span>
              </div>
              <Progress
                value={occupancyRate}
                className={cn(
                  "h-2",
                  occupancyRate >= 90 && "[&>div]:bg-red-500",
                  occupancyRate >= 70 && occupancyRate < 90 && "[&>div]:bg-amber-500",
                  occupancyRate < 70 && "[&>div]:bg-emerald-500"
                )}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {stats.available} beds available
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters and Actions */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 shadow-sm"
                  placeholder="Search beds, patients, wards..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={filterWard} onValueChange={setFilterWard}>
                <SelectTrigger className="w-[160px] shadow-sm">
                  <Building className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Ward" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  {WARDS.map(ward => (
                    <SelectItem key={ward.name} value={ward.name}>
                      <span className="flex items-center gap-2">
                        <span>{ward.icon}</span>
                        {ward.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] shadow-sm">
                  <Filter className="h-4 w-4 mr-2" />
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
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] shadow-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {BED_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex border rounded-md overflow-hidden shadow-sm">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Beds Display */}
      {filteredBeds.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <BedDouble className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Beds Found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {beds.length === 0
                ? 'No beds in the system yet. Add your first bed to get started.'
                : 'No beds match your current filters. Try adjusting your search.'}
            </p>
            {search || filterWard !== 'all' || filterStatus !== 'all' || filterType !== 'all' ? (
              <Button
                variant="link"
                onClick={() => {
                  setSearch('')
                  setFilterWard('all')
                  setFilterStatus('all')
                  setFilterType('all')
                }}
              >
                Clear all filters
              </Button>
            ) : (
              <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Bed
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredBeds.map((bed) => {
              const statusConfig = getStatusConfig(bed.status)
              const wardInfo = getWardInfo(bed.ward)
              const typeInfo = getBedTypeInfo(bed.type)
              const TypeIcon = typeInfo.icon
              const StatusIcon = statusConfig.icon

              return (
                <motion.div
                  key={bed.id}
                  variants={itemVariants}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card
                    className={cn(
                      "border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group overflow-hidden",
                      bed.status === 'OCCUPIED' && "ring-1 ring-blue-200 dark:ring-blue-800",
                      bed.status === 'AVAILABLE' && "ring-1 ring-emerald-200 dark:ring-emerald-800",
                      bed.status === 'MAINTENANCE' && "ring-1 ring-amber-200 dark:ring-amber-800"
                    )}
                    onClick={() => setViewingBed(bed)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "p-2 rounded-lg",
                            bed.status === 'AVAILABLE' && "bg-emerald-100 dark:bg-emerald-900/30",
                            bed.status === 'OCCUPIED' && "bg-blue-100 dark:bg-blue-900/30",
                            bed.status === 'MAINTENANCE' && "bg-amber-100 dark:bg-amber-900/30",
                            bed.status === 'RESERVED' && "bg-violet-100 dark:bg-violet-900/30"
                          )}>
                            <StatusIcon className={cn(
                              "h-5 w-5",
                              bed.status === 'AVAILABLE' && "text-emerald-600",
                              bed.status === 'OCCUPIED' && "text-blue-600",
                              bed.status === 'MAINTENANCE' && "text-amber-600",
                              bed.status === 'RESERVED' && "text-violet-600"
                            )} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{bed.bedNumber}</CardTitle>
                            <p className="text-xs text-muted-foreground">{bed.floor}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs gap-1">
                          <TypeIcon className="h-3 w-3" />
                          {typeInfo.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{wardInfo.icon}</span>
                        <span className="truncate">{bed.ward}</span>
                      </div>

                      <Badge className={cn("text-xs", statusConfig.bgClass)}>
                        {statusConfig.label}
                      </Badge>

                      {bed.patientName && (
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{bed.patientName}</span>
                            {bed.patientAge && (
                              <span className="text-xs text-muted-foreground">({bed.patientAge}y)</span>
                            )}
                          </div>
                          {bed.admissionDate && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Day {getDaysInHospital(bed.admissionDate)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {bed.notes && (
                        <p className="text-xs text-muted-foreground truncate">{bed.notes}</p>
                      )}

                      <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
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
                        {bed.status === 'MAINTENANCE' && (
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => handleSetAvailable(bed.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Set Available
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleEditBed(bed)} className="px-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <Card className="border-0 shadow-md overflow-hidden">
          <ScrollArea className="h-[600px]">
            <div className="divide-y">
              {filteredBeds.map((bed) => {
                const statusConfig = getStatusConfig(bed.status)
                const wardInfo = getWardInfo(bed.ward)
                const typeInfo = getBedTypeInfo(bed.type)
                const TypeIcon = typeInfo.icon
                const StatusIcon = statusConfig.icon

                return (
                  <motion.div
                    key={bed.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => setViewingBed(bed)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl",
                        bed.status === 'AVAILABLE' && "bg-emerald-100 dark:bg-emerald-900/30",
                        bed.status === 'OCCUPIED' && "bg-blue-100 dark:bg-blue-900/30",
                        bed.status === 'MAINTENANCE' && "bg-amber-100 dark:bg-amber-900/30",
                        bed.status === 'RESERVED' && "bg-violet-100 dark:bg-violet-900/30"
                      )}>
                        <StatusIcon className={cn(
                          "h-6 w-6",
                          bed.status === 'AVAILABLE' && "text-emerald-600",
                          bed.status === 'OCCUPIED' && "text-blue-600",
                          bed.status === 'MAINTENANCE' && "text-amber-600",
                          bed.status === 'RESERVED' && "text-violet-600"
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{bed.bedNumber}</h4>
                          <Badge variant="outline" className="text-xs gap-1">
                            <TypeIcon className="h-3 w-3" />
                            {typeInfo.label}
                          </Badge>
                          <Badge className={cn("text-xs", statusConfig.bgClass)}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <span>{wardInfo.icon}</span>
                            {bed.ward}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {bed.floor}
                          </span>
                        </div>
                      </div>

                      {bed.patientName && (
                        <div className="text-right mr-4">
                          <p className="font-medium text-sm">{bed.patientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {bed.admissionDate && `Day ${getDaysInHospital(bed.admissionDate)}`}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        {bed.status === 'AVAILABLE' && (
                          <Button size="sm" variant="ghost" onClick={() => openAssignDialog(bed)}>
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                        {bed.status === 'OCCUPIED' && (
                          <Button size="sm" variant="ghost" onClick={() => handleDischargePatient(bed.id)}>
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleEditBed(bed)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>

                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Bed Detail Sheet */}
      <Sheet open={!!viewingBed} onOpenChange={() => setViewingBed(null)}>
        <SheetContent className="sm:max-w-lg">
          {viewingBed && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-xl",
                    viewingBed.status === 'AVAILABLE' && "bg-emerald-100 dark:bg-emerald-900/30",
                    viewingBed.status === 'OCCUPIED' && "bg-blue-100 dark:bg-blue-900/30",
                    viewingBed.status === 'MAINTENANCE' && "bg-amber-100 dark:bg-amber-900/30",
                    viewingBed.status === 'RESERVED' && "bg-violet-100 dark:bg-violet-900/30"
                  )}>
                    <BedDouble className={cn(
                      "h-6 w-6",
                      viewingBed.status === 'AVAILABLE' && "text-emerald-600",
                      viewingBed.status === 'OCCUPIED' && "text-blue-600",
                      viewingBed.status === 'MAINTENANCE' && "text-amber-600",
                      viewingBed.status === 'RESERVED' && "text-violet-600"
                    )} />
                  </div>
                  <div>
                    <SheetTitle>Bed {viewingBed.bedNumber}</SheetTitle>
                    <SheetDescription>{viewingBed.ward} • {viewingBed.floor}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="details" className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4 space-y-4">
                  {/* Status Card */}
                  <Card className="border-0 shadow-sm bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Status</span>
                        <Badge className={getStatusConfig(viewingBed.status).bgClass}>
                          {getStatusConfig(viewingBed.status).label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bed Info */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Bed Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">{getBedTypeInfo(viewingBed.type).label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Ward:</span>
                        <span className="font-medium">{viewingBed.ward}</span>
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">{viewingBed.floor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Patient Info */}
                  {viewingBed.patientName && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Patient Information</h4>
                        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{viewingBed.patientName}</span>
                              {viewingBed.patientAge && (
                                <Badge variant="secondary">{viewingBed.patientAge} years</Badge>
                              )}
                            </div>
                            {viewingBed.patientDiagnosis && (
                              <p className="text-sm text-muted-foreground">{viewingBed.patientDiagnosis}</p>
                            )}
                            {viewingBed.admissionDate && (
                              <div className="flex items-center gap-4 text-sm pt-2">
                                <div>
                                  <p className="text-muted-foreground">Admitted</p>
                                  <p className="font-medium">{format(new Date(viewingBed.admissionDate), 'PP')}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Days</p>
                                  <p className="font-medium">{getDaysInHospital(viewingBed.admissionDate)}</p>
                                </div>
                              </div>
                            )}
                            {viewingBed.expectedDischarge && (
                              <div className="text-sm pt-2">
                                <p className="text-muted-foreground">Expected Discharge</p>
                                <p className="font-medium">{format(new Date(viewingBed.expectedDischarge), 'PP')}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}

                  {viewingBed.notes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Notes</h4>
                        <p className="text-sm bg-muted/30 p-3 rounded-lg">{viewingBed.notes}</p>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="mt-4 space-y-4">
                  <div className="grid gap-3">
                    {viewingBed.status === 'AVAILABLE' && (
                      <Button className="w-full justify-start gap-2" onClick={() => {
                        setViewingBed(null)
                        openAssignDialog(viewingBed)
                      }}>
                        <UserPlus className="h-4 w-4" />
                        Assign Patient
                      </Button>
                    )}
                    {viewingBed.status === 'OCCUPIED' && (
                      <Button className="w-full justify-start gap-2" variant="outline" onClick={() => handleDischargePatient(viewingBed.id)}>
                        <UserMinus className="h-4 w-4" />
                        Discharge Patient
                      </Button>
                    )}
                    {viewingBed.status === 'AVAILABLE' && (
                      <Button className="w-full justify-start gap-2" variant="outline" onClick={() => handleSetMaintenance(viewingBed.id)}>
                        <Wrench className="h-4 w-4" />
                        Set to Maintenance
                      </Button>
                    )}
                    {viewingBed.status === 'MAINTENANCE' && (
                      <Button className="w-full justify-start gap-2" onClick={() => handleSetAvailable(viewingBed.id)}>
                        <CheckCircle className="h-4 w-4" />
                        Mark as Available
                      </Button>
                    )}
                    <Separator />
                    <Button className="w-full justify-start gap-2" variant="outline" onClick={() => {
                      setViewingBed(null)
                      handleEditBed(viewingBed)
                    }}>
                      <Edit className="h-4 w-4" />
                      Edit Bed Info
                    </Button>
                    <Button
                      className="w-full justify-start gap-2"
                      variant="destructive"
                      onClick={() => handleDeleteBed(viewingBed.id)}
                      disabled={viewingBed.status === 'OCCUPIED'}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Bed
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add/Edit Bed Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open)
        if (!open) {
          setEditingBed(null)
          resetBedForm()
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingBed ? (
                <>
                  <Edit className="h-5 w-5 text-primary" />
                  Edit Bed
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-primary" />
                  Add New Bed
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingBed ? 'Update bed information' : 'Add a new bed to the hospital system'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bed Number <span className="text-red-500">*</span></Label>
              <Input
                value={bedForm.bedNumber}
                onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                placeholder="e.g., A-101, ICU-01"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ward <span className="text-red-500">*</span></Label>
                <Select
                  value={bedForm.ward}
                  onValueChange={(value) => setBedForm({ ...bedForm, ward: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {WARDS.map(ward => (
                      <SelectItem key={ward.name} value={ward.name}>
                        <span className="flex items-center gap-2">
                          <span>{ward.icon}</span>
                          {ward.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Floor <span className="text-red-500">*</span></Label>
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
                  {BED_TYPES.map(type => {
                    const TypeIcon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4" />
                          {type.label}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={bedForm.notes}
                onChange={(e) => setBedForm({ ...bedForm, notes: e.target.value })}
                placeholder="Additional notes about this bed..."
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
            <Button onClick={handleSaveBed} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
              {editingBed ? 'Update Bed' : 'Add Bed'}
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Assign Patient to Bed {selectedBed?.bedNumber}
            </DialogTitle>
            <DialogDescription>
              Enter patient information for bed assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient Name <span className="text-red-500">*</span></Label>
                <Input
                  value={assignForm.patientName}
                  onChange={(e) => setAssignForm({ ...assignForm, patientName: e.target.value })}
                  placeholder="Enter patient name"
                />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input
                  type="number"
                  value={assignForm.patientAge}
                  onChange={(e) => setAssignForm({ ...assignForm, patientAge: e.target.value })}
                  placeholder="Patient age"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Patient ID (optional)</Label>
              <Input
                type="number"
                value={assignForm.patientId}
                onChange={(e) => setAssignForm({ ...assignForm, patientId: e.target.value })}
                placeholder="Enter patient ID if known"
              />
            </div>

            <div className="space-y-2">
              <Label>Diagnosis/Reason for Admission</Label>
              <Textarea
                value={assignForm.patientDiagnosis}
                onChange={(e) => setAssignForm({ ...assignForm, patientDiagnosis: e.target.value })}
                placeholder="Brief description of condition"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Admission Date</Label>
                <Input
                  type="date"
                  value={assignForm.admissionDate}
                  onChange={(e) => setAssignForm({ ...assignForm, admissionDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Discharge</Label>
                <Input
                  type="date"
                  value={assignForm.expectedDischarge}
                  onChange={(e) => setAssignForm({ ...assignForm, expectedDischarge: e.target.value })}
                />
              </div>
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
            <Button onClick={handleAssignPatient} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
