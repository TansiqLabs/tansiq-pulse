// Patient types
export interface Patient {
  id: number
  mrn: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  phone: string
  email?: string
  address?: string
  bloodType?: string
  emergencyContact?: string
  emergencyPhone?: string
  notes?: string
  deletedAt?: string
  createdAt: string
  updatedAt: string
  appointments?: Appointment[]
  invoices?: Invoice[]
}

// Doctor types
export interface Doctor {
  id: number
  employeeId: string
  firstName: string
  lastName: string
  specialization: string
  phone: string
  email?: string
  consultationFee: number
  consultationMinutes: number
  availability?: string
  isActive: boolean
  deletedAt?: string
  createdAt: string
  updatedAt: string
  appointments?: Appointment[]
}

// Appointment types
export type AppointmentStatus = 
  | 'SCHEDULED' 
  | 'WAITING' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW'

export interface Appointment {
  id: number
  appointmentNo: string
  patientId: number
  patient?: Patient
  doctorId: number
  doctor?: Doctor
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: AppointmentStatus
  reason?: string
  symptoms?: string
  diagnosis?: string
  notes?: string
  arrivedAt?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  invoice?: Invoice
}

// Service types
export interface Service {
  id: number
  code: string
  name: string
  description?: string
  category: 'CONSULTATION' | 'PROCEDURE' | 'LAB' | 'PHARMACY' | 'OTHER'
  unitPrice: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Invoice types
export type InvoiceStatus = 
  | 'DRAFT' 
  | 'PENDING' 
  | 'PAID' 
  | 'PARTIALLY_PAID' 
  | 'CANCELLED'

export interface InvoiceItem {
  id: number
  invoiceId: number
  serviceId?: number
  service?: Service
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: number
  paymentNo: string
  invoiceId: number
  amount: number
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'INSURANCE' | 'OTHER'
  reference?: string
  notes?: string
  paidAt: string
  createdAt: string
}

export interface Invoice {
  id: number
  invoiceNumber: string
  patientId: number
  patient?: Patient
  appointmentId?: number
  appointment?: Appointment
  subtotal: number
  discountType?: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  discountAmount: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  status: InvoiceStatus
  paidAt?: string
  notes?: string
  deletedAt?: string
  createdAt: string
  updatedAt: string
  items?: InvoiceItem[]
  payments?: Payment[]
}

// Dashboard types
export interface DashboardStats {
  todayRevenue: number
  todayAppointments: number
  patientsInQueue: number
  totalPatients: number
  activeDoctors: number
  pendingInvoices: number
}

export interface RevenueChartData {
  date: string
  revenue: number
}

// Settings
export interface Settings {
  hospital_name: string
  hospital_address: string
  hospital_phone: string
  hospital_email: string
  tax_rate: number
  currency: string
  currency_symbol: string
  default_consultation_minutes: number
}
