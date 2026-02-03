import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingDown,
  ArrowUpDown,
  Filter,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'

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
}

const CATEGORIES = [
  'Medical Supplies',
  'Medications',
  'Equipment',
  'PPE',
  'Lab Supplies',
  'Surgical Supplies',
  'Office Supplies',
  'Cleaning Supplies',
  'Other',
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

const STORAGE_KEY = 'inventory_items'

export function InventoryManager() {
  const toast = useToast()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showLowStock, setShowLowStock] = useState(false)
  const [sortField, setSortField] = useState<'name' | 'quantity' | 'category'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

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
  }

  const handleRestock = (id: string, quantity: number) => {
    const updated = items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          quantity: item.quantity + quantity,
          lastRestocked: new Date().toISOString(),
        }
      }
      return item
    })
    saveItems(updated)
    toast.success('Restocked', `Added ${quantity} units`)
  }

  const handleSort = (field: 'name' | 'quantity' | 'category') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredItems = useMemo(() => {
    const result = items.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      const matchesLowStock = !showLowStock || item.quantity <= item.minStock

      return matchesSearch && matchesCategory && matchesLowStock
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
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [items, searchQuery, selectedCategory, showLowStock, sortField, sortDirection])

  const stats = useMemo(() => {
    const totalItems = items.length
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const lowStockItems = items.filter(item => item.quantity <= item.minStock).length
    const outOfStock = items.filter(item => item.quantity === 0).length

    return { totalItems, totalValue, lowStockItems, outOfStock }
  }, [items])

  const exportInventory = () => {
    const csv = [
      ['SKU', 'Name', 'Category', 'Quantity', 'Unit', 'Min Stock', 'Unit Price', 'Total Value', 'Supplier', 'Location'].join(','),
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
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Inventory Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Track and manage hospital supplies and equipment
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportInventory}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total Items</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-muted-foreground">Total Value</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalValue)}</p>
          </CardContent>
        </Card>
        <Card className={stats.lowStockItems > 0 ? 'border-amber-200 bg-amber-50/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">Low Stock</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-amber-600">{stats.lowStockItems}</p>
          </CardContent>
        </Card>
        <Card className={stats.outOfStock > 0 ? 'border-red-200 bg-red-50/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Out of Stock</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{stats.outOfStock}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showLowStock ? 'default' : 'outline'}
          onClick={() => setShowLowStock(!showLowStock)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Low Stock Only
        </Button>
      </div>

      {/* Inventory Table */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {items.length === 0 ? 'No inventory items yet' : 'No matching items found'}
            </p>
            {items.length === 0 && (
              <Button variant="link" onClick={() => setShowAddDialog(true)}>
                Add your first item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    Item
                    {sortField === 'name' && <ArrowUpDown className="h-4 w-4" />}
                  </div>
                </TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">
                    Category
                    {sortField === 'category' && <ArrowUpDown className="h-4 w-4" />}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer text-right" onClick={() => handleSort('quantity')}>
                  <div className="flex items-center justify-end gap-1">
                    Stock
                    {sortField === 'quantity' && <ArrowUpDown className="h-4 w-4" />}
                  </div>
                </TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredItems.map((item) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group"
                  >
                    <TableCell>
                      <div>
                        <span className="font-medium">{item.name}</span>
                        {item.location && (
                          <span className="text-xs text-muted-foreground block">{item.location}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.sku}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.quantity === 0 ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : item.quantity <= item.minStock ? (
                          <Badge className="bg-amber-100 text-amber-700">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low
                          </Badge>
                        ) : null}
                        <span className={item.quantity <= item.minStock ? 'text-amber-600 font-medium' : ''}>
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </Card>
      )}

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
            <DialogTitle>
              {editingItem ? 'Edit Item' : 'Add Inventory Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update item details' : 'Add a new item to the inventory'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Item Name *</Label>
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
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                <Label>Quantity *</Label>
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
                <Label>Unit Price *</Label>
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
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false)
              setEditingItem(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? 'Update' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
