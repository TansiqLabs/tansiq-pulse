import { app, BrowserWindow, ipcMain } from 'electron'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Initialize Prisma Client
const prisma = new PrismaClient()

let mainWindow: BrowserWindow | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'Tansiq Pulse',
    icon: path.join(__dirname, '../public/icon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    show: false,
  })

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the app
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// App lifecycle
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Cleanup on quit
app.on('before-quit', async () => {
  await prisma.$disconnect()
})

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function getNextId(counterName: string): Promise<string> {
  const counter = await prisma.counter.update({
    where: { name: counterName },
    data: { lastValue: { increment: 1 } }
  })
  
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const monthStr = today.toISOString().slice(0, 7).replace('-', '')
  
  const paddedValue = counter.lastValue.toString().padStart(4, '0')
  
  switch (counterName) {
    case 'patient':
      return `TP-${dateStr}-${paddedValue}`
    case 'appointment':
      return `APT-${dateStr}-${paddedValue}`
    case 'invoice':
      return `INV-${monthStr}-${paddedValue}`
    case 'payment':
      return `PAY-${dateStr}-${paddedValue}`
    case 'doctor':
      return `DOC-${paddedValue}`
    case 'service':
      return `SRV-${paddedValue}`
    default:
      return paddedValue
  }
}

// ============================================================================
// DASHBOARD IPC HANDLERS
// ============================================================================

ipcMain.handle('dashboard:getStats', async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const [
    todayRevenue,
    todayAppointments,
    patientsInQueue,
    totalPatients,
    activeDoctors,
    pendingInvoices
  ] = await Promise.all([
    // Today's revenue
    prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: today, lt: tomorrow }
      },
      _sum: { totalAmount: true }
    }),
    // Today's appointments
    prisma.appointment.count({
      where: {
        scheduledDate: { gte: today, lt: tomorrow }
      }
    }),
    // Patients in queue
    prisma.appointment.count({
      where: {
        scheduledDate: { gte: today, lt: tomorrow },
        status: 'WAITING'
      }
    }),
    // Total patients
    prisma.patient.count({
      where: { deletedAt: null }
    }),
    // Active doctors
    prisma.doctor.count({
      where: { isActive: true, deletedAt: null }
    }),
    // Pending invoices
    prisma.invoice.count({
      where: {
        status: { in: ['PENDING', 'PARTIALLY_PAID'] },
        deletedAt: null
      }
    })
  ])
  
  return {
    todayRevenue: todayRevenue._sum.totalAmount || 0,
    todayAppointments,
    patientsInQueue,
    totalPatients,
    activeDoctors,
    pendingInvoices
  }
})

ipcMain.handle('dashboard:getRevenueChart', async () => {
  const today = new Date()
  const data: { date: string; revenue: number }[] = []
  
  // Get last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    
    const revenue = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: date, lt: nextDate }
      },
      _sum: { totalAmount: true }
    })
    
    data.push({
      date: date.toISOString().slice(0, 10),
      revenue: revenue._sum.totalAmount || 0
    })
  }
  
  return data
})

ipcMain.handle('dashboard:getRecentActivity', async () => {
  const appointments = await prisma.appointment.findMany({
    take: 10,
    orderBy: { updatedAt: 'desc' },
    include: {
      patient: true,
      doctor: true
    }
  })
  return appointments
})

// ============================================================================
// PATIENTS IPC HANDLERS
// ============================================================================

ipcMain.handle('patients:getAll', async () => {
  return prisma.patient.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' }
  })
})

ipcMain.handle('patients:getById', async (_, id: number) => {
  return prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { scheduledDate: 'desc' },
        include: { doctor: true }
      },
      invoices: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })
})

ipcMain.handle('patients:create', async (_, data) => {
  const mrn = await getNextId('patient')
  return prisma.patient.create({
    data: { ...data, mrn }
  })
})

ipcMain.handle('patients:update', async (_, { id, data }) => {
  return prisma.patient.update({
    where: { id },
    data
  })
})

ipcMain.handle('patients:delete', async (_, id: number) => {
  return prisma.patient.update({
    where: { id },
    data: { deletedAt: new Date() }
  })
})

ipcMain.handle('patients:search', async (_, query: string) => {
  return prisma.patient.findMany({
    where: {
      deletedAt: null,
      OR: [
        { firstName: { contains: query } },
        { lastName: { contains: query } },
        { mrn: { contains: query } },
        { phone: { contains: query } }
      ]
    },
    take: 20
  })
})

// ============================================================================
// DOCTORS IPC HANDLERS
// ============================================================================

ipcMain.handle('doctors:getAll', async () => {
  return prisma.doctor.findMany({
    where: { deletedAt: null },
    orderBy: { lastName: 'asc' }
  })
})

ipcMain.handle('doctors:getById', async (_, id: number) => {
  return prisma.doctor.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { scheduledDate: 'desc' },
        take: 10,
        include: { patient: true }
      }
    }
  })
})

ipcMain.handle('doctors:create', async (_, data) => {
  const employeeId = await getNextId('doctor')
  return prisma.doctor.create({
    data: { ...data, employeeId }
  })
})

ipcMain.handle('doctors:update', async (_, { id, data }) => {
  return prisma.doctor.update({
    where: { id },
    data
  })
})

ipcMain.handle('doctors:delete', async (_, id: number) => {
  return prisma.doctor.update({
    where: { id },
    data: { deletedAt: new Date() }
  })
})

// ============================================================================
// APPOINTMENTS IPC HANDLERS
// ============================================================================

ipcMain.handle('appointments:getAll', async () => {
  return prisma.appointment.findMany({
    orderBy: [{ scheduledDate: 'desc' }, { scheduledTime: 'asc' }],
    include: {
      patient: true,
      doctor: true
    }
  })
})

ipcMain.handle('appointments:getByDate', async (_, date: string) => {
  const startDate = new Date(date)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 1)
  
  return prisma.appointment.findMany({
    where: {
      scheduledDate: { gte: startDate, lt: endDate }
    },
    orderBy: { scheduledTime: 'asc' },
    include: {
      patient: true,
      doctor: true
    }
  })
})

ipcMain.handle('appointments:getToday', async () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  return prisma.appointment.findMany({
    where: {
      scheduledDate: { gte: today, lt: tomorrow }
    },
    orderBy: { scheduledTime: 'asc' },
    include: {
      patient: true,
      doctor: true
    }
  })
})

ipcMain.handle('appointments:create', async (_, data) => {
  const appointmentNo = await getNextId('appointment')
  return prisma.appointment.create({
    data: { ...data, appointmentNo },
    include: {
      patient: true,
      doctor: true
    }
  })
})

ipcMain.handle('appointments:update', async (_, { id, data }) => {
  return prisma.appointment.update({
    where: { id },
    data,
    include: {
      patient: true,
      doctor: true
    }
  })
})

ipcMain.handle('appointments:updateStatus', async (_, { id, status }) => {
  const updateData: any = { status }
  const now = new Date()
  
  switch (status) {
    case 'WAITING':
      updateData.arrivedAt = now
      break
    case 'IN_PROGRESS':
      updateData.startedAt = now
      break
    case 'COMPLETED':
      updateData.completedAt = now
      break
  }
  
  return prisma.appointment.update({
    where: { id },
    data: updateData,
    include: {
      patient: true,
      doctor: true
    }
  })
})

ipcMain.handle('appointments:cancel', async (_, id: number) => {
  return prisma.appointment.update({
    where: { id },
    data: { status: 'CANCELLED' }
  })
})

// ============================================================================
// SERVICES IPC HANDLERS
// ============================================================================

ipcMain.handle('services:getAll', async () => {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })
})

ipcMain.handle('services:create', async (_, data) => {
  const code = await getNextId('service')
  return prisma.service.create({
    data: { ...data, code }
  })
})

ipcMain.handle('services:update', async (_, { id, data }) => {
  return prisma.service.update({
    where: { id },
    data
  })
})

ipcMain.handle('services:delete', async (_, id: number) => {
  return prisma.service.update({
    where: { id },
    data: { isActive: false }
  })
})

// ============================================================================
// INVOICES IPC HANDLERS
// ============================================================================

ipcMain.handle('invoices:getAll', async () => {
  return prisma.invoice.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      patient: true,
      appointment: true,
      items: { include: { service: true } },
      payments: true
    }
  })
})

ipcMain.handle('invoices:getById', async (_, id: number) => {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      patient: true,
      appointment: { include: { doctor: true } },
      items: { include: { service: true } },
      payments: true
    }
  })
})

ipcMain.handle('invoices:create', async (_, data) => {
  const invoiceNumber = await getNextId('invoice')
  const settings = await prisma.settings.findFirst({
    where: { key: 'tax_rate' }
  })
  const taxRate = settings ? parseFloat(settings.value) : 0.05
  
  const { items, ...invoiceData } = data
  
  // Calculate totals
  const subtotal = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
  
  let discountAmount = 0
  if (invoiceData.discountType === 'PERCENTAGE') {
    discountAmount = (subtotal * invoiceData.discountValue) / 100
    // Max 50% discount
    discountAmount = Math.min(discountAmount, subtotal * 0.5)
  } else if (invoiceData.discountType === 'FIXED') {
    discountAmount = Math.min(invoiceData.discountValue || 0, subtotal * 0.5)
  }
  
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * taxRate
  const totalAmount = taxableAmount + taxAmount
  
  return prisma.invoice.create({
    data: {
      ...invoiceData,
      invoiceNumber,
      subtotal,
      discountAmount,
      taxRate,
      taxAmount,
      totalAmount,
      balanceAmount: totalAmount,
      status: 'PENDING',
      items: {
        create: items
      }
    },
    include: {
      patient: true,
      items: { include: { service: true } },
      payments: true
    }
  })
})

ipcMain.handle('invoices:addPayment', async (_, { invoiceId, payment }) => {
  const paymentNo = await getNextId('payment')
  
  // Create payment
  const newPayment = await prisma.payment.create({
    data: {
      ...payment,
      paymentNo,
      invoiceId,
      paidAt: new Date()
    }
  })
  
  // Update invoice
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true }
  })
  
  if (!invoice) throw new Error('Invoice not found')
  
  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + payment.amount
  const balanceAmount = invoice.totalAmount - totalPaid
  
  let status = invoice.status
  if (balanceAmount <= 0) {
    status = 'PAID'
  } else if (totalPaid > 0) {
    status = 'PARTIALLY_PAID'
  }
  
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount: totalPaid,
      balanceAmount: Math.max(0, balanceAmount),
      status,
      paidAt: status === 'PAID' ? new Date() : null
    }
  })
  
  return newPayment
})

ipcMain.handle('invoices:cancel', async (_, id: number) => {
  return prisma.invoice.update({
    where: { id },
    data: { status: 'CANCELLED', deletedAt: new Date() }
  })
})

// ============================================================================
// SETTINGS IPC HANDLERS
// ============================================================================

ipcMain.handle('settings:get', async () => {
  const settings = await prisma.settings.findMany()
  return settings.reduce((acc, s) => {
    let value: any = s.value
    if (s.type === 'number') value = parseFloat(s.value)
    if (s.type === 'boolean') value = s.value === 'true'
    if (s.type === 'json') value = JSON.parse(s.value)
    acc[s.key] = value
    return acc
  }, {} as Record<string, any>)
})

ipcMain.handle('settings:update', async (_, { key, value }) => {
  return prisma.settings.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) }
  })
})
