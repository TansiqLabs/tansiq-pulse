import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, formatDistanceToNow, addDays, isPast, isFuture, differenceInDays } from 'date-fns'
import {
  Pill,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Clock,
  Calendar,
  Droplets,
  Sun,
  Moon,
  Sunrise,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Download,
  Printer,
  AlertCircle,
  Syringe,
  Wind,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface Prescription {
  id: string
  patientId: number
  medicationName: string
  dosage: string
  frequency: string
  route: string
  duration: string
  durationDays: number
  startDate: string
  endDate?: string
  instructions?: string
  prescribedBy: string
  isActive: boolean
  createdAt: string
  refills?: number
  refillsRemaining?: number
  lastRefillDate?: string
  category?: string
}

interface PrescriptionManagerProps {
  patientId: number
  patientName: string
}

const ROUTES = [
  { value: 'Oral', icon: Pill, color: 'blue' },
  { value: 'Topical', icon: Droplets, color: 'teal' },
  { value: 'Injection (IM)', icon: Syringe, color: 'red' },
  { value: 'Injection (IV)', icon: Syringe, color: 'red' },
  { value: 'Injection (SC)', icon: Syringe, color: 'red' },
  { value: 'Inhalation', icon: Wind, color: 'cyan' },
  { value: 'Sublingual', icon: Pill, color: 'purple' },
  { value: 'Rectal', icon: Pill, color: 'amber' },
  { value: 'Ophthalmic', icon: Droplets, color: 'indigo' },
  { value: 'Otic', icon: Droplets, color: 'pink' },
  { value: 'Nasal', icon: Wind, color: 'sky' },
  { value: 'Transdermal', icon: FileText, color: 'emerald' },
]

const FREQUENCIES = [
  { value: 'once_daily', label: 'Once daily (QD)', icon: Sun, times: 1 },
  { value: 'twice_daily', label: 'Twice daily (BID)', icon: Sunrise, times: 2 },
  { value: 'three_daily', label: 'Three times daily (TID)', icon: Clock, times: 3 },
  { value: 'four_daily', label: 'Four times daily (QID)', icon: Clock, times: 4 },
  { value: 'every_4h', label: 'Every 4 hours', icon: Clock, times: 6 },
  { value: 'every_6h', label: 'Every 6 hours', icon: Clock, times: 4 },
  { value: 'every_8h', label: 'Every 8 hours', icon: Clock, times: 3 },
  { value: 'every_12h', label: 'Every 12 hours', icon: Clock, times: 2 },
  { value: 'at_bedtime', label: 'At bedtime (HS)', icon: Moon, times: 1 },
  { value: 'before_meals', label: 'Before meals (AC)', icon: Droplets, times: 3 },
  { value: 'after_meals', label: 'After meals (PC)', icon: Droplets, times: 3 },
  { value: 'as_needed', label: 'As needed (PRN)', icon: AlertTriangle, times: 0 },
  { value: 'weekly', label: 'Weekly', icon: Calendar, times: 0 },
]

const DURATIONS = [
  { label: '3 days', days: 3 },
  { label: '5 days', days: 5 },
  { label: '7 days', days: 7 },
  { label: '10 days', days: 10 },
  { label: '14 days', days: 14 },
  { label: '21 days', days: 21 },
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
  { label: 'Ongoing', days: -1 },
]

const MEDICATION_CATEGORIES = [
  { name: 'Pain & Fever', color: 'red', emoji: '💊' },
  { name: 'Antibiotics', color: 'green', emoji: '🦠' },
  { name: 'Gastrointestinal', color: 'amber', emoji: '🫁' },
  { name: 'Cardiovascular', color: 'rose', emoji: '❤️' },
  { name: 'Diabetes', color: 'blue', emoji: '💉' },
  { name: 'Respiratory', color: 'cyan', emoji: '🌬️' },
  { name: 'Vitamins & Supplements', color: 'emerald', emoji: '🍊' },
  { name: 'Other', color: 'slate', emoji: '💊' },
]

const COMMON_MEDICATIONS: { name: string; category: string }[] = [
  // Pain & Fever
  { name: 'Paracetamol 500mg', category: 'Pain & Fever' },
  { name: 'Ibuprofen 400mg', category: 'Pain & Fever' },
  { name: 'Aspirin 100mg', category: 'Pain & Fever' },
  { name: 'Diclofenac 50mg', category: 'Pain & Fever' },
  { name: 'Tramadol 50mg', category: 'Pain & Fever' },
  // Antibiotics
  { name: 'Amoxicillin 500mg', category: 'Antibiotics' },
  { name: 'Azithromycin 250mg', category: 'Antibiotics' },
  { name: 'Ciprofloxacin 500mg', category: 'Antibiotics' },
  { name: 'Metronidazole 400mg', category: 'Antibiotics' },
  { name: 'Doxycycline 100mg', category: 'Antibiotics' },
  // GI
  { name: 'Omeprazole 20mg', category: 'Gastrointestinal' },
  { name: 'Pantoprazole 40mg', category: 'Gastrointestinal' },
  { name: 'Domperidone 10mg', category: 'Gastrointestinal' },
  { name: 'Ondansetron 4mg', category: 'Gastrointestinal' },
  { name: 'Ranitidine 150mg', category: 'Gastrointestinal' },
  // Cardiovascular
  { name: 'Amlodipine 5mg', category: 'Cardiovascular' },
  { name: 'Metoprolol 50mg', category: 'Cardiovascular' },
  { name: 'Atorvastatin 10mg', category: 'Cardiovascular' },
  { name: 'Aspirin 75mg', category: 'Cardiovascular' },
  { name: 'Lisinopril 10mg', category: 'Cardiovascular' },
  // Diabetes
  { name: 'Metformin 500mg', category: 'Diabetes' },
  { name: 'Glimepiride 2mg', category: 'Diabetes' },
  { name: 'Insulin (Various)', category: 'Diabetes' },
  // Respiratory
  { name: 'Salbutamol Inhaler', category: 'Respiratory' },
  { name: 'Montelukast 10mg', category: 'Respiratory' },
  { name: 'Cetirizine 10mg', category: 'Respiratory' },
  { name: 'Fluticasone Inhaler', category: 'Respiratory' },
  // Vitamins
  { name: 'Multivitamin', category: 'Vitamins & Supplements' },
  { name: 'Vitamin D3 1000IU', category: 'Vitamins & Supplements' },
  { name: 'Iron Supplement', category: 'Vitamins & Supplements' },
  { name: 'Calcium + Vitamin D', category: 'Vitamins & Supplements' },
  { name: 'Vitamin B12', category: 'Vitamins & Supplements' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function PrescriptionManager({ patientId, patientName }: PrescriptionManagerProps) {
  const toast = useToast()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null)
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const [formData, setFormData] = useState({
    medicationName: '',
    customMedication: '',
    dosage: '',
    frequency: '',
    route: 'Oral',
    duration: '',
    durationDays: 0,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    instructions: '',
    prescribedBy: '',
    refills: 0,
    category: '',
  })

  const loadPrescriptions = useCallback(() => {
    const stored = localStorage.getItem(`prescriptions_${patientId}`)
    if (stored) {
      setPrescriptions(JSON.parse(stored))
    }
  }, [patientId])

  useEffect(() => {
    loadPrescriptions()
  }, [loadPrescriptions])

  const savePrescriptions = (newPrescriptions: Prescription[]) => {
    localStorage.setItem(`prescriptions_${patientId}`, JSON.stringify(newPrescriptions))
    setPrescriptions(newPrescriptions)
  }

  const resetForm = () => {
    setFormData({
      medicationName: '',
      customMedication: '',
      dosage: '',
      frequency: '',
      route: 'Oral',
      duration: '',
      durationDays: 0,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      instructions: '',
      prescribedBy: '',
      refills: 0,
      category: '',
    })
  }

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter(p => {
      const matchesSearch = p.medicationName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = filterCategory === 'all' || p.category === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [prescriptions, searchQuery, filterCategory])

  const activePrescriptions = filteredPrescriptions.filter(p => p.isActive)
  const inactivePrescriptions = filteredPrescriptions.filter(p => !p.isActive)

  const stats = useMemo(() => {
    const active = prescriptions.filter(p => p.isActive)
    const expiringSoon = active.filter(p => {
      if (p.durationDays === -1) return false
      const endDate = addDays(new Date(p.startDate), p.durationDays)
      return isFuture(endDate) && differenceInDays(endDate, new Date()) <= 7
    })
    const needsRefill = active.filter(p => 
      p.refills && p.refillsRemaining !== undefined && p.refillsRemaining > 0 && p.refillsRemaining <= 1
    )
    return {
      total: prescriptions.length,
      active: active.length,
      discontinued: prescriptions.length - active.length,
      expiringSoon: expiringSoon.length,
      needsRefill: needsRefill.length,
    }
  }, [prescriptions])

  const handleSave = () => {
    const medication = formData.medicationName === 'custom'
      ? formData.customMedication
      : formData.medicationName

    if (!medication || !formData.frequency || !formData.duration || !formData.prescribedBy) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    const durationConfig = DURATIONS.find(d => d.label === formData.duration)
    const medInfo = COMMON_MEDICATIONS.find(m => m.name === medication)
    const endDate = durationConfig && durationConfig.days > 0
      ? addDays(new Date(formData.startDate), durationConfig.days).toISOString()
      : undefined

    if (editingPrescription) {
      const updated = prescriptions.map(p => {
        if (p.id === editingPrescription.id) {
          return {
            ...p,
            medicationName: medication,
            dosage: formData.dosage,
            frequency: formData.frequency,
            route: formData.route,
            duration: formData.duration,
            durationDays: durationConfig?.days || -1,
            startDate: formData.startDate,
            endDate,
            instructions: formData.instructions,
            prescribedBy: formData.prescribedBy,
            refills: formData.refills,
            refillsRemaining: formData.refills,
            category: formData.category || medInfo?.category || 'Other',
          }
        }
        return p
      })
      savePrescriptions(updated)
      toast.success('Updated', 'Prescription updated successfully')
    } else {
      const newPrescription: Prescription = {
        id: crypto.randomUUID(),
        patientId,
        medicationName: medication,
        dosage: formData.dosage,
        frequency: formData.frequency,
        route: formData.route,
        duration: formData.duration,
        durationDays: durationConfig?.days || -1,
        startDate: formData.startDate,
        endDate,
        instructions: formData.instructions,
        prescribedBy: formData.prescribedBy,
        isActive: true,
        createdAt: new Date().toISOString(),
        refills: formData.refills,
        refillsRemaining: formData.refills,
        category: formData.category || medInfo?.category || 'Other',
      }
      savePrescriptions([newPrescription, ...prescriptions])
      toast.success('Success', 'Prescription added successfully')
    }

    setShowAddDialog(false)
    setEditingPrescription(null)
    resetForm()
  }

  const handleEdit = (prescription: Prescription) => {
    setEditingPrescription(prescription)
    const isCommon = COMMON_MEDICATIONS.some(m => m.name === prescription.medicationName)
    setFormData({
      medicationName: isCommon ? prescription.medicationName : 'custom',
      customMedication: isCommon ? '' : prescription.medicationName,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      route: prescription.route,
      duration: prescription.duration,
      durationDays: prescription.durationDays,
      startDate: prescription.startDate.split('T')[0],
      instructions: prescription.instructions || '',
      prescribedBy: prescription.prescribedBy,
      refills: prescription.refills || 0,
      category: prescription.category || '',
    })
    setShowAddDialog(true)
  }

  const handleToggleActive = (id: string) => {
    const updated = prescriptions.map(p => {
      if (p.id === id) {
        return { ...p, isActive: !p.isActive }
      }
      return p
    })
    savePrescriptions(updated)
    const prescription = prescriptions.find(p => p.id === id)
    toast.success(
      prescription?.isActive ? 'Discontinued' : 'Reactivated',
      `${prescription?.medicationName} ${prescription?.isActive ? 'discontinued' : 'reactivated'}`
    )
  }

  const handleRefill = (id: string) => {
    const updated = prescriptions.map(p => {
      if (p.id === id && p.refillsRemaining && p.refillsRemaining > 0) {
        return {
          ...p,
          refillsRemaining: p.refillsRemaining - 1,
          lastRefillDate: new Date().toISOString(),
        }
      }
      return p
    })
    savePrescriptions(updated)
    toast.success('Refilled', 'Prescription refilled successfully')
  }

  const handleDelete = (id: string) => {
    const updated = prescriptions.filter(p => p.id !== id)
    savePrescriptions(updated)
    toast.success('Deleted', 'Prescription removed')
    setViewingPrescription(null)
  }

  const getFrequencyLabel = (value: string) => {
    return FREQUENCIES.find(f => f.value === value)?.label || value
  }

  const getFrequencyIcon = (value: string) => {
    const freq = FREQUENCIES.find(f => f.value === value)
    if (freq) {
      const Icon = freq.icon
      return <Icon className="h-4 w-4" />
    }
    return <Clock className="h-4 w-4" />
  }

  const getRouteInfo = (value: string) => {
    return ROUTES.find(r => r.value === value) || ROUTES[0]
  }

  const getCategoryInfo = (categoryName?: string) => {
    return MEDICATION_CATEGORIES.find(c => c.name === categoryName) || MEDICATION_CATEGORIES[MEDICATION_CATEGORIES.length - 1]
  }

  const getPrescriptionProgress = (prescription: Prescription) => {
    if (prescription.durationDays === -1) return -1
    const startDate = new Date(prescription.startDate)
    const totalDays = prescription.durationDays
    const elapsed = differenceInDays(new Date(), startDate)
    return Math.min(100, Math.max(0, (elapsed / totalDays) * 100))
  }

  const getPrescriptionStatus = (prescription: Prescription): { label: string; color: string; icon: typeof CheckCircle } => {
    if (!prescription.isActive) {
      return { label: 'Discontinued', color: 'slate', icon: XCircle }
    }
    if (prescription.durationDays === -1) {
      return { label: 'Ongoing', color: 'blue', icon: RefreshCw }
    }
    const endDate = addDays(new Date(prescription.startDate), prescription.durationDays)
    if (isPast(endDate)) {
      return { label: 'Completed', color: 'emerald', icon: CheckCircle }
    }
    const daysRemaining = differenceInDays(endDate, new Date())
    if (daysRemaining <= 3) {
      return { label: `${daysRemaining}d left`, color: 'red', icon: AlertCircle }
    }
    if (daysRemaining <= 7) {
      return { label: `${daysRemaining}d left`, color: 'amber', icon: Clock }
    }
    return { label: 'Active', color: 'emerald', icon: CheckCircle }
  }

  const exportPrescriptions = () => {
    const csv = [
      ['Medication', 'Dosage', 'Frequency', 'Route', 'Duration', 'Status', 'Prescribed By', 'Start Date'].join(','),
      ...prescriptions.map(p => [
        `"${p.medicationName}"`,
        p.dosage,
        getFrequencyLabel(p.frequency),
        p.route,
        p.duration,
        p.isActive ? 'Active' : 'Discontinued',
        `"${p.prescribedBy}"`,
        format(new Date(p.startDate), 'yyyy-MM-dd'),
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prescriptions_${patientName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
              <Pill className="h-5 w-5" />
            </div>
            Prescriptions
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {patientName} • {stats.active} active medications
          </p>
        </div>
        <div className="flex gap-2">
          {prescriptions.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportPrescriptions} className="shadow-sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          <Button size="sm" onClick={() => setShowAddDialog(true)} className="shadow-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Prescription
          </Button>
        </div>
      </div>

      {/* Stats */}
      {prescriptions.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Pill className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Discontinued</p>
                    <p className="text-2xl font-bold text-slate-600">{stats.discontinued}</p>
                  </div>
                  <XCircle className="h-5 w-5 text-slate-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className={cn(
              "border-0 shadow-sm hover:shadow-md transition-all",
              stats.expiringSoon > 0 && "ring-2 ring-amber-500/20"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Expiring Soon</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.expiringSoon}</p>
                  </div>
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className={cn(
              "border-0 shadow-sm hover:shadow-md transition-all",
              stats.needsRefill > 0 && "ring-2 ring-blue-500/20"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Needs Refill</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.needsRefill}</p>
                  </div>
                  <RefreshCw className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Filters */}
      {prescriptions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search medications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 shadow-sm"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px] shadow-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {MEDICATION_CATEGORIES.map(cat => (
                <SelectItem key={cat.name} value={cat.name}>
                  <span className="flex items-center gap-2">
                    {cat.emoji} {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Prescriptions List */}
      {prescriptions.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Pill className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Prescriptions</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              No medications have been prescribed for this patient yet.
            </p>
            <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Prescription
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Prescriptions */}
          {activePrescriptions.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              <AnimatePresence>
                {activePrescriptions.map((prescription) => {
                  const catInfo = getCategoryInfo(prescription.category)
                  const statusInfo = getPrescriptionStatus(prescription)
                  const StatusIcon = statusInfo.icon
                  const progress = getPrescriptionProgress(prescription)
                  const routeInfo = getRouteInfo(prescription.route)
                  const RouteIcon = routeInfo.icon

                  return (
                    <motion.div
                      key={prescription.id}
                      variants={itemVariants}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Card 
                        className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => setViewingPrescription(prescription)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "p-2.5 rounded-xl",
                                  `bg-${catInfo.color}-100 dark:bg-${catInfo.color}-900/30`
                                )}>
                                  <span className="text-xl">{catInfo.emoji}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-lg">{prescription.medicationName}</span>
                                    {prescription.dosage && (
                                      <Badge variant="outline" className="font-normal">{prescription.dosage}</Badge>
                                    )}
                                    <Badge className={cn(
                                      "gap-1",
                                      `bg-${statusInfo.color}-100 text-${statusInfo.color}-700 dark:bg-${statusInfo.color}-900/30 dark:text-${statusInfo.color}-400`
                                    )}>
                                      <StatusIcon className="h-3 w-3" />
                                      {statusInfo.label}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                      {getFrequencyIcon(prescription.frequency)}
                                      {getFrequencyLabel(prescription.frequency)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <RouteIcon className="h-4 w-4" />
                                      {prescription.route}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <Calendar className="h-4 w-4" />
                                      {prescription.duration}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Progress bar for timed prescriptions */}
                              {progress >= 0 && (
                                <div className="space-y-1">
                                  <Progress value={progress} className="h-1.5" />
                                  <p className="text-xs text-muted-foreground">
                                    {progress < 100
                                      ? `${Math.round(100 - progress)}% remaining`
                                      : 'Completed'}
                                  </p>
                                </div>
                              )}

                              {prescription.instructions && (
                                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-2.5 rounded-lg text-sm">
                                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                  <span>{prescription.instructions}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                  Prescribed by <span className="font-medium">{prescription.prescribedBy}</span> • {formatDistanceToNow(new Date(prescription.startDate), { addSuffix: true })}
                                </p>
                                {prescription.refills !== undefined && prescription.refills > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    {prescription.refillsRemaining} / {prescription.refills} refills
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(prescription)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {prescription.refillsRemaining !== undefined && prescription.refillsRemaining > 0 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRefill(prescription.id)}
                                  className="h-8 w-8 p-0"
                                  title="Refill"
                                >
                                  <RefreshCw className="h-4 w-4 text-blue-600" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleToggleActive(prescription.id)}
                                className="h-8 w-8 p-0"
                                title="Discontinue"
                              >
                                <XCircle className="h-4 w-4 text-amber-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDelete(prescription.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Inactive Prescriptions */}
          {inactivePrescriptions.length > 0 && (
            <Collapsible open={showInactive} onOpenChange={setShowInactive}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                  {showInactive ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Discontinued ({inactivePrescriptions.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {inactivePrescriptions.map((prescription) => (
                  <Card key={prescription.id} className="border-0 shadow-sm bg-muted/30 opacity-70">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Pill className="h-4 w-4 text-muted-foreground" />
                          <span className="line-through text-muted-foreground">{prescription.medicationName}</span>
                          {prescription.dosage && (
                            <Badge variant="outline" className="opacity-50 text-xs">{prescription.dosage}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(prescription.id)}
                            title="Reactivate"
                            className="h-7 w-7 p-0"
                          >
                            <Pill className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-500"
                            onClick={() => handleDelete(prescription.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}

      {/* Prescription Detail Sheet */}
      <Sheet open={!!viewingPrescription} onOpenChange={() => setViewingPrescription(null)}>
        <SheetContent className="sm:max-w-lg">
          {viewingPrescription && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  {(() => {
                    const catInfo = getCategoryInfo(viewingPrescription.category)
                    return (
                      <div className={cn(
                        "p-3 rounded-xl",
                        `bg-${catInfo.color}-100 dark:bg-${catInfo.color}-900/30`
                      )}>
                        <span className="text-2xl">{catInfo.emoji}</span>
                      </div>
                    )
                  })()}
                  <div>
                    <SheetTitle>{viewingPrescription.medicationName}</SheetTitle>
                    <SheetDescription>{viewingPrescription.category}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="details" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4 space-y-4">
                  <Card className="border-0 shadow-sm bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Status</span>
                        {(() => {
                          const statusInfo = getPrescriptionStatus(viewingPrescription)
                          const StatusIcon = statusInfo.icon
                          return (
                            <Badge className={cn(
                              "gap-1",
                              `bg-${statusInfo.color}-100 text-${statusInfo.color}-700 dark:bg-${statusInfo.color}-900/30 dark:text-${statusInfo.color}-400`
                            )}>
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                          )
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Medication Details</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Dosage</span>
                        <p className="font-medium">{viewingPrescription.dosage || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Route</span>
                        <p className="font-medium">{viewingPrescription.route}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Frequency</span>
                        <p className="font-medium">{getFrequencyLabel(viewingPrescription.frequency)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration</span>
                        <p className="font-medium">{viewingPrescription.duration}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Prescription Info</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Prescribed By</span>
                        <p className="font-medium">{viewingPrescription.prescribedBy}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Start Date</span>
                        <p className="font-medium">{format(new Date(viewingPrescription.startDate), 'PP')}</p>
                      </div>
                      {viewingPrescription.endDate && (
                        <div>
                          <span className="text-muted-foreground">End Date</span>
                          <p className="font-medium">{format(new Date(viewingPrescription.endDate), 'PP')}</p>
                        </div>
                      )}
                      {viewingPrescription.refills !== undefined && viewingPrescription.refills > 0 && (
                        <div>
                          <span className="text-muted-foreground">Refills</span>
                          <p className="font-medium">{viewingPrescription.refillsRemaining} / {viewingPrescription.refills}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {viewingPrescription.instructions && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Special Instructions</h4>
                        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-3 rounded-lg text-sm">
                          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>{viewingPrescription.instructions}</span>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="schedule" className="mt-4 space-y-4">
                  {(() => {
                    const progress = getPrescriptionProgress(viewingPrescription)
                    return (
                      <>
                        {progress >= 0 && (
                          <Card className="border-0 shadow-sm bg-muted/30">
                            <CardContent className="p-4 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Course Progress</span>
                                <span className="font-medium">{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </CardContent>
                          </Card>
                        )}

                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground">Dosing Schedule</h4>
                          <Card className="border-0 shadow-sm">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                {getFrequencyIcon(viewingPrescription.frequency)}
                                <div>
                                  <p className="font-medium">{getFrequencyLabel(viewingPrescription.frequency)}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {viewingPrescription.dosage ? `Take ${viewingPrescription.dosage}` : 'As prescribed'}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground">Timeline</h4>
                          <div className="relative pl-6 space-y-4">
                            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-muted" />
                            <div className="relative">
                              <div className="absolute left-[-20px] w-4 h-4 rounded-full bg-emerald-500 border-2 border-background" />
                              <div className="text-sm">
                                <p className="font-medium">Started</p>
                                <p className="text-muted-foreground">{format(new Date(viewingPrescription.startDate), 'PPP')}</p>
                              </div>
                            </div>
                            {viewingPrescription.lastRefillDate && (
                              <div className="relative">
                                <div className="absolute left-[-20px] w-4 h-4 rounded-full bg-blue-500 border-2 border-background" />
                                <div className="text-sm">
                                  <p className="font-medium">Last Refill</p>
                                  <p className="text-muted-foreground">{format(new Date(viewingPrescription.lastRefillDate), 'PPP')}</p>
                                </div>
                              </div>
                            )}
                            {viewingPrescription.endDate && (
                              <div className="relative">
                                <div className={cn(
                                  "absolute left-[-20px] w-4 h-4 rounded-full border-2 border-background",
                                  isPast(new Date(viewingPrescription.endDate)) ? "bg-slate-400" : "bg-amber-500"
                                )} />
                                <div className="text-sm">
                                  <p className="font-medium">{isPast(new Date(viewingPrescription.endDate)) ? 'Ended' : 'Ends'}</p>
                                  <p className="text-muted-foreground">{format(new Date(viewingPrescription.endDate), 'PPP')}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </TabsContent>

                <TabsContent value="actions" className="mt-4 space-y-4">
                  <div className="grid gap-3">
                    <Button className="w-full justify-start gap-2" onClick={() => {
                      setViewingPrescription(null)
                      handleEdit(viewingPrescription)
                    }}>
                      <Edit className="h-4 w-4" />
                      Edit Prescription
                    </Button>
                    {viewingPrescription.isActive && viewingPrescription.refillsRemaining !== undefined && viewingPrescription.refillsRemaining > 0 && (
                      <Button variant="outline" className="w-full justify-start gap-2" onClick={() => {
                        handleRefill(viewingPrescription.id)
                        setViewingPrescription({ ...viewingPrescription, refillsRemaining: (viewingPrescription.refillsRemaining || 1) - 1 })
                      }}>
                        <RefreshCw className="h-4 w-4" />
                        Refill Prescription ({viewingPrescription.refillsRemaining} remaining)
                      </Button>
                    )}
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Printer className="h-4 w-4" />
                      Print Prescription
                    </Button>
                    <Separator />
                    {viewingPrescription.isActive ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={() => {
                          handleToggleActive(viewingPrescription.id)
                          setViewingPrescription(null)
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                        Discontinue Medication
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => {
                          handleToggleActive(viewingPrescription.id)
                          setViewingPrescription(null)
                        }}
                      >
                        <Pill className="h-4 w-4" />
                        Reactivate Medication
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      className="w-full justify-start gap-2"
                      onClick={() => handleDelete(viewingPrescription.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Prescription
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open)
        if (!open) {
          setEditingPrescription(null)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              {editingPrescription ? 'Edit Prescription' : 'Add Prescription'}
            </DialogTitle>
            <DialogDescription>
              {editingPrescription ? 'Update prescription details' : `Prescribe medication for ${patientName}`}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="medication" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="medication">Medication</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="medication" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDICATION_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.name} value={cat.name}>
                          <span className="flex items-center gap-2">
                            {cat.emoji} {cat.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Medication <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.medicationName}
                    onValueChange={(value) => {
                      const medInfo = COMMON_MEDICATIONS.find(m => m.name === value)
                      setFormData({
                        ...formData,
                        medicationName: value,
                        category: medInfo?.category || formData.category,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select medication" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {(formData.category
                          ? COMMON_MEDICATIONS.filter(m => m.category === formData.category)
                          : COMMON_MEDICATIONS
                        ).map((med) => (
                          <SelectItem key={med.name} value={med.name}>{med.name}</SelectItem>
                        ))}
                        <SelectItem value="custom">Other (Custom)</SelectItem>
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  {formData.medicationName === 'custom' && (
                    <Input
                      className="mt-2"
                      value={formData.customMedication}
                      onChange={(e) => setFormData({ ...formData, customMedication: e.target.value })}
                      placeholder="Enter medication name & strength"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Dosage</Label>
                  <Input
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="e.g., 1 tablet, 5ml"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Route</Label>
                  <Select
                    value={formData.route}
                    onValueChange={(value) => setFormData({ ...formData, route: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUTES.map((route) => {
                        const Icon = route.icon
                        return (
                          <SelectItem key={route.value} value={route.value}>
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {route.value}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Special Instructions</Label>
                <Textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="e.g., Take with food, Avoid alcohol, etc."
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequency <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((freq) => {
                        const Icon = freq.icon
                        return (
                          <SelectItem key={freq.value} value={freq.value}>
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {freq.label}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) => {
                      const dur = DURATIONS.find(d => d.label === value)
                      setFormData({ ...formData, duration: value, durationDays: dur?.days || -1 })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map((dur) => (
                        <SelectItem key={dur.label} value={dur.label}>{dur.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Refills</Label>
                  <Select
                    value={String(formData.refills)}
                    onValueChange={(value) => setFormData({ ...formData, refills: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6].map((num) => (
                        <SelectItem key={num} value={String(num)}>
                          {num === 0 ? 'No refills' : `${num} refill${num > 1 ? 's' : ''}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prescribed By <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.prescribedBy}
                  onChange={(e) => setFormData({ ...formData, prescribedBy: e.target.value })}
                  placeholder="Doctor name"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false)
              setEditingPrescription(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              {editingPrescription ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Prescription
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
