import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, differenceInDays, isPast } from 'date-fns'
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Download,
  Boxes,
  BarChart3,
  RefreshCw,
  Calendar,
  MapPin,
  Building2,
  Tag,
  PackageOpen,
  History,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  quantity: number
  unit: string
  minStock: number
  unitPrice: number
  supplier?: string
  expiryDate?: string
  location?: string
  notes?: string
  lastRestocked?: string
  createdAt: string
  history?: Array<{
    type: 'restock' | 'usage' | 'adjustment'
    quantity: number
    date: string
    note?: string
  }>
}

const CATEGORIES = [
  { name: 'Medical Supplies', icon: '🩹', color: 'blue' },
  { name: 'Medications', icon: '💊', color: 'purple' },
  { name: 'Equipment', icon: '🔬', color: 'indigo' },
  { name: 'PPE', icon: '🥽', color: 'green' },
  { name: 'Lab Supplies', icon: '🧪', color: 'cyan' },
  { name: 'Surgical Supplies', icon: '🔪', color: 'red' },
  { name: 'Office Supplies', icon: '📋', color: 'amber' },
  { name: 'Cleaning Supplies', icon: '🧹', color: 'teal' },
  { name: 'Other', icon: '📦', color: 'gray' },
]

const UNITS = [
  'Pieces',
  'Boxes',
  'Packs',
  'Bottles',
  'Vials',
  'Strips',
  'Rolls',
  'Liters',
  'Kilograms',
  'Sets',
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

const STORAGE_KEY = 'inventory_items'

export function InventoryManager() {
  const toast = useToast()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showLowStock, setShowLowStock] = useState(false)
  const [showExpiring, setShowExpiring] = useState(false)
  const [sortField, setSortField] = useState<'name' | 'quantity' | 'category' | 'value'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: '',
    unit: 'Pieces',
    minStock: '10',
    unitPrice: '',
    supplier: '',
    expiryDate: '',
    location: '',
    notes: '',
  })

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setItems(JSON.parse(stored))
    }
  }, [])

  const saveItems = (newItems: InventoryItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems))
    setItems(newItems)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      quantity: '',
      unit: 'Pieces',
      minStock: '10',
      unitPrice: '',
      supplier: '',
      expiryDate: '',
      location: '',
      notes: '',
    })
  }

  const generateSKU = () => {
    const prefix = formData.category ? formData.category.substring(0, 3).toUpperCase() : 'ITM'
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}-${random}`
  }

  const handleSave = () => {
    if (!formData.name || !formData.category || !formData.quantity || !formData.unitPrice) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    if (editingItem) {
      const updated = items.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            name: formData.name,
            sku: formData.sku || item.sku,
            category: formData.category,
            quantity: parseInt(formData.quantity),
            unit: formData.unit,
            minStock: parseInt(formData.minStock),
            unitPrice: parseFloat(formData.unitPrice),
            supplier: formData.supplier,
            expiryDate: formData.expiryDate,
            location: formData.location,
            notes: formData.notes,
          }
        }
        return item
      })
      saveItems(updated)
      toast.success('Updated', 'Item updated successfully')
    } else {
      const newItem: InventoryItem = {
        id: crypto.randomUUID(),
        name: formData.name,
        sku: formData.sku || generateSKU(),
        category: formData.category,
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        minStock: parseInt(formData.minStock),
        unitPrice: parseFloat(formData.unitPrice),
        supplier: formData.supplier,
        expiryDate: formData.expiryDate,
        location: formData.location,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        history: [{
          type: 'restock',
          quantity: parseInt(formData.quantity),
          date: new Date().toISOString(),
          note: 'Initial stock',
        }],
      }
      saveItems([...items, newItem])
      toast.success('Success', 'Item added to inventory')
    }

    setShowAddDialog(false)
    setEditingItem(null)
    resetForm()
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      minStock: String(item.minStock),
      unitPrice: String(item.unitPrice),
      supplier: item.supplier || '',
      expiryDate: item.expiryDate || '',
      location: item.location || '',
      notes: item.notes || '',
    })
    setShowAddDialog(true)
  }

  const handleDelete = (id: string) => {
    const updated = items.filter(item => item.id !== id)
    saveItems(updated)
    toast.success('Deleted', 'Item removed from inventory')
    setSelectedItem(null)
  }

  const handleRestock = (id: string, quantity: number) => {
    const updated = items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity: item.quantity + quantity,
          lastRestocked: new Date().toISOString(),
          history: [
            ...(item.history || []),
            {
              type: 'restock' as const,
              quantity,
              date: new Date().toISOString(),
            },
          ],
        }
      }
      return item
    })
    saveItems(updated)
    toast.success('Restocked', `Added ${quantity} units`)
  }

  const handleUse = (id: string, quantity: number) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity - quantity)
        return {
          ...item,
          quantity: newQuantity,
          history: [
            ...(item.history || []),
            {
              type: 'usage' as const,
              quantity: -quantity,
              date: new Date().toISOString(),
            },
          ],
        }
      }
      return item
    })
    saveItems(updated)
    toast.success('Updated', `Used ${quantity} units`)
  }

  const handleSort = (field: 'name' | 'quantity' | 'category' | 'value') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getExpiryStatus = (date?: string) => {
    if (!date) return null
    const expiryDate = new Date(date)
    if (isPast(expiryDate)) return 'expired'
    const daysUntil = differenceInDays(expiryDate, new Date())
    if (daysUntil <= 30) return 'soon'
    if (daysUntil <= 90) return 'warning'
    return 'ok'
  }

  const filteredItems = useMemo(() => {
    const result = items.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      const matchesLowStock = !showLowStock || item.quantity <= item.minStock
      const matchesExpiring = !showExpiring || (item.expiryDate && ['expired', 'soon', 'warning'].includes(getExpiryStatus(item.expiryDate) || ''))

      return matchesSearch && matchesCategory && matchesLowStock && matchesExpiring
    })

    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'quantity':
          comparison = a.quantity - b.quantity
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        case 'value':
          comparison = (a.quantity * a.unitPrice) - (b.quantity * b.unitPrice)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [items, searchQuery, selectedCategory, showLowStock, showExpiring, sortField, sortDirection])

  const stats = useMemo(() => {
    const totalItems = items.length
    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const lowStockItems = items.filter(item => item.quantity <= item.minStock).length
    const outOfStock = items.filter(item => item.quantity === 0).length
    const expiringSoon = items.filter(item => {
      const status = getExpiryStatus(item.expiryDate)
      return status === 'soon' || status === 'expired'
    }).length
    const categoryCounts = CATEGORIES.reduce((acc, cat) => {
      acc[cat.name] = items.filter(item => item.category === cat.name).length
      return acc
    }, {} as Record<string, number>)

    return { totalItems, totalUnits, totalValue, lowStockItems, outOfStock, expiringSoon, categoryCounts }
  }, [items])

  const exportInventory = () => {
    const csv = [
      ['SKU', 'Name', 'Category', 'Quantity', 'Unit', 'Min Stock', 'Unit Price', 'Total Value', 'Supplier', 'Location', 'Expiry Date'].join(','),
      ...items.map(item => [
        item.sku,
        `"${item.name}"`,
        item.category,
        item.quantity,
        item.unit,
        item.minStock,
        item.unitPrice,
        (item.quantity * item.unitPrice).toFixed(2),
        `"${item.supplier || ''}"`,
        `"${item.location || ''}"`,
        item.expiryDate || '',
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  const getCategoryInfo = (categoryName: string) => {
    return CATEGORIES.find(c => c.name === categoryName) || CATEGORIES[8]
  }

  const getStockLevel = (item: InventoryItem) => {
    if (item.quantity === 0) return 0
    return Math.min(100, (item.quantity / (item.minStock * 3)) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20">
              <Package className="h-7 w-7" />
            </div>
            Inventory Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Track, manage, and optimize hospital supplies
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportInventory} className="shadow-sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="shadow-sm bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalItems}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stats.totalUnits.toLocaleString()} units</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <Boxes className="h-6 w-6" />
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
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(stats.totalValue)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600">Assets tracked</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className={cn(
            "border-0 shadow-md hover:shadow-lg transition-all",
            stats.lowStockItems > 0 && "ring-2 ring-amber-500/20"
          )}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                  <p className="text-3xl font-bold mt-1 text-amber-600">{stats.lowStockItems}</p>
                  <p className="text-xs text-amber-600 mt-1">{stats.outOfStock} out of stock</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className={cn(
            "border-0 shadow-md hover:shadow-lg transition-all",
            stats.expiringSoon > 0 && "ring-2 ring-red-500/20"
          )}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                  <p className="text-3xl font-bold mt-1 text-red-600">{stats.expiringSoon}</p>
                  <p className="text-xs text-red-600 mt-1">Within 30 days</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Category Overview */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Categories Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.name}
                variant={selectedCategory === cat.name ? 'default' : 'outline'}
                className={cn(
                  "flex flex-col h-auto py-3 gap-1",
                  selectedCategory === cat.name && "bg-gradient-to-br from-orange-500 to-amber-600"
                )}
                onClick={() => setSelectedCategory(selectedCategory === cat.name ? 'all' : cat.name)}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-xs font-medium truncate w-full">{cat.name.split(' ')[0]}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5">{stats.categoryCounts[cat.name] || 0}</Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items, SKU, or supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 shadow-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={showLowStock ? 'default' : 'outline'}
            onClick={() => setShowLowStock(!showLowStock)}
            className={cn(showLowStock && "bg-amber-500 hover:bg-amber-600")}
            size="sm"
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Low Stock
            {stats.lowStockItems > 0 && (
              <Badge variant="secondary" className="ml-2">{stats.lowStockItems}</Badge>
            )}
          </Button>
          <Button
            variant={showExpiring ? 'default' : 'outline'}
            onClick={() => setShowExpiring(!showExpiring)}
            className={cn(showExpiring && "bg-red-500 hover:bg-red-600")}
            size="sm"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Expiring
            {stats.expiringSoon > 0 && (
              <Badge variant="secondary" className="ml-2">{stats.expiringSoon}</Badge>
            )}
          </Button>
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-none"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <Boxes className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Inventory Content */}
      {filteredItems.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <PackageOpen className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Items Found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {items.length === 0
                ? 'Your inventory is empty. Add your first item to get started.'
                : 'No items match your current filters. Try adjusting your search.'}
            </p>
            {items.length === 0 && (
              <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="border-0 shadow-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="cursor-pointer hover:bg-muted/70" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2">
                    Item
                    {sortField === 'name' && <ArrowUpDown className="h-4 w-4 text-primary" />}
                  </div>
                </TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/70" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-2">
                    Category
                    {sortField === 'category' && <ArrowUpDown className="h-4 w-4 text-primary" />}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/70 text-right" onClick={() => handleSort('quantity')}>
                  <div className="flex items-center justify-end gap-2">
                    Stock Level
                    {sortField === 'quantity' && <ArrowUpDown className="h-4 w-4 text-primary" />}
                  </div>
                </TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/70 text-right" onClick={() => handleSort('value')}>
                  <div className="flex items-center justify-end gap-2">
                    Value
                    {sortField === 'value' && <ArrowUpDown className="h-4 w-4 text-primary" />}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredItems.map((item) => {
                  const catInfo = getCategoryInfo(item.category)
                  const expiryStatus = getExpiryStatus(item.expiryDate)
                  const stockLevel = getStockLevel(item)

                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group cursor-pointer hover:bg-muted/30"
                      onClick={() => setSelectedItem(item)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{catInfo.icon}</span>
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.location && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />
                                {item.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{item.sku}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            {item.quantity === 0 ? (
                              <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                            ) : item.quantity <= item.minStock ? (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
                                In Stock
                              </Badge>
                            )}
                            <span className="font-medium tabular-nums">{item.quantity}</span>
                          </div>
                          <div className="w-20">
                            <Progress
                              value={stockLevel}
                              className={cn(
                                "h-1.5",
                                item.quantity === 0 && "[&>div]:bg-red-500",
                                item.quantity > 0 && item.quantity <= item.minStock && "[&>div]:bg-amber-500",
                                item.quantity > item.minStock && "[&>div]:bg-emerald-500"
                              )}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {expiryStatus === 'expired' && (
                            <Badge variant="destructive" className="text-xs">Expired</Badge>
                          )}
                          {expiryStatus === 'soon' && (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">Expiring</Badge>
                          )}
                          <span className="font-semibold tabular-nums">{formatCurrency(item.quantity * item.unitPrice)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const qty = prompt('Enter quantity to add:')
                              if (qty && !isNaN(parseInt(qty))) {
                                handleRestock(item.id, parseInt(qty))
                              }
                            }}
                            title="Restock"
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filteredItems.map((item) => {
            const catInfo = getCategoryInfo(item.category)
            const expiryStatus = getExpiryStatus(item.expiryDate)
            const stockLevel = getStockLevel(item)

            return (
              <motion.div key={item.id} variants={itemVariants}>
                <Card
                  className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => setSelectedItem(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{catInfo.icon}</span>
                        <div>
                          <h4 className="font-semibold line-clamp-1">{item.name}</h4>
                          <code className="text-xs text-muted-foreground">{item.sku}</code>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(item)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Stock Level</span>
                          <span className="font-medium">{item.quantity} / {item.minStock * 3}</span>
                        </div>
                        <Progress
                          value={stockLevel}
                          className={cn(
                            "h-2",
                            item.quantity === 0 && "[&>div]:bg-red-500",
                            item.quantity > 0 && item.quantity <= item.minStock && "[&>div]:bg-amber-500",
                            item.quantity > item.minStock && "[&>div]:bg-emerald-500"
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        {item.quantity === 0 ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : item.quantity <= item.minStock ? (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Low</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Good</Badge>
                        )}
                        {expiryStatus === 'expired' && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                        {expiryStatus === 'soon' && (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Expiring</Badge>
                        )}
                      </div>

                      <Separator />

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Unit Price</span>
                        <span>{formatCurrency(item.unitPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Total Value</span>
                        <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Item Detail Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent className="sm:max-w-lg">
          {selectedItem && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getCategoryInfo(selectedItem.category).icon}</span>
                  <div>
                    <SheetTitle>{selectedItem.name}</SheetTitle>
                    <SheetDescription>
                      <code className="text-xs">{selectedItem.sku}</code>
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="details" className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4 space-y-4">
                  {/* Stock Status */}
                  <Card className="border-0 shadow-sm bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">Current Stock</span>
                        {selectedItem.quantity === 0 ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : selectedItem.quantity <= selectedItem.minStock ? (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Low Stock</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">In Stock</Badge>
                        )}
                      </div>
                      <div className="text-3xl font-bold">
                        {selectedItem.quantity} <span className="text-lg font-normal text-muted-foreground">{selectedItem.unit}</span>
                      </div>
                      <div className="mt-2">
                        <Progress
                          value={getStockLevel(selectedItem)}
                          className={cn(
                            "h-2",
                            selectedItem.quantity === 0 && "[&>div]:bg-red-500",
                            selectedItem.quantity > 0 && selectedItem.quantity <= selectedItem.minStock && "[&>div]:bg-amber-500",
                            selectedItem.quantity > selectedItem.minStock && "[&>div]:bg-emerald-500"
                          )}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Min stock: {selectedItem.minStock}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        const qty = prompt('Enter quantity to add:')
                        if (qty && !isNaN(parseInt(qty))) {
                          handleRestock(selectedItem.id, parseInt(qty))
                          setSelectedItem({ ...selectedItem, quantity: selectedItem.quantity + parseInt(qty) })
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Restock
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        const qty = prompt('Enter quantity used:')
                        if (qty && !isNaN(parseInt(qty))) {
                          handleUse(selectedItem.id, parseInt(qty))
                          setSelectedItem({ ...selectedItem, quantity: Math.max(0, selectedItem.quantity - parseInt(qty)) })
                        }
                      }}
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Use
                    </Button>
                  </div>

                  {/* Item Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Item Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Category:</span>
                        <span className="font-medium">{selectedItem.category}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-medium">{formatCurrency(selectedItem.unitPrice)}</span>
                      </div>
                      {selectedItem.location && (
                        <div className="flex items-center gap-2 text-sm col-span-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Location:</span>
                          <span className="font-medium">{selectedItem.location}</span>
                        </div>
                      )}
                      {selectedItem.supplier && (
                        <div className="flex items-center gap-2 text-sm col-span-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Supplier:</span>
                          <span className="font-medium">{selectedItem.supplier}</span>
                        </div>
                      )}
                      {selectedItem.expiryDate && (
                        <div className="flex items-center gap-2 text-sm col-span-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Expires:</span>
                          <span className={cn(
                            "font-medium",
                            getExpiryStatus(selectedItem.expiryDate) === 'expired' && "text-red-500",
                            getExpiryStatus(selectedItem.expiryDate) === 'soon' && "text-amber-500"
                          )}>
                            {format(new Date(selectedItem.expiryDate), 'PP')}
                          </span>
                        </div>
                      )}
                      {selectedItem.lastRestocked && (
                        <div className="flex items-center gap-2 text-sm col-span-2">
                          <RefreshCw className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Last Restocked:</span>
                          <span className="font-medium">{format(new Date(selectedItem.lastRestocked), 'PP')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Value Summary */}
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Value</span>
                        <span className="text-2xl font-bold">{formatCurrency(selectedItem.quantity * selectedItem.unitPrice)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {selectedItem.notes && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Notes</h4>
                      <p className="text-sm bg-muted/30 p-3 rounded-lg">{selectedItem.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => handleEdit(selectedItem)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => handleDelete(selectedItem.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <ScrollArea className="h-[400px]">
                    {selectedItem.history && selectedItem.history.length > 0 ? (
                      <div className="space-y-3">
                        {[...selectedItem.history].reverse().map((entry, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                            <div className={cn(
                              "p-2 rounded-full",
                              entry.type === 'restock' && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
                              entry.type === 'usage' && "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
                              entry.type === 'adjustment' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            )}>
                              {entry.type === 'restock' && <Plus className="h-4 w-4" />}
                              {entry.type === 'usage' && <TrendingDown className="h-4 w-4" />}
                              {entry.type === 'adjustment' && <RefreshCw className="h-4 w-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <span className="font-medium capitalize">{entry.type}</span>
                                <span className={cn(
                                  "font-semibold",
                                  entry.quantity > 0 ? "text-emerald-600" : "text-amber-600"
                                )}>
                                  {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{format(new Date(entry.date), 'PPp')}</p>
                              {entry.note && <p className="text-sm mt-1">{entry.note}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <History className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">No history available</p>
                      </div>
                    )}
                  </ScrollArea>
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
          setEditingItem(null)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingItem ? (
                <>
                  <Edit className="h-5 w-5 text-primary" />
                  Edit Item
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-primary" />
                  Add Inventory Item
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update item details' : 'Add a new item to track in your inventory'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Surgical Gloves"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.name} value={cat.name}>
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            {cat.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Quantity <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Stock Level</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Price <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Supplier name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Storage Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Warehouse A, Shelf 3"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this item..."
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false)
              setEditingItem(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700">
              {editingItem ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Item
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
