import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Search,
  Receipt,
  DollarSign,
  Trash2,
  Eye,
  CreditCard,
  Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import type { Invoice, Patient, Service } from '@/types'

const invoiceItemSchema = z.object({
  serviceId: z.number().optional(),
  description: z.string().min(1, 'Description required'),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
})

const invoiceSchema = z.object({
  patientId: z.number().min(1, 'Patient is required'),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  discountValue: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
})

const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'INSURANCE', 'OTHER']),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

type InvoiceForm = z.infer<typeof invoiceSchema>
type PaymentForm = z.infer<typeof paymentSchema>
type InvoiceItemForm = z.infer<typeof invoiceItemSchema>

export function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemForm[]>([])
  const [saving, setSaving] = useState(false)

  const {
    register: registerInvoice,
    handleSubmit: handleSubmitInvoice,
    reset: resetInvoice,
    setValue: setInvoiceValue,
    watch: watchInvoice,
    formState: { errors: invoiceErrors },
  } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      discountValue: 0,
    },
  })

  const {
    register: registerPayment,
    handleSubmit: handleSubmitPayment,
    reset: resetPayment,
    setValue: setPaymentValue,
    formState: { errors: paymentErrors },
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [invoicesData, patientsData, servicesData] = await Promise.all([
        window.electronAPI.invoices.getAll(),
        window.electronAPI.patients.getAll(),
        window.electronAPI.services.getAll(),
      ])
      setInvoices(invoicesData)
      setPatients(patientsData)
      setServices(servicesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    resetInvoice({ discountValue: 0 })
    setInvoiceItems([])
    setIsCreateDialogOpen(true)
  }

  const openViewDialog = async (invoice: Invoice) => {
    try {
      const fullInvoice = await window.electronAPI.invoices.getById(invoice.id)
      setSelectedInvoice(fullInvoice)
      setIsViewDialogOpen(true)
    } catch (error) {
      console.error('Failed to load invoice:', error)
    }
  }

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    resetPayment({
      amount: invoice.balanceAmount,
      paymentMethod: 'CASH',
    })
    setIsPaymentDialogOpen(true)
  }

  const addInvoiceItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { description: '', quantity: 1, unitPrice: 0 },
    ])
  }

  const updateInvoiceItem = (index: number, field: keyof InvoiceItemForm, value: any) => {
    const updated = [...invoiceItems]
    updated[index] = { ...updated[index], [field]: value }
    setInvoiceItems(updated)
  }

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index))
  }

  const selectService = (index: number, serviceId: string) => {
    const service = services.find((s) => s.id === parseInt(serviceId))
    if (service) {
      const updated = [...invoiceItems]
      updated[index] = {
        serviceId: service.id,
        description: service.name,
        quantity: 1,
        unitPrice: service.unitPrice,
      }
      setInvoiceItems(updated)
    }
  }

  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
    const discountType = watchInvoice('discountType')
    const discountValue = watchInvoice('discountValue') || 0
    
    let discountAmount = 0
    if (discountType === 'PERCENTAGE') {
      discountAmount = Math.min((subtotal * discountValue) / 100, subtotal * 0.5)
    } else if (discountType === 'FIXED') {
      discountAmount = Math.min(discountValue, subtotal * 0.5)
    }
    
    const taxableAmount = subtotal - discountAmount
    const taxAmount = taxableAmount * 0.05
    const totalAmount = taxableAmount + taxAmount
    
    return { subtotal, discountAmount, taxAmount, totalAmount }
  }

  const onSubmitInvoice = async (data: InvoiceForm) => {
    if (invoiceItems.length === 0) {
      alert('Please add at least one item')
      return
    }
    
    setSaving(true)
    try {
      const items = invoiceItems.map((item) => ({
        serviceId: item.serviceId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      }))
      
      await window.electronAPI.invoices.create({
        ...data,
        items,
      })
      
      setIsCreateDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Failed to create invoice:', error)
    } finally {
      setSaving(false)
    }
  }

  const onSubmitPayment = async (data: PaymentForm) => {
    if (!selectedInvoice) return
    
    setSaving(true)
    try {
      await window.electronAPI.invoices.addPayment(selectedInvoice.id, data)
      setIsPaymentDialogOpen(false)
      setIsViewDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Failed to add payment:', error)
    } finally {
      setSaving(false)
    }
  }

  const handlePrintInvoice = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
            .header h1 { color: #10b981; font-size: 28px; margin-bottom: 5px; }
            .header p { color: #666; font-size: 12px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .info-box { width: 48%; }
            .info-box h3 { font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 8px; }
            .info-box p { font-size: 14px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            .text-right { text-align: right; }
            .totals { margin-top: 20px; width: 300px; margin-left: auto; }
            .totals div { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .totals .total-row { border-top: 2px solid #10b981; font-weight: bold; font-size: 16px; margin-top: 8px; padding-top: 12px; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #888; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            .status-paid { background: #d1fae5; color: #059669; }
            .status-pending { background: #fef3c7; color: #d97706; }
            .status-partial { background: #dbeafe; color: #2563eb; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Tansiq Pulse</h1>
            <p>Hospital Management System</p>
          </div>
          
          <div class="info-row">
            <div class="info-box">
              <h3>Invoice Details</h3>
              <p><strong>${invoice.invoiceNumber}</strong></p>
              <p>Date: ${new Date(invoice.createdAt).toLocaleDateString()}</p>
              <p>Status: <span class="status status-${invoice.status.toLowerCase()}">${invoice.status}</span></p>
            </div>
            <div class="info-box" style="text-align: right;">
              <h3>Bill To</h3>
              <p><strong>${invoice.patient?.firstName} ${invoice.patient?.lastName}</strong></p>
              <p>${invoice.patient?.phone || ''}</p>
              <p>MRN: ${invoice.patient?.mrn || ''}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">$${item.unitPrice.toFixed(2)}</td>
                  <td class="text-right">$${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div>
              <span>Subtotal</span>
              <span>$${invoice.subtotal.toFixed(2)}</span>
            </div>
            ${invoice.discountAmount > 0 ? `
              <div style="color: #059669;">
                <span>Discount</span>
                <span>-$${invoice.discountAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div>
              <span>Tax (${(invoice.taxRate * 100).toFixed(0)}%)</span>
              <span>$${invoice.taxAmount.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Total</span>
              <span>$${invoice.totalAmount.toFixed(2)}</span>
            </div>
            <div style="color: #059669;">
              <span>Paid</span>
              <span>$${invoice.paidAmount.toFixed(2)}</span>
            </div>
            <div style="color: #dc2626; font-weight: bold;">
              <span>Balance Due</span>
              <span>$${invoice.balanceAmount.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing Tansiq Pulse</p>
            <p style="margin-top: 5px;">This is a computer-generated invoice</p>
          </div>
          
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.patient?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.patient?.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === 'PAID').length,
    pending: invoices.filter((i) => i.status === 'PENDING').length,
    partial: invoices.filter((i) => i.status === 'PARTIALLY_PAID').length,
    totalRevenue: invoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + i.totalAmount, 0),
  }

  const totals = calculateTotals()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold tracking-tight"
          >
            Billing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground"
          >
            Manage invoices and payments
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-4 md:grid-cols-4"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid Invoices</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
              </div>
              <Badge variant="success">{stats.paid}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Badge variant="warning">{stats.pending}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Partial Payment</p>
                <p className="text-2xl font-bold">{stats.partial}</p>
              </div>
              <Badge variant="info">{stats.partial}</Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice number or patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">Partial</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Invoices Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No invoices found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try different filters'
                    : 'Create your first invoice'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="group">
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-sm">
                          {invoice.invoiceNumber}
                        </code>
                      </TableCell>
                      <TableCell>
                        {invoice.patient?.firstName} {invoice.patient?.lastName}
                      </TableCell>
                      <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(invoice.paidAmount)}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {formatCurrency(invoice.balanceAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewDialog(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openPaymentDialog(invoice)}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>
              Create a new invoice for a patient
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitInvoice(onSubmitInvoice)} className="space-y-6">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select onValueChange={(value) => setInvoiceValue('patientId', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.firstName} {patient.lastName} ({patient.mrn})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {invoiceErrors.patientId && (
                <p className="text-sm text-destructive">{invoiceErrors.patientId.message}</p>
              )}
            </div>

            {/* Invoice Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addInvoiceItem}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Item
                </Button>
              </div>
              
              {invoiceItems.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No items added. Click "Add Item" to start.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="grid gap-4 grid-cols-12 items-end">
                      <div className="col-span-5 space-y-1">
                        <Label className="text-xs">Service / Description</Label>
                        <Select onValueChange={(value) => selectService(index, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select or type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id.toString()}>
                                {service.name} - {formatCurrency(service.unitPrice)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)
                          }
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Price</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Total</Label>
                        <div className="h-10 px-3 py-2 bg-muted rounded-md text-sm font-medium">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInvoiceItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Discount */}
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select onValueChange={(value) => setInvoiceValue('discountType', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="No discount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  min={0}
                  max={watchInvoice('discountType') === 'PERCENTAGE' ? 50 : undefined}
                  step={0.01}
                  {...registerInvoice('discountValue', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Totals */}
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(totals.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax (5%)</span>
                <span>{formatCurrency(totals.taxAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(totals.totalAmount)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || invoiceItems.length === 0}>
                {saving ? 'Creating...' : 'Create Invoice'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.invoiceNumber}</DialogTitle>
            <DialogDescription>
              Created on {selectedInvoice && formatDate(selectedInvoice.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Bill To</p>
                <p className="font-medium">
                  {selectedInvoice.patient?.firstName} {selectedInvoice.patient?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{selectedInvoice.patient?.phone}</p>
              </div>

              {/* Items */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInvoice.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Totals */}
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedInvoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Tax ({(selectedInvoice.taxRate * 100).toFixed(0)}%)</span>
                  <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Paid</span>
                  <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Balance Due</span>
                  <span>{formatCurrency(selectedInvoice.balanceAmount)}</span>
                </div>
              </div>

              {/* Payments */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium">Payment History</p>
                  {selectedInvoice.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between text-sm border-b pb-2">
                      <span>
                        {formatDate(payment.paidAt)} - {payment.paymentMethod}
                      </span>
                      <span className="text-green-600">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => handlePrintInvoice(selectedInvoice)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Invoice
                </Button>
                {selectedInvoice.status !== 'PAID' && selectedInvoice.status !== 'CANCELLED' && (
                  <Button onClick={() => openPaymentDialog(selectedInvoice)}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Record Payment
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Balance due: {formatCurrency(selectedInvoice?.balanceAmount || 0)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPayment(onSubmitPayment)} className="space-y-4">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step={0.01}
                min={0.01}
                max={selectedInvoice?.balanceAmount}
                {...registerPayment('amount', { valueAsNumber: true })}
              />
              {paymentErrors.amount && (
                <p className="text-sm text-destructive">{paymentErrors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select
                defaultValue="CASH"
                onValueChange={(value) => setPaymentValue('paymentMethod', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="INSURANCE">Insurance</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reference (optional)</Label>
              <Input {...registerPayment('reference')} placeholder="Transaction reference" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Processing...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
