import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfMonth } from 'date-fns'
import {
  Wallet,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

interface Expense {
  id: string
  date: string
  category: string
  description: string
  amount: number
  paymentMethod: string
  vendor?: string
  receiptNo?: string
  notes?: string
  createdAt: string
}

const expenseCategories = [
  { value: 'supplies', label: 'Medical Supplies', color: 'bg-blue-100 text-blue-700' },
  { value: 'equipment', label: 'Equipment', color: 'bg-purple-100 text-purple-700' },
  { value: 'utilities', label: 'Utilities', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'salaries', label: 'Salaries', color: 'bg-green-100 text-green-700' },
  { value: 'rent', label: 'Rent/Lease', color: 'bg-orange-100 text-orange-700' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-red-100 text-red-700' },
  { value: 'insurance', label: 'Insurance', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'marketing', label: 'Marketing', color: 'bg-pink-100 text-pink-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' },
]

const paymentMethods = [
  'Cash',
  'Bank Transfer',
  'Credit Card',
  'Check',
  'Other',
]

export function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [saving, setSaving] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('month')
  const toast = useToast()

  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'supplies',
    description: '',
    amount: '',
    paymentMethod: 'Cash',
    vendor: '',
    receiptNo: '',
    notes: '',
  })

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = () => {
    setLoading(true)
    try {
      const stored = localStorage.getItem('hospital_expenses')
      if (stored) {
        setExpenses(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveExpenses = (updatedExpenses: Expense[]) => {
    localStorage.setItem('hospital_expenses', JSON.stringify(updatedExpenses))
    setExpenses(updatedExpenses)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const openCreateDialog = () => {
    setEditingExpense(null)
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      category: 'supplies',
      description: '',
      amount: '',
      paymentMethod: 'Cash',
      vendor: '',
      receiptNo: '',
      notes: '',
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      date: format(new Date(expense.date), 'yyyy-MM-dd'),
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      paymentMethod: expense.paymentMethod,
      vendor: expense.vendor || '',
      receiptNo: expense.receiptNo || '',
      notes: expense.notes || '',
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!formData.description || !formData.amount) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    setSaving(true)
    const now = new Date().toISOString()

    if (editingExpense) {
      const updatedExpenses = expenses.map(exp =>
        exp.id === editingExpense.id
          ? {
              ...exp,
              date: formData.date,
              category: formData.category,
              description: formData.description,
              amount: parseFloat(formData.amount),
              paymentMethod: formData.paymentMethod,
              vendor: formData.vendor || undefined,
              receiptNo: formData.receiptNo || undefined,
              notes: formData.notes || undefined,
            }
          : exp
      )
      saveExpenses(updatedExpenses)
      toast.success('Expense Updated', 'Expense record has been updated.')
    } else {
      const newExpense: Expense = {
        id: Math.random().toString(36).substring(7),
        date: formData.date,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        vendor: formData.vendor || undefined,
        receiptNo: formData.receiptNo || undefined,
        notes: formData.notes || undefined,
        createdAt: now,
      }
      saveExpenses([newExpense, ...expenses])
      toast.success('Expense Added', 'New expense has been recorded.')
    }

    setIsDialogOpen(false)
    setSaving(false)
  }

  const handleDelete = (id: string) => {
    const updatedExpenses = expenses.filter(exp => exp.id !== id)
    saveExpenses(updatedExpenses)
    toast.success('Expense Deleted', 'Expense record has been removed.')
  }

  const getCategoryConfig = (category: string) => {
    return expenseCategories.find(c => c.value === category) || expenseCategories[8]
  }

  // Filter expenses by date range and category
  const filteredExpenses = useMemo(() => {
    const now = new Date()
    let startDate: Date
    
    switch (dateRange) {
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = startOfMonth(now)
    }

    return expenses.filter(exp => {
      const expDate = new Date(exp.date)
      const matchesDate = expDate >= startDate && expDate <= now
      const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter
      return matchesDate && matchesCategory
    })
  }, [expenses, dateRange, categoryFilter])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const byCategory = expenseCategories.map(cat => ({
      ...cat,
      amount: filteredExpenses
        .filter(exp => exp.category === cat.value)
        .reduce((sum, exp) => sum + exp.amount, 0),
    })).filter(cat => cat.amount > 0)

    return { total, byCategory }
  }, [filteredExpenses])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Expense Tracker
          </h2>
          <p className="text-muted-foreground">
            Track and manage hospital expenses
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(stats.total)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {dateRange === 'month' ? 'This month' : dateRange === 'quarter' ? 'This quarter' : 'This year'}
            </p>
          </CardContent>
        </Card>

        {stats.byCategory.slice(0, 3).map(cat => (
          <Card key={cat.value}>
            <CardHeader className="pb-2">
              <CardDescription>{cat.label}</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(cat.amount)}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={cat.color}>{((cat.amount / stats.total) * 100).toFixed(1)}%</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">Expense Records</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={(v: 'month' | 'quarter' | 'year') => setDateRange(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {expenseCategories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No expenses recorded</p>
              <p className="text-sm">Click "Add Expense" to record your first expense</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredExpenses.map(expense => {
                    const catConfig = getCategoryConfig(expense.category)
                    return (
                      <motion.tr
                        key={expense.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group"
                      >
                        <TableCell className="font-medium">
                          {format(new Date(expense.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge className={catConfig.color}>{catConfig.label}</Badge>
                        </TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {expense.vendor || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDelete(expense.id)}
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
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Edit Expense' : 'Add Expense'}
            </DialogTitle>
            <DialogDescription>
              {editingExpense ? 'Update expense details' : 'Record a new expense'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(v) => handleInputChange('category', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Input
                placeholder="What was this expense for?"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(v) => handleInputChange('paymentMethod', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Receipt No.</Label>
                <Input
                  placeholder="Optional"
                  value={formData.receiptNo}
                  onChange={(e) => handleInputChange('receiptNo', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vendor/Supplier</Label>
              <Input
                placeholder="Who did you pay?"
                value={formData.vendor}
                onChange={(e) => handleInputChange('vendor', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional details..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editingExpense ? 'Update' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
