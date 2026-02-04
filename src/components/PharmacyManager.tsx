import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, differenceInDays, isPast } from 'date-fns'
import {
  Pill,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  Package,
  Filter,
  ShoppingCart,
  Download,
  Grid3X3,
  List,
  ChevronRight,
  BadgeCheck,
  AlertCircle,
  TrendingDown,
  Calendar,
  MapPin,
  DollarSign,
  RotateCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
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
import { useToast } from '@/components/ui/toast'
import { formatCurrency, cn } from '@/lib/utils'

interface Medication {
  id: string
  name: string
  genericName: string
  category: string
  dosageForm: string
  strength: string
  manufacturer: string
  batchNumber: string
  expiryDate: string
  quantity: number
  reorderLevel: number
  unitPrice: number
  location: string
  controlled: boolean
  notes?: string
  createdAt: string
}

const CATEGORIES = [
  { name: 'Antibiotics', icon: '💊', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { name: 'Analgesics', icon: '💉', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { name: 'Antihistamines', icon: '🌡️', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { name: 'Antihypertensives', icon: '❤️', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  { name: 'Antidiabetics', icon: '🩸', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { name: 'Cardiovascular', icon: '🫀', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
  { name: 'Gastrointestinal', icon: '🧬', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { name: 'Respiratory', icon: '🫁', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
  { name: 'Vitamins & Supplements', icon: '✨', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { name: 'Vaccines', icon: '💉', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  { name: 'Emergency Medications', icon: '🚨', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { name: 'Controlled Substances', icon: '⚠️', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
]

const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Cream',
  'Ointment',
  'Drops',
  'Inhaler',
  'Patch',
  'Suppository',
]

const STORAGE_KEY = 'pharmacy_inventory'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function PharmacyManager() {
  const toast = useToast()
  const [medications, setMedications] = useState<Medication[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStock, setFilterStock] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [dispenseQty, setDispenseQty] = useState('1')

  const [form, setForm] = useState({
    name: '',
    genericName: '',
    category: '',
    dosageForm: '',
    strength: '',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    quantity: '',
    reorderLevel: '',
    unitPrice: '',
    location: '',
    controlled: false,
    notes: '',
  })

  const loadMedications = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setMedications(JSON.parse(stored))
    }
  }, [])

  const saveMedications = (data: Medication[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setMedications(data)
  }

  useEffect(() => {
    loadMedications()
  }, [loadMedications])

  const resetForm = () => {
    setForm({
      name: '',
      genericName: '',
      category: '',
      dosageForm: '',
      strength: '',
      manufacturer: '',
      batchNumber: '',
      expiryDate: '',
      quantity: '',
      reorderLevel: '',
      unitPrice: '',
      location: '',
      controlled: false,
      notes: '',
    })
  }

  const handleSubmit = () => {
    if (!form.name || !form.category || !form.quantity) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    if (editingMedication) {
      const updated = medications.map(m =>
        m.id === editingMedication.id
          ? {
              ...m,
              ...form,
              quantity: parseInt(form.quantity) || 0,
              reorderLevel: parseInt(form.reorderLevel) || 10,
              unitPrice: parseFloat(form.unitPrice) || 0,
            }
          : m
      )
      saveMedications(updated)
      toast.success('Updated', 'Medication updated successfully')
    } else {
      const newMedication: Medication = {
        id: `MED-${Date.now()}`,
        ...form,
        quantity: parseInt(form.quantity) || 0,
        reorderLevel: parseInt(form.reorderLevel) || 10,
        unitPrice: parseFloat(form.unitPrice) || 0,
        createdAt: new Date().toISOString(),
      }
      saveMedications([newMedication, ...medications])
      toast.success('Added', 'Medication added to inventory')
    }

    setShowAddDialog(false)
    setEditingMedication(null)
    resetForm()
  }

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication)
    setForm({
      name: medication.name,
      genericName: medication.genericName,
      category: medication.category,
      dosageForm: medication.dosageForm,
      strength: medication.strength,
      manufacturer: medication.manufacturer,
      batchNumber: medication.batchNumber,
      expiryDate: medication.expiryDate,
      quantity: medication.quantity.toString(),
      reorderLevel: medication.reorderLevel.toString(),
      unitPrice: medication.unitPrice.toString(),
      location: medication.location,
      controlled: medication.controlled,
      notes: medication.notes || '',
    })
    setShowAddDialog(true)
    setShowDetails(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this medication?')) {
      const updated = medications.filter(m => m.id !== id)
      saveMedications(updated)
      toast.success('Deleted', 'Medication removed from inventory')
      setShowDetails(false)
    }
  }

  const handleDispense = (id: string, qty: number) => {
    const updated = medications.map(m => {
      if (m.id === id) {
        const newQty = Math.max(0, m.quantity - qty)
        if (newQty <= m.reorderLevel) {
          toast.warning('Low Stock', `${m.name} is running low`)
        }
        return { ...m, quantity: newQty }
      }
      return m
    })
    saveMedications(updated)
    if (selectedMedication?.id === id) {
      setSelectedMedication({ ...selectedMedication, quantity: Math.max(0, selectedMedication.quantity - qty) })
    }
    toast.success('Dispensed', `${qty} unit(s) dispensed successfully`)
  }

  const handleRestock = (id: string, qty: number) => {
    const updated = medications.map(m => {
      if (m.id === id) {
        return { ...m, quantity: m.quantity + qty }
      }
      return m
    })
    saveMedications(updated)
    if (selectedMedication?.id === id) {
      setSelectedMedication({ ...selectedMedication, quantity: selectedMedication.quantity + qty })
    }
    toast.success('Restocked', `${qty} unit(s) added to inventory`)
  }

  const filteredMedications = useMemo(() => {
    return medications.filter(m => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.batchNumber.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = filterCategory === 'all' || m.category === filterCategory
      
      let matchesStock = true
      if (filterStock === 'low') {
        matchesStock = m.quantity <= m.reorderLevel && m.quantity > 0
      } else if (filterStock === 'out') {
        matchesStock = m.quantity === 0
      } else if (filterStock === 'expiring') {
        const expiryDate = new Date(m.expiryDate)
        const daysUntilExpiry = differenceInDays(expiryDate, new Date())
        matchesStock = daysUntilExpiry <= 30 && daysUntilExpiry > 0
      } else if (filterStock === 'expired') {
        matchesStock = isPast(new Date(m.expiryDate))
      }
      
      return matchesSearch && matchesCategory && matchesStock
    })
  }, [medications, searchQuery, filterCategory, filterStock])

  const getCategoryInfo = (categoryName: string) => {
    return CATEGORIES.find(c => c.name === categoryName) || { name: categoryName, icon: '💊', color: 'bg-gray-100 text-gray-700' }
  }

  const getStockStatus = (medication: Medication) => {
    if (medication.quantity === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', severity: 'critical' }
    }
    if (medication.quantity <= medication.reorderLevel) {
      return { label: 'Low Stock', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', severity: 'warning' }
    }
    return { label: 'In Stock', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', severity: 'good' }
  }

  const getExpiryStatus = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date())
    if (days < 0) return { label: 'Expired', color: 'text-red-600', urgent: true }
    if (days <= 30) return { label: `${days}d left`, color: 'text-amber-600', urgent: true }
    if (days <= 90) return { label: `${days}d left`, color: 'text-yellow-600', urgent: false }
    return { label: format(new Date(expiryDate), 'MMM yyyy'), color: 'text-muted-foreground', urgent: false }
  }

  const stats = useMemo(() => ({
    total: medications.length,
    lowStock: medications.filter(m => m.quantity <= m.reorderLevel && m.quantity > 0).length,
    outOfStock: medications.filter(m => m.quantity === 0).length,
    expiringSoon: medications.filter(m => {
      const days = differenceInDays(new Date(m.expiryDate), new Date())
      return days <= 30 && days > 0
    }).length,
    totalValue: medications.reduce((acc, m) => acc + (m.quantity * m.unitPrice), 0),
  }), [medications])

  const exportToCSV = () => {
    const headers = ['Name', 'Generic Name', 'Category', 'Quantity', 'Unit Price', 'Batch', 'Expiry', 'Location']
    const rows = medications.map(m => [
      m.name,
      m.genericName,
      m.category,
      m.quantity,
      m.unitPrice,
      m.batchNumber,
      m.expiryDate,
      m.location,
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pharmacy_inventory_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Pharmacy Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage medication inventory and dispensing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => { resetForm(); setEditingMedication(null); setShowAddDialog(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Medication
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 grid-cols-2 lg:grid-cols-5"
      >
        {[
          { label: 'Total Items', value: stats.total, icon: Package, color: 'from-blue-500 to-blue-600' },
          { label: 'Low Stock', value: stats.lowStock, icon: TrendingDown, color: 'from-amber-500 to-amber-600', alert: stats.lowStock > 0 },
          { label: 'Out of Stock', value: stats.outOfStock, icon: AlertCircle, color: 'from-red-500 to-red-600', alert: stats.outOfStock > 0 },
          { label: 'Expiring Soon', value: stats.expiringSoon, icon: Calendar, color: 'from-orange-500 to-orange-600', alert: stats.expiringSoon > 0 },
          { label: 'Total Value', value: formatCurrency(stats.totalValue), icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Card className={cn(
              "relative overflow-hidden border-0 shadow-md",
              stat.alert && "ring-2 ring-offset-2",
              stat.alert && stat.color.includes('red') && "ring-red-500",
              stat.alert && stat.color.includes('amber') && "ring-amber-500",
              stat.alert && stat.color.includes('orange') && "ring-orange-500"
            )}>
              <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", stat.color)} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={cn("p-2.5 rounded-xl bg-gradient-to-br text-white relative", stat.color)}>
                    <stat.icon className="h-5 w-5" />
                    {stat.alert && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-white rounded-full flex items-center justify-center">
                        <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, generic name, manufacturer, or batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-0"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px] bg-muted/50 border-0">
                  <Pill className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.name} value={cat.name}>
                      <span className="mr-2">{cat.icon}</span>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStock} onValueChange={setFilterStock}>
                <SelectTrigger className="w-[150px] bg-muted/50 border-0">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Separator orientation="vertical" className="h-8 hidden lg:block" />
              <div className="flex items-center border rounded-lg p-1 bg-muted/50">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medications List */}
      <AnimatePresence mode="wait">
        {filteredMedications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-0 shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Pill className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">No medications found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {medications.length === 0 ? 'Add your first medication to get started' : 'Try adjusting your search or filters'}
                </p>
                {medications.length === 0 && (
                  <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filteredMedications.map((medication) => {
              const categoryInfo = getCategoryInfo(medication.category)
              const stockStatus = getStockStatus(medication)
              const expiryStatus = getExpiryStatus(medication.expiryDate)
              const stockPercent = Math.min(100, (medication.quantity / (medication.reorderLevel * 3)) * 100)
              
              return (
                <motion.div key={medication.id} variants={item} layout>
                  <Card 
                    className={cn(
                      "group border-0 shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden",
                      stockStatus.severity === 'critical' && "ring-2 ring-red-500/50",
                      stockStatus.severity === 'warning' && "ring-2 ring-amber-500/50"
                    )}
                    onClick={() => { setSelectedMedication(medication); setShowDetails(true) }}
                  >
                    <CardContent className="p-0">
                      {/* Header */}
                      <div className={cn(
                        "h-3 bg-gradient-to-r",
                        stockStatus.severity === 'critical' ? 'from-red-500 to-red-400' :
                        stockStatus.severity === 'warning' ? 'from-amber-500 to-amber-400' :
                        'from-emerald-500 to-emerald-400'
                      )} />
                      
                      <div className="p-4 space-y-3">
                        {/* Title & Category */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-lg leading-tight truncate group-hover:text-primary transition-colors">
                              {medication.name}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">{medication.genericName}</p>
                          </div>
                          {medication.controlled && (
                            <Badge variant="destructive" className="shrink-0 text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Controlled
                            </Badge>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className={cn("text-xs", categoryInfo.color)}>
                            <span className="mr-1">{categoryInfo.icon}</span>
                            {medication.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {medication.dosageForm} • {medication.strength}
                          </Badge>
                        </div>

                        {/* Stock Info */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <Badge className={cn("text-xs", stockStatus.color)}>
                              {stockStatus.label}
                            </Badge>
                            <span className="font-bold">{medication.quantity} units</span>
                          </div>
                          <Progress 
                            value={stockPercent} 
                            className={cn(
                              "h-2",
                              stockStatus.severity === 'critical' && "[&>div]:bg-red-500",
                              stockStatus.severity === 'warning' && "[&>div]:bg-amber-500",
                              stockStatus.severity === 'good' && "[&>div]:bg-emerald-500"
                            )}
                          />
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span className={expiryStatus.color}>{expiryStatus.label}</span>
                          </div>
                          <span className="font-semibold text-foreground">{formatCurrency(medication.unitPrice)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="divide-y">
              {filteredMedications.map((medication) => {
                const categoryInfo = getCategoryInfo(medication.category)
                const stockStatus = getStockStatus(medication)
                
                return (
                  <motion.div
                    key={medication.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                      stockStatus.severity === 'critical' && "bg-red-50/50 dark:bg-red-950/20",
                      stockStatus.severity === 'warning' && "bg-amber-50/50 dark:bg-amber-950/20"
                    )}
                    onClick={() => { setSelectedMedication(medication); setShowDetails(true) }}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                      categoryInfo.color
                    )}>
                      {categoryInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{medication.name}</h3>
                        {medication.controlled && (
                          <Badge variant="destructive" className="text-xs">Controlled</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {medication.genericName} • {medication.dosageForm} {medication.strength}
                      </p>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Stock</p>
                        <p className="font-bold">{medication.quantity}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="font-bold">{formatCurrency(medication.unitPrice)}</p>
                      </div>
                    </div>
                    <Badge className={cn("text-xs", stockStatus.color)}>
                      {stockStatus.label}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
                )
              })}
            </div>
          </Card>
        )}
      </AnimatePresence>

      {/* Details Sheet */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedMedication && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center text-2xl",
                    getCategoryInfo(selectedMedication.category).color
                  )}>
                    {getCategoryInfo(selectedMedication.category).icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-xl truncate">{selectedMedication.name}</SheetTitle>
                    <SheetDescription className="truncate">{selectedMedication.genericName}</SheetDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={cn(getStockStatus(selectedMedication).color)}>
                        {getStockStatus(selectedMedication).label}
                      </Badge>
                      {selectedMedication.controlled && (
                        <Badge variant="destructive">Controlled</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="info" className="mt-4">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Category</p>
                      <p className="font-medium">{selectedMedication.category}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Form & Strength</p>
                      <p className="font-medium">{selectedMedication.dosageForm} {selectedMedication.strength}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Manufacturer</p>
                      <p className="font-medium">{selectedMedication.manufacturer || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Batch Number</p>
                      <p className="font-medium">{selectedMedication.batchNumber || 'N/A'}</p>
                    </div>
                  </div>

                  <Card className="border-0 bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">Stock Level</span>
                        <span className="text-2xl font-bold">{selectedMedication.quantity} units</span>
                      </div>
                      <Progress 
                        value={Math.min(100, (selectedMedication.quantity / (selectedMedication.reorderLevel * 3)) * 100)}
                        className="h-3"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>Reorder at: {selectedMedication.reorderLevel}</span>
                        <span>Value: {formatCurrency(selectedMedication.quantity * selectedMedication.unitPrice)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-0 bg-muted/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Unit Price</p>
                          <p className="font-bold">{formatCurrency(selectedMedication.unitPrice)}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className={cn(
                      "border-0",
                      getExpiryStatus(selectedMedication.expiryDate).urgent ? "bg-red-50 dark:bg-red-950/30" : "bg-muted/50"
                    )}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <Calendar className={cn("h-5 w-5", getExpiryStatus(selectedMedication.expiryDate).color)} />
                        <div>
                          <p className="text-xs text-muted-foreground">Expiry</p>
                          <p className={cn("font-bold", getExpiryStatus(selectedMedication.expiryDate).color)}>
                            {format(new Date(selectedMedication.expiryDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedMedication.location && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Storage Location</p>
                        <p className="font-medium">{selectedMedication.location}</p>
                      </div>
                    </div>
                  )}

                  {selectedMedication.notes && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Notes</p>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedMedication.notes}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="space-y-4 mt-4">
                  <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-emerald-600" />
                        Dispense Medication
                      </CardTitle>
                      <CardDescription>Remove items from inventory</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max={selectedMedication.quantity}
                          value={dispenseQty}
                          onChange={(e) => setDispenseQty(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => handleDispense(selectedMedication.id, parseInt(dispenseQty) || 1)}
                          disabled={selectedMedication.quantity === 0}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Dispense
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <RotateCw className="h-4 w-4 text-blue-600" />
                        Restock Inventory
                      </CardTitle>
                      <CardDescription>Add items to inventory</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Quantity"
                          id="restockQty"
                          className="flex-1"
                        />
                        <Button 
                          variant="outline"
                          onClick={() => {
                            const input = document.getElementById('restockQty') as HTMLInputElement
                            handleRestock(selectedMedication.id, parseInt(input.value) || 0)
                            input.value = ''
                          }}
                        >
                          <RotateCw className="h-4 w-4 mr-2" />
                          Restock
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-6 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => handleEdit(selectedMedication)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(selectedMedication.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingMedication ? (
                <>
                  <Edit className="h-5 w-5" />
                  Edit Medication
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Add New Medication
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingMedication ? 'Update medication information' : 'Fill in the details to add a new medication'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Tylenol"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Generic Name</Label>
                  <Input
                    value={form.genericName}
                    onChange={(e) => setForm({ ...form, genericName: e.target.value })}
                    placeholder="e.g., Acetaminophen"
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
                        <SelectItem key={cat.name} value={cat.name}>
                          <span className="mr-2">{cat.icon}</span>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dosage Form</Label>
                  <Select
                    value={form.dosageForm}
                    onValueChange={(v) => setForm({ ...form, dosageForm: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select form" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOSAGE_FORMS.map(df => (
                        <SelectItem key={df} value={df}>{df}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Strength</Label>
                  <Input
                    value={form.strength}
                    onChange={(e) => setForm({ ...form, strength: e.target.value })}
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Manufacturer</Label>
                  <Input
                    value={form.manufacturer}
                    onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                    placeholder="Manufacturer name"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reorder Level</Label>
                  <Input
                    type="number"
                    value={form.reorderLevel}
                    onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Batch Number</Label>
                  <Input
                    value={form.batchNumber}
                    onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                    placeholder="Batch number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Storage Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g., Shelf A-12, Room 101"
                />
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                <input
                  type="checkbox"
                  id="controlled"
                  checked={form.controlled}
                  onChange={(e) => setForm({ ...form, controlled: e.target.checked })}
                  className="h-5 w-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <Label htmlFor="controlled" className="font-medium cursor-pointer flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Controlled Substance
                  </Label>
                  <p className="text-sm text-muted-foreground">Mark if this medication requires special handling</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional notes, warnings, storage instructions..."
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <BadgeCheck className="h-4 w-4 mr-2" />
              {editingMedication ? 'Save Changes' : 'Add Medication'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
