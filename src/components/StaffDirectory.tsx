import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, formatDistanceToNow, differenceInYears, parseISO } from 'date-fns'
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Building2,
  Filter,
  Download,
  UserCheck,
  UserX,
  Clock,
  Shield,
  Briefcase,
  Grid3X3,
  List,
  ChevronRight,
  Award,
  BadgeCheck,
  TrendingUp,
  DollarSign,
  Star,
  StarOff,
  Heart,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Copy,
  MoreVertical,
  FileText,
  Printer,
  History,
  Activity,
  BarChart3,
  Target,
  Cake,
  GraduationCap,
  Landmark,
  CreditCard,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  X,
  AlertTriangle,
  Square,
  CheckSquare,
  Wifi,
  WifiOff,
  RefreshCw,
  Cloud,
  CloudOff,
  Monitor,
  Smartphone,
  Laptop,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { getInitials, cn } from '@/lib/utils'

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  department: string
  employeeId: string
  joinDate: string
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE' | 'PROBATION' | 'TERMINATED'
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  emergencyRelation?: string
  notes?: string
  salary?: number
  skills?: string[]
  performance?: number
  rating?: number
  isFavorite?: boolean
  dateOfBirth?: string
  gender?: 'Male' | 'Female' | 'Other'
  maritalStatus?: string
  bloodType?: string
  nationalId?: string
  bankName?: string
  bankAccount?: string
  shiftType?: 'Morning' | 'Evening' | 'Night' | 'Rotating'
  contractType?: 'Full-time' | 'Part-time' | 'Contract' | 'Intern'
  reportsTo?: string
  certifications?: string[]
  leaveBalance?: number
  overtimeHours?: number
  attendance?: number
  lastReviewDate?: string
  nextReviewDate?: string
  documents?: { name: string; uploadedAt: string }[]
  activityLog?: { action: string; date: string; details?: string }[]
}

interface PerformanceReview {
  id: string
  staffId: string
  date: string
  rating: number
  reviewer: string
  strengths: string[]
  improvements: string[]
  goals: string[]
  comments: string
}

const ROLES = [
  { name: 'Receptionist', icon: '👋', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', gradient: 'from-blue-500 to-blue-600' },
  { name: 'Nurse', icon: '💉', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300', gradient: 'from-pink-500 to-pink-600' },
  { name: 'Lab Technician', icon: '🔬', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', gradient: 'from-purple-500 to-purple-600' },
  { name: 'Pharmacist', icon: '💊', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', gradient: 'from-green-500 to-green-600' },
  { name: 'Administrator', icon: '📋', color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300', gradient: 'from-slate-500 to-slate-600' },
  { name: 'Accountant', icon: '💰', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', gradient: 'from-yellow-500 to-yellow-600' },
  { name: 'Maintenance', icon: '🔧', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', gradient: 'from-orange-500 to-orange-600' },
  { name: 'Security', icon: '🛡️', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', gradient: 'from-red-500 to-red-600' },
  { name: 'Cleaner', icon: '🧹', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300', gradient: 'from-cyan-500 to-cyan-600' },
  { name: 'IT Support', icon: '💻', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', gradient: 'from-indigo-500 to-indigo-600' },
  { name: 'HR Manager', icon: '👥', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300', gradient: 'from-teal-500 to-teal-600' },
  { name: 'Medical Assistant', icon: '🩺', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', gradient: 'from-emerald-500 to-emerald-600' },
  { name: 'Radiologist Tech', icon: '📡', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300', gradient: 'from-violet-500 to-violet-600' },
  { name: 'Dietitian', icon: '🥗', color: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300', gradient: 'from-lime-500 to-lime-600' },
  { name: 'Physical Therapist', icon: '🏃', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', gradient: 'from-amber-500 to-amber-600' },
  { name: 'Other', icon: '📌', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300', gradient: 'from-gray-500 to-gray-600' },
]

const DEPARTMENTS = [
  { name: 'Administration', icon: Building2, color: 'slate' },
  { name: 'Front Desk', icon: Users, color: 'blue' },
  { name: 'Nursing', icon: Heart, color: 'pink' },
  { name: 'Laboratory', icon: Activity, color: 'purple' },
  { name: 'Pharmacy', icon: Briefcase, color: 'green' },
  { name: 'Radiology', icon: Target, color: 'violet' },
  { name: 'Emergency', icon: AlertCircle, color: 'red' },
  { name: 'ICU', icon: Shield, color: 'rose' },
  { name: 'OPD', icon: Users, color: 'cyan' },
  { name: 'Finance', icon: DollarSign, color: 'yellow' },
  { name: 'IT', icon: Briefcase, color: 'indigo' },
  { name: 'Maintenance', icon: Briefcase, color: 'orange' },
  { name: 'Human Resources', icon: Users, color: 'teal' },
  { name: 'Security', icon: Shield, color: 'gray' },
  { name: 'Housekeeping', icon: Briefcase, color: 'lime' },
]

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2; label: string; badgeColor: string }> = {
  ACTIVE: { 
    color: 'text-emerald-600 dark:text-emerald-400', 
    icon: UserCheck, 
    label: 'Active',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  },
  ON_LEAVE: { 
    color: 'text-amber-600 dark:text-amber-400', 
    icon: Clock, 
    label: 'On Leave',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  },
  INACTIVE: { 
    color: 'text-gray-500 dark:text-gray-400', 
    icon: UserX, 
    label: 'Inactive',
    badgeColor: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400'
  },
  PROBATION: { 
    color: 'text-blue-600 dark:text-blue-400', 
    icon: Clock, 
    label: 'Probation',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  },
  TERMINATED: { 
    color: 'text-red-600 dark:text-red-400', 
    icon: XCircle, 
    label: 'Terminated',
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  },
}

const STORAGE_KEY = 'staff_directory'
const REVIEWS_KEY = 'staff_reviews'
const SYNC_KEY = 'staff_sync_meta'
const PENDING_CHANGES_KEY = 'staff_pending_changes'

// Sync and Online/Offline Types
interface SyncMeta {
  lastSyncAt: string | null
  deviceId: string
  syncEnabled: boolean
  serverUrl: string | null
}

interface PendingChange {
  id: string
  type: 'create' | 'update' | 'delete'
  entityType: 'staff' | 'review'
  entityId: string
  data: StaffMember | PerformanceReview | null
  timestamp: string
}

// Generate unique device ID
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('device_id')
  if (!deviceId) {
    deviceId = `device_${crypto.randomUUID()}`
    localStorage.setItem('device_id', deviceId)
  }
  return deviceId
}

// Detect device type
const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
  const ua = navigator.userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet'
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

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

export function StaffDirectory() {
  const toast = useToast()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedShift, setSelectedShift] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null)
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set())
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'joinDate' | 'performance' | 'department'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)

  // Online/Offline & Sync States
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncMeta, setSyncMeta] = useState<SyncMeta>({
    lastSyncAt: null,
    deviceId: getDeviceId(),
    syncEnabled: false,
    serverUrl: null,
  })
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [showSyncSettings, setShowSyncSettings] = useState(false)
  const [syncServerUrl, setSyncServerUrl] = useState('')

  const [formData, setFormData] = useState<{
    firstName: string
    lastName: string
    email: string
    phone: string
    role: string
    department: string
    employeeId: string
    joinDate: string
    address: string
    emergencyContact: string
    emergencyPhone: string
    emergencyRelation: string
    notes: string
    salary: string
    skills: string
    dateOfBirth: string
    gender: string
    maritalStatus: string
    bloodType: string
    nationalId: string
    bankName: string
    bankAccount: string
    shiftType: 'Morning' | 'Evening' | 'Night' | 'Rotating' | ''
    contractType: 'Full-time' | 'Part-time' | 'Contract' | 'Intern' | ''
    reportsTo: string
    certifications: string
    leaveBalance: string
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    employeeId: '',
    joinDate: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelation: '',
    notes: '',
    salary: '',
    skills: '',
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    bloodType: '',
    nationalId: '',
    bankName: '',
    bankAccount: '',
    shiftType: '',
    contractType: '',
    reportsTo: '',
    certifications: '',
    leaveBalance: '20',
  })

  const [reviewData, setReviewData] = useState({
    rating: 3,
    reviewer: '',
    strengths: '',
    improvements: '',
    goals: '',
    comments: '',
  })

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Online', 'You are now connected to the internet')
      // Auto-sync when coming back online
      if (syncMeta.syncEnabled && pendingChanges.length > 0) {
        handleSync()
      }
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('Offline', 'You are now working offline. Changes will sync when reconnected.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncMeta.syncEnabled, pendingChanges.length])

  // Load data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setStaff(JSON.parse(stored))
    }
    const storedReviews = localStorage.getItem(REVIEWS_KEY)
    if (storedReviews) {
      setReviews(JSON.parse(storedReviews))
    }
    // Load sync metadata
    const storedSyncMeta = localStorage.getItem(SYNC_KEY)
    if (storedSyncMeta) {
      setSyncMeta(JSON.parse(storedSyncMeta))
    }
    // Load pending changes
    const storedPending = localStorage.getItem(PENDING_CHANGES_KEY)
    if (storedPending) {
      setPendingChanges(JSON.parse(storedPending))
    }
  }, [])

  // Add pending change for sync
  const addPendingChange = useCallback((change: Omit<PendingChange, 'id' | 'timestamp'>) => {
    const newChange: PendingChange = {
      ...change,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }
    setPendingChanges(prev => {
      const updated = [...prev, newChange]
      localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // Sync with server (API abstraction - ready for backend integration)
  const handleSync = useCallback(async () => {
    if (!syncMeta.syncEnabled || !syncMeta.serverUrl) {
      toast.error('Sync Error', 'Please configure sync settings first')
      return
    }

    setIsSyncing(true)
    try {
      // This is an API abstraction - replace with actual API calls when backend is ready
      // For now, simulate sync with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500))

      // In production, this would:
      // 1. POST pending changes to server
      // 2. GET latest data from server
      // 3. Merge conflicts (last-write-wins or custom resolution)
      // 4. Clear pending changes on success

      // Example API structure:
      // const response = await fetch(`${syncMeta.serverUrl}/api/staff/sync`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     deviceId: syncMeta.deviceId,
      //     pendingChanges,
      //     lastSyncAt: syncMeta.lastSyncAt,
      //   }),
      // })
      // const { staff: serverStaff, reviews: serverReviews } = await response.json()
      // setStaff(serverStaff)
      // setReviews(serverReviews)

      // Clear pending changes after successful sync
      setPendingChanges([])
      localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify([]))

      // Update sync metadata
      const updatedMeta = {
        ...syncMeta,
        lastSyncAt: new Date().toISOString(),
      }
      setSyncMeta(updatedMeta)
      localStorage.setItem(SYNC_KEY, JSON.stringify(updatedMeta))

      toast.success('Synced', 'Data synchronized successfully')
    } catch (error) {
      toast.error('Sync Failed', 'Unable to sync data. Will retry when online.')
    } finally {
      setIsSyncing(false)
    }
  }, [syncMeta, pendingChanges, toast])

  // Enable/Disable sync
  const toggleSync = useCallback((enabled: boolean, serverUrl?: string) => {
    const updatedMeta: SyncMeta = {
      ...syncMeta,
      syncEnabled: enabled,
      serverUrl: serverUrl || syncMeta.serverUrl,
    }
    setSyncMeta(updatedMeta)
    localStorage.setItem(SYNC_KEY, JSON.stringify(updatedMeta))

    if (enabled) {
      toast.success('Sync Enabled', 'Cross-device sync is now active')
    } else {
      toast.info('Sync Disabled', 'Working in offline mode only')
    }
  }, [syncMeta, toast])

  const saveStaff = useCallback((newStaff: StaffMember[], changeType?: 'create' | 'update' | 'delete', entityId?: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStaff))
    setStaff(newStaff)

    // Track change for sync if enabled
    if (syncMeta.syncEnabled && changeType && entityId) {
      const changedEntity = newStaff.find(s => s.id === entityId) || null
      addPendingChange({
        type: changeType,
        entityType: 'staff',
        entityId,
        data: changedEntity,
      })
    }
  }, [syncMeta.syncEnabled, addPendingChange])

  const saveReviews = useCallback((newReviews: PerformanceReview[], changeType?: 'create' | 'update' | 'delete', entityId?: string) => {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(newReviews))
    setReviews(newReviews)

    // Track change for sync if enabled
    if (syncMeta.syncEnabled && changeType && entityId) {
      const changedEntity = newReviews.find(r => r.id === entityId) || null
      addPendingChange({
        type: changeType,
        entityType: 'review',
        entityId,
        data: changedEntity,
      })
    }
  }, [syncMeta.syncEnabled, addPendingChange])

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      employeeId: '',
      joinDate: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      emergencyRelation: '',
      notes: '',
      salary: '',
      skills: '',
      dateOfBirth: '',
      gender: '',
      maritalStatus: '',
      bloodType: '',
      nationalId: '',
      bankName: '',
      bankAccount: '',
      shiftType: '',
      contractType: '',
      reportsTo: '',
      certifications: '',
      leaveBalance: '20',
    })
  }

  const generateEmployeeId = () => {
    const prefix = 'EMP'
    const year = new Date().getFullYear()
    const number = String(staff.length + 1).padStart(4, '0')
    return `${prefix}-${year}-${number}`
  }

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.role || !formData.department) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    const activityEntry = {
      action: editingStaff ? 'Profile Updated' : 'Profile Created',
      date: new Date().toISOString(),
      details: editingStaff ? 'Staff information was updated' : 'New staff member was added to the system',
    }

    const validGender = formData.gender ? (formData.gender as 'Male' | 'Female' | 'Other') : undefined
    const validShiftType = formData.shiftType ? (formData.shiftType as 'Morning' | 'Evening' | 'Night' | 'Rotating') : undefined
    const validContractType = formData.contractType ? (formData.contractType as 'Full-time' | 'Part-time' | 'Contract' | 'Intern') : undefined

    if (editingStaff) {
      const updated = staff.map(s => {
        if (s.id === editingStaff.id) {
          return {
            ...s,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            department: formData.department,
            employeeId: formData.employeeId || s.employeeId,
            joinDate: formData.joinDate || s.joinDate,
            address: formData.address,
            emergencyContact: formData.emergencyContact,
            emergencyPhone: formData.emergencyPhone,
            emergencyRelation: formData.emergencyRelation,
            notes: formData.notes,
            dateOfBirth: formData.dateOfBirth,
            maritalStatus: formData.maritalStatus,
            bloodType: formData.bloodType,
            nationalId: formData.nationalId,
            bankName: formData.bankName,
            bankAccount: formData.bankAccount,
            reportsTo: formData.reportsTo,
            gender: validGender,
            shiftType: validShiftType,
            contractType: validContractType,
            salary: formData.salary ? parseFloat(formData.salary) : undefined,
            skills: formData.skills ? formData.skills.split(',').map(sk => sk.trim()) : undefined,
            certifications: formData.certifications ? formData.certifications.split(',').map(c => c.trim()) : undefined,
            leaveBalance: formData.leaveBalance ? parseInt(formData.leaveBalance) : 20,
            activityLog: [...(s.activityLog || []), activityEntry],
          }
        }
        return s
      })
      saveStaff(updated)
      toast.success('Updated', 'Staff member updated successfully')
    } else {
      const newStaffMember: StaffMember = {
        id: crypto.randomUUID(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
        employeeId: formData.employeeId || generateEmployeeId(),
        joinDate: formData.joinDate || new Date().toISOString(),
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        emergencyRelation: formData.emergencyRelation,
        notes: formData.notes,
        dateOfBirth: formData.dateOfBirth,
        maritalStatus: formData.maritalStatus,
        bloodType: formData.bloodType,
        nationalId: formData.nationalId,
        bankName: formData.bankName,
        bankAccount: formData.bankAccount,
        reportsTo: formData.reportsTo,
        gender: validGender,
        shiftType: validShiftType,
        contractType: validContractType,
        status: 'PROBATION',
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        skills: formData.skills ? formData.skills.split(',').map(sk => sk.trim()) : undefined,
        certifications: formData.certifications ? formData.certifications.split(',').map(c => c.trim()) : undefined,
        performance: Math.floor(Math.random() * 20) + 75,
        rating: 3,
        leaveBalance: formData.leaveBalance ? parseInt(formData.leaveBalance) : 20,
        attendance: Math.floor(Math.random() * 10) + 90,
        isFavorite: false,
        activityLog: [activityEntry],
      }
      saveStaff([...staff, newStaffMember])
      toast.success('Success', 'Staff member added successfully')
    }

    setShowAddDialog(false)
    setEditingStaff(null)
    resetForm()
  }

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member)
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email || '',
      phone: member.phone,
      role: member.role,
      department: member.department,
      employeeId: member.employeeId,
      joinDate: member.joinDate || '',
      address: member.address || '',
      emergencyContact: member.emergencyContact || '',
      emergencyPhone: member.emergencyPhone || '',
      emergencyRelation: member.emergencyRelation || '',
      notes: member.notes || '',
      salary: member.salary?.toString() || '',
      skills: member.skills?.join(', ') || '',
      dateOfBirth: member.dateOfBirth || '',
      gender: member.gender || '',
      maritalStatus: member.maritalStatus || '',
      bloodType: member.bloodType || '',
      nationalId: member.nationalId || '',
      bankName: member.bankName || '',
      bankAccount: member.bankAccount || '',
      shiftType: member.shiftType || '',
      contractType: member.contractType || '',
      reportsTo: member.reportsTo || '',
      certifications: member.certifications?.join(', ') || '',
      leaveBalance: member.leaveBalance?.toString() || '20',
    })
    setShowAddDialog(true)
  }

  const confirmDelete = (member: StaffMember) => {
    setStaffToDelete(member)
    setShowDeleteDialog(true)
  }

  const handleDelete = () => {
    if (staffToDelete) {
      const updated = staff.filter(s => s.id !== staffToDelete.id)
      saveStaff(updated)
      toast.success('Deleted', 'Staff member removed')
      setShowDetails(false)
      setShowDeleteDialog(false)
      setStaffToDelete(null)
    }
  }

  const handleBulkDelete = () => {
    const updated = staff.filter(s => !selectedStaffIds.has(s.id))
    saveStaff(updated)
    toast.success('Deleted', `${selectedStaffIds.size} staff members removed`)
    setSelectedStaffIds(new Set())
  }

  const handleBulkStatusChange = (status: StaffMember['status']) => {
    const updated = staff.map(s => 
      selectedStaffIds.has(s.id) ? { ...s, status } : s
    )
    saveStaff(updated)
    toast.success('Updated', `Status changed for ${selectedStaffIds.size} staff members`)
    setSelectedStaffIds(new Set())
  }

  const handleStatusChange = (id: string, status: StaffMember['status']) => {
    const activityEntry = {
      action: 'Status Changed',
      date: new Date().toISOString(),
      details: `Status changed to ${STATUS_CONFIG[status].label}`,
    }
    const updated = staff.map(s => 
      s.id === id ? { ...s, status, activityLog: [...(s.activityLog || []), activityEntry] } : s
    )
    saveStaff(updated)
    if (selectedStaff?.id === id) {
      setSelectedStaff({ ...selectedStaff, status })
    }
    toast.success('Updated', 'Status changed successfully')
  }

  const toggleFavorite = (id: string) => {
    const updated = staff.map(s => 
      s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
    )
    saveStaff(updated)
    if (selectedStaff?.id === id) {
      setSelectedStaff({ ...selectedStaff, isFavorite: !selectedStaff.isFavorite })
    }
  }

  const handleAddReview = () => {
    if (!selectedStaff || !reviewData.reviewer || !reviewData.comments) {
      toast.error('Error', 'Please fill in required fields')
      return
    }

    const newReview: PerformanceReview = {
      id: crypto.randomUUID(),
      staffId: selectedStaff.id,
      date: new Date().toISOString(),
      rating: reviewData.rating,
      reviewer: reviewData.reviewer,
      strengths: reviewData.strengths.split(',').map(s => s.trim()).filter(Boolean),
      improvements: reviewData.improvements.split(',').map(s => s.trim()).filter(Boolean),
      goals: reviewData.goals.split(',').map(s => s.trim()).filter(Boolean),
      comments: reviewData.comments,
    }

    saveReviews([...reviews, newReview])

    // Update staff performance based on review
    const staffReviews = [...reviews, newReview].filter(r => r.staffId === selectedStaff.id)
    const avgRating = staffReviews.reduce((acc, r) => acc + r.rating, 0) / staffReviews.length
    const performance = Math.round(avgRating * 20)

    const activityEntry = {
      action: 'Performance Review',
      date: new Date().toISOString(),
      details: `Review by ${reviewData.reviewer} - Rating: ${reviewData.rating}/5`,
    }

    const updated = staff.map(s => 
      s.id === selectedStaff.id 
        ? { 
            ...s, 
            rating: Math.round(avgRating * 10) / 10,
            performance,
            lastReviewDate: new Date().toISOString(),
            activityLog: [...(s.activityLog || []), activityEntry],
          } 
        : s
    )
    saveStaff(updated)
    setSelectedStaff(updated.find(s => s.id === selectedStaff.id) || null)

    setShowReviewDialog(false)
    setReviewData({ rating: 3, reviewer: '', strengths: '', improvements: '', goals: '', comments: '' })
    toast.success('Success', 'Performance review added')
  }

  const filteredStaff = useMemo(() => {
    let filtered = staff.filter(member => {
      const matchesSearch = 
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone.includes(searchQuery)
      const matchesDepartment = selectedDepartment === 'all' || member.department === selectedDepartment
      const matchesStatus = selectedStatus === 'all' || member.status === selectedStatus
      const matchesRole = selectedRole === 'all' || member.role === selectedRole
      const matchesShift = selectedShift === 'all' || member.shiftType === selectedShift
      const matchesFavorite = !showFavoritesOnly || member.isFavorite
      return matchesSearch && matchesDepartment && matchesStatus && matchesRole && matchesShift && matchesFavorite
    })

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
          break
        case 'joinDate':
          comparison = new Date(a.joinDate || 0).getTime() - new Date(b.joinDate || 0).getTime()
          break
        case 'performance':
          comparison = (a.performance || 0) - (b.performance || 0)
          break
        case 'department':
          comparison = a.department.localeCompare(b.department)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [staff, searchQuery, selectedDepartment, selectedStatus, selectedRole, selectedShift, showFavoritesOnly, sortBy, sortOrder])

  const stats = useMemo(() => {
    const totalSalary = staff.reduce((acc, s) => acc + (s.salary || 0), 0)
    const avgPerformance = staff.length > 0 
      ? Math.round(staff.reduce((acc, s) => acc + (s.performance || 0), 0) / staff.length) 
      : 0
    const avgAttendance = staff.length > 0
      ? Math.round(staff.reduce((acc, s) => acc + (s.attendance || 0), 0) / staff.length)
      : 0
    
    const thisMonthJoiners = staff.filter(s => {
      if (!s.joinDate) return false
      const joinDate = new Date(s.joinDate)
      const now = new Date()
      return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear()
    }).length

    const departmentCounts = staff.reduce((acc, s) => {
      acc[s.department] = (acc[s.department] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const roleCounts = staff.reduce((acc, s) => {
      acc[s.role] = (acc[s.role] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: staff.length,
      active: staff.filter(s => s.status === 'ACTIVE').length,
      onLeave: staff.filter(s => s.status === 'ON_LEAVE').length,
      inactive: staff.filter(s => s.status === 'INACTIVE').length,
      probation: staff.filter(s => s.status === 'PROBATION').length,
      terminated: staff.filter(s => s.status === 'TERMINATED').length,
      departments: [...new Set(staff.map(s => s.department))].length,
      totalSalary,
      avgPerformance,
      avgAttendance,
      thisMonthJoiners,
      favorites: staff.filter(s => s.isFavorite).length,
      departmentCounts,
      roleCounts,
      topPerformers: [...staff].sort((a, b) => (b.performance || 0) - (a.performance || 0)).slice(0, 5),
    }
  }, [staff])

  const getRoleInfo = (roleName: string) => {
    return ROLES.find(r => r.name === roleName) || ROLES[ROLES.length - 1]
  }

  const getStatusConfig = (status: StaffMember['status']) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE
  }

  const getYearsOfService = (joinDate?: string) => {
    if (!joinDate) return null
    return differenceInYears(new Date(), parseISO(joinDate))
  }

  const getAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null
    return differenceInYears(new Date(), parseISO(dateOfBirth))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied', 'Copied to clipboard')
  }

  const exportToCSV = () => {
    const headers = [
      'Employee ID', 'Name', 'Email', 'Phone', 'Role', 'Department', 
      'Status', 'Join Date', 'Contract Type', 'Shift', 'Performance', 'Attendance'
    ]
    const rows = staff.map(s => [
      s.employeeId,
      `${s.firstName} ${s.lastName}`,
      s.email || '',
      s.phone,
      s.role,
      s.department,
      s.status,
      s.joinDate || '',
      s.contractType || '',
      s.shiftType || '',
      s.performance?.toString() || '',
      s.attendance?.toString() || '',
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `staff_directory_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    toast.success('Exported', 'Staff data exported to CSV')
  }

  const printStaffCard = (member: StaffMember) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Staff ID Card - ${member.firstName} ${member.lastName}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .card { border: 2px solid #333; padding: 20px; max-width: 400px; margin: auto; }
              .header { text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 10px; }
              .photo { width: 100px; height: 100px; background: #eee; border-radius: 50%; margin: 10px auto; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: bold; }
              .name { font-size: 24px; font-weight: bold; }
              .id { color: #666; }
              .details { margin-top: 15px; }
              .row { display: flex; margin: 5px 0; }
              .label { width: 100px; font-weight: bold; color: #666; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <div class="photo">${getInitials(member.firstName, member.lastName)}</div>
                <div class="name">${member.firstName} ${member.lastName}</div>
                <div class="id">${member.employeeId}</div>
              </div>
              <div class="details">
                <div class="row"><span class="label">Role:</span> ${member.role}</div>
                <div class="row"><span class="label">Department:</span> ${member.department}</div>
                <div class="row"><span class="label">Phone:</span> ${member.phone}</div>
                <div class="row"><span class="label">Email:</span> ${member.email || 'N/A'}</div>
                <div class="row"><span class="label">Blood Type:</span> ${member.bloodType || 'N/A'}</div>
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const toggleSelectStaff = (id: string) => {
    const newSelected = new Set(selectedStaffIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedStaffIds(newSelected)
  }

  const selectAll = () => {
    if (selectedStaffIds.size === filteredStaff.length) {
      setSelectedStaffIds(new Set())
    } else {
      setSelectedStaffIds(new Set(filteredStaff.map(s => s.id)))
    }
  }

  const staffReviews = useMemo(() => {
    if (!selectedStaff) return []
    return reviews.filter(r => r.staffId === selectedStaff.id).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [reviews, selectedStaff])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Staff Directory
          </h2>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Manage {stats.total} staff members across {stats.departments} departments
            {/* Online/Offline Status */}
            <Badge variant="outline" className={cn(
              "text-xs gap-1",
              isOnline ? "border-emerald-500 text-emerald-600" : "border-orange-500 text-orange-600"
            )}>
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            {syncMeta.syncEnabled && (
              <Badge variant="outline" className="text-xs gap-1 border-blue-500 text-blue-600">
                <Cloud className="h-3 w-3" />
                Sync
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sync Status & Controls */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowSyncSettings(true)}
                  className={cn(
                    pendingChanges.length > 0 && "border-orange-500"
                  )}
                >
                  {syncMeta.syncEnabled ? (
                    <Cloud className="h-4 w-4" />
                  ) : (
                    <CloudOff className="h-4 w-4" />
                  )}
                  {pendingChanges.length > 0 && (
                    <span className="ml-1 text-xs bg-orange-500 text-white rounded-full px-1.5">
                      {pendingChanges.length}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {syncMeta.syncEnabled 
                  ? `Sync enabled${pendingChanges.length > 0 ? ` (${pendingChanges.length} pending)` : ''}`
                  : 'Sync settings (offline mode)'
                }
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Manual Sync Button */}
          {syncMeta.syncEnabled && isOnline && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSync}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSyncing ? 'Syncing...' : 'Sync now'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setShowAnalytics(!showAnalytics)}>
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Analytics</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={() => { resetForm(); setEditingStaff(null); setShowAddDialog(true) }}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </motion.div>

      {/* Analytics Panel */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-0 shadow-md bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Staff Analytics
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowAnalytics(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="text-center p-3 rounded-lg bg-background/80">
                    <p className="text-3xl font-bold text-primary">{stats.avgPerformance}%</p>
                    <p className="text-xs text-muted-foreground">Avg Performance</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/80">
                    <p className="text-3xl font-bold text-emerald-600">{stats.avgAttendance}%</p>
                    <p className="text-xs text-muted-foreground">Avg Attendance</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/80">
                    <p className="text-3xl font-bold text-blue-600">{stats.thisMonthJoiners}</p>
                    <p className="text-xs text-muted-foreground">New This Month</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/80">
                    <p className="text-3xl font-bold text-amber-600">{stats.onLeave}</p>
                    <p className="text-xs text-muted-foreground">On Leave</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/80">
                    <p className="text-3xl font-bold text-purple-600">{stats.probation}</p>
                    <p className="text-xs text-muted-foreground">In Probation</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-background/80">
                    <p className="text-3xl font-bold text-rose-600">{stats.favorites}</p>
                    <p className="text-xs text-muted-foreground">Favorites</p>
                  </div>
                </div>

                {/* Top Performers */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    Top Performers
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {stats.topPerformers.map((member, idx) => (
                      <div 
                        key={member.id} 
                        className="flex items-center gap-2 p-2 bg-background/80 rounded-lg min-w-[180px] cursor-pointer hover:bg-background transition-colors"
                        onClick={() => { setSelectedStaff(member); setShowDetails(true) }}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                          idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-slate-400'
                        )}>
                          {idx + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(member.firstName, member.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.firstName} {member.lastName}</p>
                          <p className="text-xs text-muted-foreground">{member.performance}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 grid-cols-2 lg:grid-cols-5"
      >
        {[
          { label: 'Total Staff', value: stats.total, icon: Users, color: 'from-blue-500 to-blue-600', change: stats.thisMonthJoiners > 0 ? `+${stats.thisMonthJoiners}` : null },
          { label: 'Active', value: stats.active, icon: UserCheck, color: 'from-emerald-500 to-emerald-600' },
          { label: 'On Leave', value: stats.onLeave, icon: Clock, color: 'from-amber-500 to-amber-600' },
          { label: 'Probation', value: stats.probation, icon: AlertCircle, color: 'from-blue-500 to-indigo-600' },
          { label: 'Departments', value: stats.departments, icon: Building2, color: 'from-purple-500 to-purple-600' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", stat.color)} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      {stat.change && (
                        <span className="text-xs text-emerald-600 flex items-center">
                          <ArrowUpRight className="h-3 w-3" />
                          {stat.change}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={cn("p-2.5 rounded-xl bg-gradient-to-br text-white shadow-lg", stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters & Actions */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search and Main Filters */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, ID, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-0"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-[160px] bg-muted/50 border-0">
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {DEPARTMENTS.map(d => (
                      <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-[150px] bg-muted/50 border-0">
                    <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {ROLES.map(r => (
                      <SelectItem key={r.name} value={r.name}>
                        <span className="mr-2">{r.icon}</span>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[130px] bg-muted/50 border-0">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Secondary Filters & View Controls */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={selectedShift} onValueChange={setSelectedShift}>
                  <SelectTrigger className="w-[120px] bg-muted/50 border-0 h-8 text-xs">
                    <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="Shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shifts</SelectItem>
                    <SelectItem value="Morning">Morning</SelectItem>
                    <SelectItem value="Evening">Evening</SelectItem>
                    <SelectItem value="Night">Night</SelectItem>
                    <SelectItem value="Rotating">Rotating</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[130px] bg-muted/50 border-0 h-8 text-xs">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="joinDate">Join Date</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                </Button>

                <Separator orientation="vertical" className="h-6" />

                <Button
                  variant={showFavoritesOnly ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                >
                  <Star className={cn("h-3.5 w-3.5", showFavoritesOnly && "fill-current")} />
                  <span className="text-xs">Favorites</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {selectedStaffIds.size > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {selectedStaffIds.size} selected
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          Bulk Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleBulkStatusChange('ACTIVE')}>
                          <UserCheck className="h-4 w-4 mr-2" /> Set Active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkStatusChange('ON_LEAVE')}>
                          <Clock className="h-4 w-4 mr-2" /> Set On Leave
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkStatusChange('INACTIVE')}>
                          <UserX className="h-4 w-4 mr-2" /> Set Inactive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={handleBulkDelete}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete Selected
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8"
                      onClick={() => setSelectedStaffIds(new Set())}
                    >
                      Clear
                    </Button>
                  </div>
                )}

                <Separator orientation="vertical" className="h-6" />
                
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
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setViewMode('table')}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredStaff.length} of {staff.length} staff members
        </p>
        {viewMode === 'table' && filteredStaff.length > 0 && (
          <Button variant="ghost" size="sm" onClick={selectAll}>
            {selectedStaffIds.size === filteredStaff.length ? 'Deselect All' : 'Select All'}
          </Button>
        )}
      </div>

      {/* Staff List */}
      <AnimatePresence mode="wait">
        {filteredStaff.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-0 shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">No staff members found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {staff.length === 0 ? 'Add your first staff member to get started' : 'Try adjusting your search or filters'}
                </p>
                {staff.length === 0 && (
                  <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff Member
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filteredStaff.map((member) => {
              const roleInfo = getRoleInfo(member.role)
              const statusConfig = getStatusConfig(member.status)
              const yearsOfService = getYearsOfService(member.joinDate)
              
              return (
                <motion.div key={member.id} variants={itemVariants} layout>
                  <Card 
                    className="group border-0 shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                    onClick={() => { setSelectedStaff(member); setShowDetails(true) }}
                  >
                    <CardContent className="p-0">
                      {/* Header gradient */}
                      <div className={cn("h-20 bg-gradient-to-br relative", 
                        member.status === 'ACTIVE' ? 'from-primary/20 to-primary/5' :
                        member.status === 'ON_LEAVE' ? 'from-amber-200/50 to-amber-100/20' :
                        member.status === 'PROBATION' ? 'from-blue-200/50 to-blue-100/20' :
                        'from-gray-200/50 to-gray-100/20'
                      )}>
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 bg-background/80 backdrop-blur"
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(member.id) }}
                          >
                            <Star className={cn("h-4 w-4", member.isFavorite && "fill-yellow-400 text-yellow-400")} />
                          </Button>
                          <Badge className={cn("text-xs", statusConfig.badgeColor)}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        {yearsOfService !== null && yearsOfService >= 5 && (
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                              <Award className="h-3 w-3 mr-1" />
                              {yearsOfService}+ yrs
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      {/* Avatar */}
                      <div className="px-4 -mt-10 relative z-10">
                        <Avatar className="h-20 w-20 border-4 border-background shadow-lg ring-2 ring-primary/10">
                          <AvatarFallback className={cn("text-xl font-bold text-white bg-gradient-to-br", roleInfo.gradient)}>
                            {getInitials(member.firstName, member.lastName)}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Info */}
                      <div className="p-4 pt-3 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                            {member.firstName} {member.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">{member.employeeId}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className={cn("text-xs", roleInfo.color)}>
                            <span className="mr-1">{roleInfo.icon}</span>
                            {member.role}
                          </Badge>
                          {member.contractType && (
                            <Badge variant="outline" className="text-xs">
                              {member.contractType}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{member.department}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{member.phone}</span>
                          </div>
                          {member.shiftType && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>{member.shiftType} Shift</span>
                            </div>
                          )}
                        </div>

                        {/* Performance & Attendance */}
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          {member.performance && (
                            <div className="text-center p-2 rounded-lg bg-muted/50">
                              <p className={cn(
                                "text-lg font-bold",
                                member.performance >= 80 ? 'text-emerald-600' :
                                member.performance >= 60 ? 'text-amber-600' : 'text-red-600'
                              )}>
                                {member.performance}%
                              </p>
                              <p className="text-[10px] text-muted-foreground">Performance</p>
                            </div>
                          )}
                          {member.attendance && (
                            <div className="text-center p-2 rounded-lg bg-muted/50">
                              <p className={cn(
                                "text-lg font-bold",
                                member.attendance >= 95 ? 'text-emerald-600' :
                                member.attendance >= 85 ? 'text-amber-600' : 'text-red-600'
                              )}>
                                {member.attendance}%
                              </p>
                              <p className="text-[10px] text-muted-foreground">Attendance</p>
                            </div>
                          )}
                        </div>

                        {/* Rating */}
                        {member.rating && (
                          <div className="flex items-center gap-1 justify-center pt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  "h-3.5 w-3.5",
                                  star <= member.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                )}
                              />
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">({member.rating})</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        ) : viewMode === 'list' ? (
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="divide-y">
              {filteredStaff.map((member) => {
                const roleInfo = getRoleInfo(member.role)
                const statusConfig = getStatusConfig(member.status)
                
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => { setSelectedStaff(member); setShowDetails(true) }}
                  >
                    <button
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleSelectStaff(member.id) }}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {selectedStaffIds.has(member.id) ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                    <Avatar className="h-12 w-12 border-2 border-background shadow">
                      <AvatarFallback className={cn("font-semibold text-white bg-gradient-to-br", roleInfo.gradient)}>
                        {getInitials(member.firstName, member.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{member.firstName} {member.lastName}</h3>
                        {member.isFavorite && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
                        <Badge className={cn("text-xs", statusConfig.badgeColor)}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.employeeId} • {member.department}</p>
                    </div>
                    <Badge variant="secondary" className={cn("text-xs hidden sm:flex", roleInfo.color)}>
                      <span className="mr-1">{roleInfo.icon}</span>
                      {member.role}
                    </Badge>
                    <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                      {member.performance && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className={cn(
                            "h-3.5 w-3.5",
                            member.performance >= 80 ? 'text-emerald-500' : 'text-amber-500'
                          )} />
                          <span>{member.performance}%</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{member.phone}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(member) }}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); printStaffCard(member) }}>
                          <Printer className="h-4 w-4 mr-2" /> Print ID Card
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleFavorite(member.id) }}>
                          {member.isFavorite ? <StarOff className="h-4 w-4 mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                          {member.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); confirmDelete(member) }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
                )
              })}
            </div>
          </Card>
        ) : (
          // Table View
          <Card className="border-0 shadow-md overflow-hidden">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]">
                      <button
                        onClick={() => selectAll()}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {selectedStaffIds.size === filteredStaff.length && filteredStaff.length > 0 ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead className="text-center">Performance</TableHead>
                    <TableHead className="text-center">Attendance</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((member) => {
                    const roleInfo = getRoleInfo(member.role)
                    const statusConfig = getStatusConfig(member.status)
                    
                    return (
                      <TableRow 
                        key={member.id}
                        className="cursor-pointer"
                        onClick={() => { setSelectedStaff(member); setShowDetails(true) }}
                      >
                        <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleSelectStaff(member.id)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            {selectedStaffIds.has(member.id) ? (
                              <CheckSquare className="h-5 w-5 text-primary" />
                            ) : (
                              <Square className="h-5 w-5" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={cn("text-xs text-white bg-gradient-to-br", roleInfo.gradient)}>
                                {getInitials(member.firstName, member.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium flex items-center gap-1">
                                {member.firstName} {member.lastName}
                                {member.isFavorite && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                              </p>
                              <p className="text-xs text-muted-foreground">{member.employeeId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn("text-xs", roleInfo.color)}>
                            <span className="mr-1">{roleInfo.icon}</span>
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{member.department}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs", statusConfig.badgeColor)}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{member.shiftType || '-'}</TableCell>
                        <TableCell className="text-center">
                          {member.performance ? (
                            <span className={cn(
                              "font-medium",
                              member.performance >= 80 ? 'text-emerald-600' :
                              member.performance >= 60 ? 'text-amber-600' : 'text-red-600'
                            )}>
                              {member.performance}%
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {member.attendance ? (
                            <span className={cn(
                              "font-medium",
                              member.attendance >= 95 ? 'text-emerald-600' :
                              member.attendance >= 85 ? 'text-amber-600' : 'text-red-600'
                            )}>
                              {member.attendance}%
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-sm">{member.phone}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(member)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => printStaffCard(member)}>
                                <Printer className="h-4 w-4 mr-2" /> Print ID
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => confirmDelete(member)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        )}
      </AnimatePresence>

      {/* Details Sheet */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {selectedStaff && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20 border-4 ring-2 ring-primary/20">
                    <AvatarFallback className={cn("text-2xl font-bold text-white bg-gradient-to-br", getRoleInfo(selectedStaff.role).gradient)}>
                      {getInitials(selectedStaff.firstName, selectedStaff.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <SheetTitle className="text-xl">
                        {selectedStaff.firstName} {selectedStaff.lastName}
                      </SheetTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleFavorite(selectedStaff.id)}
                      >
                        <Star className={cn("h-4 w-4", selectedStaff.isFavorite && "fill-yellow-400 text-yellow-400")} />
                      </Button>
                    </div>
                    <SheetDescription className="flex items-center gap-2">
                      {selectedStaff.employeeId}
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard(selectedStaff.employeeId)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </SheetDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={cn(getStatusConfig(selectedStaff.status).badgeColor)}>
                        {getStatusConfig(selectedStaff.status).label}
                      </Badge>
                      <Badge variant="secondary" className={cn("text-xs", getRoleInfo(selectedStaff.role).color)}>
                        <span className="mr-1">{getRoleInfo(selectedStaff.role).icon}</span>
                        {selectedStaff.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="contact" className="text-xs">Contact</TabsTrigger>
                  <TabsTrigger value="work" className="text-xs">Work</TabsTrigger>
                  <TabsTrigger value="reviews" className="text-xs">Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 mt-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="border-0 bg-muted/50">
                      <CardContent className="p-3 text-center">
                        <p className={cn(
                          "text-2xl font-bold",
                          (selectedStaff.performance || 0) >= 80 ? 'text-emerald-600' : 'text-amber-600'
                        )}>
                          {selectedStaff.performance || 0}%
                        </p>
                        <p className="text-xs text-muted-foreground">Performance</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 bg-muted/50">
                      <CardContent className="p-3 text-center">
                        <p className={cn(
                          "text-2xl font-bold",
                          (selectedStaff.attendance || 0) >= 95 ? 'text-emerald-600' : 'text-amber-600'
                        )}>
                          {selectedStaff.attendance || 0}%
                        </p>
                        <p className="text-xs text-muted-foreground">Attendance</p>
                      </CardContent>
                    </Card>
                    <Card className="border-0 bg-muted/50">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedStaff.leaveBalance || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Leave Days</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Rating */}
                  {selectedStaff.rating && (
                    <Card className="border-0 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Overall Rating</p>
                            <div className="flex items-center gap-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    "h-5 w-5",
                                    star <= selectedStaff.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  )}
                                />
                              ))}
                              <span className="text-sm font-medium ml-2">{selectedStaff.rating}/5</span>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => setShowReviewDialog(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Review
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Personal Info */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Personal Information</p>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedStaff.dateOfBirth && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <Cake className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Birthday</p>
                            <p className="text-sm font-medium">
                              {format(parseISO(selectedStaff.dateOfBirth), 'MMM d, yyyy')}
                              {getAge(selectedStaff.dateOfBirth) && (
                                <span className="text-muted-foreground ml-1">({getAge(selectedStaff.dateOfBirth)} yrs)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedStaff.gender && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Gender</p>
                            <p className="text-sm font-medium">{selectedStaff.gender}</p>
                          </div>
                        </div>
                      )}
                      {selectedStaff.bloodType && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <Heart className="h-4 w-4 text-red-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Blood Type</p>
                            <p className="text-sm font-medium">{selectedStaff.bloodType}</p>
                          </div>
                        </div>
                      )}
                      {selectedStaff.nationalId && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">National ID</p>
                            <p className="text-sm font-medium">{selectedStaff.nationalId}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills & Certifications */}
                  {(selectedStaff.skills?.length || selectedStaff.certifications?.length) ? (
                    <div className="space-y-3">
                      {selectedStaff.skills && selectedStaff.skills.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Skills</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedStaff.skills.map((skill, i) => (
                              <Badge key={i} variant="secondary" className="bg-primary/10">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedStaff.certifications && selectedStaff.certifications.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Certifications</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedStaff.certifications.map((cert, i) => (
                              <Badge key={i} variant="outline" className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300">
                                <GraduationCap className="h-3 w-3 mr-1" />
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Activity Log */}
                  {selectedStaff.activityLog && selectedStaff.activityLog.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                          <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <History className="h-4 w-4" />
                            Activity Log ({selectedStaff.activityLog.length})
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 pt-2">
                        {selectedStaff.activityLog.slice(0, 5).map((activity, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg text-sm">
                            <Activity className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">{activity.action}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(parseISO(activity.date), { addSuffix: true })}
                                {activity.details && ` • ${activity.details}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </TabsContent>

                <TabsContent value="contact" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedStaff.phone}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(selectedStaff.phone)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {selectedStaff.email && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedStaff.email}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(selectedStaff.email!)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {selectedStaff.address && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="font-medium">{selectedStaff.address}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {(selectedStaff.emergencyContact || selectedStaff.emergencyPhone) && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Emergency Contact
                        </p>
                        <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10">
                          <CardContent className="p-3 space-y-2">
                            {selectedStaff.emergencyContact && (
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{selectedStaff.emergencyContact}</p>
                                {selectedStaff.emergencyRelation && (
                                  <Badge variant="outline" className="text-xs">{selectedStaff.emergencyRelation}</Badge>
                                )}
                              </div>
                            )}
                            {selectedStaff.emergencyPhone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" />
                                {selectedStaff.emergencyPhone}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="work" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Department</p>
                      <p className="font-medium">{selectedStaff.department}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Role</p>
                      <p className="font-medium">{selectedStaff.role}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Join Date</p>
                      <p className="font-medium">
                        {selectedStaff.joinDate ? format(parseISO(selectedStaff.joinDate), 'MMM d, yyyy') : 'Not set'}
                        {getYearsOfService(selectedStaff.joinDate) !== null && (
                          <span className="text-muted-foreground ml-1">
                            ({getYearsOfService(selectedStaff.joinDate)} years)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                      <Select
                        value={selectedStaff.status}
                        onValueChange={(v) => handleStatusChange(selectedStaff.id, v as StaffMember['status'])}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedStaff.contractType && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Contract</p>
                        <p className="font-medium">{selectedStaff.contractType}</p>
                      </div>
                    )}
                    {selectedStaff.shiftType && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Shift</p>
                        <p className="font-medium">{selectedStaff.shiftType}</p>
                      </div>
                    )}
                    {selectedStaff.reportsTo && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Reports To</p>
                        <p className="font-medium">{selectedStaff.reportsTo}</p>
                      </div>
                    )}
                  </div>

                  {/* Bank Details */}
                  {(selectedStaff.bankName || selectedStaff.bankAccount) && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Landmark className="h-4 w-4" />
                          Bank Details
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {selectedStaff.bankName && (
                            <div className="p-2 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">Bank</p>
                              <p className="text-sm font-medium">{selectedStaff.bankName}</p>
                            </div>
                          )}
                          {selectedStaff.bankAccount && (
                            <div className="p-2 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">Account</p>
                              <p className="text-sm font-medium">{selectedStaff.bankAccount}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedStaff.notes && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</p>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedStaff.notes}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Performance Reviews</p>
                    <Button size="sm" onClick={() => setShowReviewDialog(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Review
                    </Button>
                  </div>

                  {staffReviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">No reviews yet</p>
                      <p className="text-sm">Add a performance review to track progress</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {staffReviews.map((review) => (
                        <Card key={review.id} className="border shadow-sm">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{review.reviewer}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(parseISO(review.date), 'MMM d, yyyy')}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={cn(
                                      "h-4 w-4",
                                      star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm">{review.comments}</p>
                            {review.strengths.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {review.strengths.map((s, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {s}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {review.goals.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {review.goals.map((g, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    <Target className="h-3 w-3 mr-1" />
                                    {g}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-6 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => { setShowDetails(false); handleEdit(selectedStaff) }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => printStaffCard(selectedStaff)}>
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="destructive" onClick={() => confirmDelete(selectedStaff)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingStaff ? (
                <>
                  <Edit className="h-5 w-5" />
                  Edit Staff Member
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Add New Staff Member
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingStaff ? 'Update the staff member information' : 'Fill in the details to add a new staff member'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="basic" className="text-xs">Basic Info</TabsTrigger>
              <TabsTrigger value="work" className="text-xs">Work Details</TabsTrigger>
              <TabsTrigger value="personal" className="text-xs">Personal</TabsTrigger>
              <TabsTrigger value="contact" className="text-xs">Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St, City"
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="work" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) => setFormData({ ...formData, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.name} value={role.name}>
                          <span className="mr-2">{role.icon}</span>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(v) => setFormData({ ...formData, department: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Join Date</Label>
                  <Input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contract Type</Label>
                  <Select
                    value={formData.contractType}
                    onValueChange={(v) => setFormData({ ...formData, contractType: v as typeof formData.contractType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Shift Type</Label>
                  <Select
                    value={formData.shiftType}
                    onValueChange={(v) => setFormData({ ...formData, shiftType: v as typeof formData.shiftType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning">Morning</SelectItem>
                      <SelectItem value="Evening">Evening</SelectItem>
                      <SelectItem value="Night">Night</SelectItem>
                      <SelectItem value="Rotating">Rotating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salary (Monthly)</Label>
                  <Input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Leave Balance (Days)</Label>
                  <Input
                    type="number"
                    value={formData.leaveBalance}
                    onChange={(e) => setFormData({ ...formData, leaveBalance: e.target.value })}
                    placeholder="20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reports To</Label>
                <Input
                  value={formData.reportsTo}
                  onChange={(e) => setFormData({ ...formData, reportsTo: e.target.value })}
                  placeholder="Manager name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Skills (comma-separated)</Label>
                  <Input
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="First Aid, CPR, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Certifications (comma-separated)</Label>
                  <Input
                    value={formData.certifications}
                    onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                    placeholder="BLS, ACLS, etc."
                  />
                </div>
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
            </TabsContent>

            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(v) => setFormData({ ...formData, gender: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marital Status</Label>
                  <Select
                    value={formData.maritalStatus}
                    onValueChange={(v) => setFormData({ ...formData, maritalStatus: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Blood Type</Label>
                  <Select
                    value={formData.bloodType}
                    onValueChange={(v) => setFormData({ ...formData, bloodType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>National ID / SSN</Label>
                <Input
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  placeholder="ID number"
                />
              </div>
              <Separator />
              <p className="text-sm font-medium flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Bank Details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="Bank name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    placeholder="Account number"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Emergency Contact
                  </CardTitle>
                  <CardDescription>Contact person in case of emergency</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contact Name</Label>
                      <Input
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Input
                        value={formData.emergencyRelation}
                        onChange={(e) => setFormData({ ...formData, emergencyRelation: e.target.value })}
                        placeholder="Spouse, Parent, etc."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-primary/80">
              <BadgeCheck className="h-4 w-4 mr-2" />
              {editingStaff ? 'Save Changes' : 'Add Staff Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Staff Member?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete <strong>{staffToDelete?.firstName} {staffToDelete?.lastName}</strong>? 
            This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Performance Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Add Performance Review
            </DialogTitle>
            <DialogDescription>
              Add a performance review for {selectedStaff?.firstName} {selectedStaff?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 transition-colors",
                        star <= reviewData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                      )}
                    />
                  </button>
                ))}
                <span className="text-lg font-medium ml-2">{reviewData.rating}/5</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reviewer Name *</Label>
              <Input
                value={reviewData.reviewer}
                onChange={(e) => setReviewData({ ...reviewData, reviewer: e.target.value })}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label>Strengths (comma-separated)</Label>
              <Input
                value={reviewData.strengths}
                onChange={(e) => setReviewData({ ...reviewData, strengths: e.target.value })}
                placeholder="Teamwork, Communication, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Areas for Improvement (comma-separated)</Label>
              <Input
                value={reviewData.improvements}
                onChange={(e) => setReviewData({ ...reviewData, improvements: e.target.value })}
                placeholder="Time management, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Goals (comma-separated)</Label>
              <Input
                value={reviewData.goals}
                onChange={(e) => setReviewData({ ...reviewData, goals: e.target.value })}
                placeholder="Complete certification, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Comments *</Label>
              <Textarea
                value={reviewData.comments}
                onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value })}
                placeholder="Overall feedback and comments..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddReview}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync Settings Dialog */}
      <Dialog open={showSyncSettings} onOpenChange={setShowSyncSettings}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-500" />
              Sync & Cross-Device Settings
            </DialogTitle>
            <DialogDescription>
              Configure online/offline sync settings for cross-device access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Wifi className="h-5 w-5 text-emerald-600" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <WifiOff className="h-5 w-5 text-orange-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{isOnline ? 'Online' : 'Offline'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isOnline ? 'Connected to internet' : 'Working locally'}
                  </p>
                </div>
              </div>
              <Badge variant={isOnline ? "default" : "secondary"}>
                {isOnline ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>

            {/* Sync Mode Toggle */}
            <div className="space-y-3">
              <Label className="text-base">Sync Mode</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => toggleSync(false)}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition-all",
                    !syncMeta.syncEnabled 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CloudOff className="h-5 w-5" />
                    <span className="font-semibold">Offline Only</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Data stored locally on this device only. No internet required.
                  </p>
                </button>
                <button
                  onClick={() => syncMeta.serverUrl && toggleSync(true)}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition-all",
                    syncMeta.syncEnabled 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-muted-foreground/50",
                    !syncMeta.serverUrl && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!syncMeta.serverUrl}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="h-5 w-5" />
                    <span className="font-semibold">Online Sync</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sync across devices. Access from anywhere.
                  </p>
                </button>
              </div>
            </div>

            {/* Server URL Configuration */}
            <div className="space-y-2">
              <Label>Sync Server URL</Label>
              <div className="flex gap-2">
                <Input
                  value={syncServerUrl || syncMeta.serverUrl || ''}
                  onChange={(e) => setSyncServerUrl(e.target.value)}
                  placeholder="https://api.yourserver.com"
                  className="flex-1"
                />
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (syncServerUrl) {
                      const updatedMeta = { ...syncMeta, serverUrl: syncServerUrl }
                      setSyncMeta(updatedMeta)
                      localStorage.setItem(SYNC_KEY, JSON.stringify(updatedMeta))
                      toast.success('Saved', 'Server URL configured')
                    }
                  }}
                  disabled={!syncServerUrl}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your backend server URL for cross-device sync
              </p>
            </div>

            {/* Sync Status */}
            <div className="space-y-3">
              <Label className="text-base">Sync Status</Label>
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Synced</span>
                  <span className="text-sm font-medium">
                    {syncMeta.lastSyncAt 
                      ? formatDistanceToNow(parseISO(syncMeta.lastSyncAt), { addSuffix: true })
                      : 'Never'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending Changes</span>
                  <Badge variant={pendingChanges.length > 0 ? "destructive" : "secondary"}>
                    {pendingChanges.length} {pendingChanges.length === 1 ? 'change' : 'changes'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Device ID</span>
                  <code className="text-xs bg-background px-2 py-1 rounded">
                    {syncMeta.deviceId.slice(0, 12)}...
                  </code>
                </div>
              </div>
            </div>

            {/* Current Device Info */}
            <div className="space-y-3">
              <Label className="text-base">This Device</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                {getDeviceType() === 'desktop' && <Monitor className="h-8 w-8 text-muted-foreground" />}
                {getDeviceType() === 'mobile' && <Smartphone className="h-8 w-8 text-muted-foreground" />}
                {getDeviceType() === 'tablet' && <Laptop className="h-8 w-8 text-muted-foreground" />}
                <div>
                  <p className="font-medium capitalize">{getDeviceType()}</p>
                  <p className="text-xs text-muted-foreground">
                    {navigator.userAgent.split('(')[1]?.split(')')[0] || 'Unknown device'}
                  </p>
                </div>
              </div>
            </div>

            {/* Sync Actions */}
            {syncMeta.syncEnabled && (
              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={handleSync}
                  disabled={!isOnline || isSyncing}
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Now
                    </>
                  )}
                </Button>
                {pendingChanges.length > 0 && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setPendingChanges([])
                      localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify([]))
                      toast.info('Cleared', 'Pending changes discarded')
                    }}
                  >
                    Clear Pending
                  </Button>
                )}
              </div>
            )}

            {/* Info Box */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700 dark:text-blue-400">How Sync Works</p>
                  <ul className="mt-1 text-blue-600/80 dark:text-blue-400/80 space-y-1">
                    <li>• Changes are saved locally first (works offline)</li>
                    <li>• When online, changes sync to server automatically</li>
                    <li>• Access your data from any device with same server</li>
                    <li>• Conflicts are resolved using last-write-wins</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowSyncSettings(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
