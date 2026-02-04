import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, formatDistanceToNow, differenceInYears, parseISO, isValid } from 'date-fns'
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
  Loader2,
  Undo2,
  Redo2,
  Keyboard,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Upload,
  FileUp,
  Bell,
  BellRing,
  GitCompare,
  Columns,
  SendHorizontal,
  ClipboardList,
  TrendingDown,
  AlertOctagon,
  PartyPopper,
  Sparkles,
  ZoomIn,
  MessageSquare,
  Calendar,
  ArrowRightLeft,
  Gauge,
  PhoneCall,
  MessageCircle,
  Share2,
  StickyNote,
  CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { useToast } from '@/components/ui/toast'
import { getInitials, cn } from '@/lib/utils'

// ==================== TYPES & INTERFACES ====================
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
  createdAt?: string
  updatedAt?: string
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

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  role?: string
  department?: string
  salary?: string
  dateOfBirth?: string
  nationalId?: string
  bankAccount?: string
}

interface UndoState {
  staff: StaffMember[]
  reviews: PerformanceReview[]
  action: string
}

// ==================== CONSTANTS ====================
const STORAGE_KEY = 'tansiq_staff_directory'
const REVIEWS_KEY = 'tansiq_staff_reviews'
const SYNC_KEY = 'tansiq_staff_sync_meta'
const PENDING_CHANGES_KEY = 'tansiq_staff_pending_changes'
const PREFERENCES_KEY = 'tansiq_staff_preferences'

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const
const DEFAULT_ITEMS_PER_PAGE = 25
const MAX_UNDO_HISTORY = 20
const DEBOUNCE_DELAY = 300
const SYNC_RETRY_DELAY = 5000
const MAX_SYNC_RETRIES = 3
const COMPARISON_MAX = 4
const RECENT_ACTIVITY_LIMIT = 20

// Validation patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[\d\s\-+()]{7,20}$/
const NAME_REGEX = /^[a-zA-Z\s'-]{2,50}$/

// ==================== ROLE & DEPARTMENT CONFIG ====================
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
] as const

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
] as const

const STATUS_CONFIG = {
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
} as const

// ==================== UTILITY FUNCTIONS ====================
// Sanitize string input
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/<[^>]*>/g, '').slice(0, 500)
}

// Validate email
const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email)
}

// Validate phone
const isValidPhone = (phone: string): boolean => {
  return PHONE_REGEX.test(phone)
}

// Validate name
const isValidName = (name: string): boolean => {
  return NAME_REGEX.test(name)
}

// Parse date safely
const parseDate = (dateStr: string): Date | null => {
  try {
    const date = parseISO(dateStr)
    return isValid(date) ? date : null
  } catch {
    return null
  }
}

// Format currency - used for salary display
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Debounce function - utility for rate limiting
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// ==================== SYNC & STORAGE ====================

// Sync and Online/Offline Types
interface SyncMeta {
  lastSyncAt: string | null
  deviceId: string
  syncEnabled: boolean
  serverUrl: string | null
  syncInterval?: number
}

interface PendingChange {
  id: string
  type: 'create' | 'update' | 'delete'
  entityType: 'staff' | 'review'
  entityId: string
  data: StaffMember | PerformanceReview | null
  timestamp: string
  retryCount?: number
}

// Safe localStorage operations with error handling
function safeGetFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage [${key}]:`, error)
    return defaultValue
  }
}

function safeSetToStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Error writing to localStorage [${key}]:`, error)
    // Handle quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, clearing old data...')
    }
    return false
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function safeRemoveFromStorage(key: string): boolean {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Error removing from localStorage [${key}]:`, error)
    return false
  }
}

// Generate unique device ID
const getDeviceId = (): string => {
  let deviceId = safeGetFromStorage<string | null>('tansiq_device_id', null)
  if (!deviceId) {
    deviceId = `device_${crypto.randomUUID()}`
    safeSetToStorage('tansiq_device_id', deviceId)
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

// ==================== LOADING SKELETON COMPONENT ====================
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

// ==================== EMPTY STATE COMPONENT ====================
const EmptyState = memo(function EmptyState({ 
  icon,
  title, 
  description, 
  action 
}: { 
  icon?: React.ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="flex flex-col items-center justify-center py-16 px-4">
        <div className="h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          {icon || <Users className="h-12 w-12 text-muted-foreground/50" />}
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mt-1">{description}</p>
        {action && (
          <Button onClick={action.onClick} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
})

// ==================== ANIMATION VARIANTS ====================
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

export function StaffDirectory() {
  const toast = useToast()
  
  // ==================== STATE ====================
  // Core data state
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedShift, setSelectedShift] = useState<string>('all')
  
  // View and UI state
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
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  
  // New Feature States
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showCompareDialog, setShowCompareDialog] = useState(false)
  const [compareStaff, setCompareStaff] = useState<StaffMember[]>([])
  const [showAlertsPanel, setShowAlertsPanel] = useState(false)
  const [showActivityTimeline, setShowActivityTimeline] = useState(false)
  const [quickFilter, setQuickFilter] = useState<'all' | 'birthday' | 'review-due' | 'new-joiners' | 'top-performers' | 'low-attendance'>('all')
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [advancedSearchFields, setAdvancedSearchFields] = useState({
    name: '',
    email: '',
    department: '',
    role: '',
    minPerformance: '',
    maxPerformance: '',
    joinDateFrom: '',
    joinDateTo: '',
  })
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  
  // Staff Notes System
  const [staffNotes, setStaffNotes] = useState<Record<string, Array<{
    id: string
    text: string
    timestamp: string
    isPrivate: boolean
    author: string
  }>>>({})
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteIsPrivate, setNoteIsPrivate] = useState(true)
  
  // Shift Schedule Viewer
  const [showShiftSchedule, setShowShiftSchedule] = useState(false)
  const [selectedScheduleStaff, setSelectedScheduleStaff] = useState<StaffMember | null>(null)
  
  // Department Transfer History
  const [showTransferHistory, setShowTransferHistory] = useState(false)
  const [transferHistoryStaff, setTransferHistoryStaff] = useState<StaffMember | null>(null)
  
  // Staff Workload
  const [showWorkloadOverview, setShowWorkloadOverview] = useState(false)
  
  // Quick Contact Actions
  const [showContactActions, setShowContactActions] = useState(false)
  const [contactActionsStaff, setContactActionsStaff] = useState<StaffMember | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE)
  
  // Undo/Redo state
  const [undoStack, setUndoStack] = useState<UndoState[]>([])
  const [redoStack, setRedoStack] = useState<UndoState[]>([])
  
  // Form validation state
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isFormDirty, setIsFormDirty] = useState(false)

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
  const [syncRetryCount, setSyncRetryCount] = useState(0)
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // ==================== DEBOUNCED SEARCH ====================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1) // Reset to first page on search
    }, DEBOUNCE_DELAY)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // ==================== KEYBOARD SHORTCUTS ====================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      // Ctrl/Cmd + N: New staff
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        resetForm()
        setEditingStaff(null)
        setShowAddDialog(true)
      }
      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      // Ctrl/Cmd + Shift + Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        handleRedo()
      }
      // Escape: Close dialogs
      if (e.key === 'Escape') {
        if (showAddDialog) setShowAddDialog(false)
        if (showDetails) setShowDetails(false)
        if (showDeleteDialog) setShowDeleteDialog(false)
        if (showSyncSettings) setShowSyncSettings(false)
      }
      // ?: Show keyboard shortcuts
      if (e.key === '?') {
        e.preventDefault()
        setShowKeyboardShortcuts(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showAddDialog, showDetails, showDeleteDialog, showSyncSettings])

  // ==================== ONLINE/OFFLINE DETECTION ====================
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Online', 'You are now connected to the internet')
      // Auto-sync when coming back online with retry logic
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

  // ==================== LOAD DATA FROM STORAGE ====================
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Simulate minimum loading time for better UX
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const stored = safeGetFromStorage<StaffMember[]>(STORAGE_KEY, [])
        setStaff(stored)
        
        const storedReviews = safeGetFromStorage<PerformanceReview[]>(REVIEWS_KEY, [])
        setReviews(storedReviews)
        
        // Load sync metadata
        const storedSyncMeta = safeGetFromStorage<SyncMeta | null>(SYNC_KEY, null)
        if (storedSyncMeta) {
          setSyncMeta(storedSyncMeta)
        }
        
        // Load pending changes
        const storedPending = safeGetFromStorage<PendingChange[]>(PENDING_CHANGES_KEY, [])
        setPendingChanges(storedPending)
        
        // Load preferences
        const preferences = safeGetFromStorage<{ viewMode?: string; itemsPerPage?: number }>(PREFERENCES_KEY, {})
        if (preferences.viewMode) setViewMode(preferences.viewMode as 'grid' | 'list' | 'table')
        if (preferences.itemsPerPage) setItemsPerPage(preferences.itemsPerPage)
        
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Load Error', 'Failed to load staff data')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // ==================== SAVE PREFERENCES ====================
  useEffect(() => {
    safeSetToStorage(PREFERENCES_KEY, { viewMode, itemsPerPage })
  }, [viewMode, itemsPerPage])

  // ==================== UNDO/REDO FUNCTIONS ====================
  const saveUndoState = useCallback((action: string) => {
    setUndoStack(prev => {
      const newStack = [...prev, { staff, reviews, action }]
      // Limit undo history
      if (newStack.length > MAX_UNDO_HISTORY) {
        return newStack.slice(-MAX_UNDO_HISTORY)
      }
      return newStack
    })
    setRedoStack([]) // Clear redo stack on new action
  }, [staff, reviews])

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) {
      toast.info('Nothing to Undo', 'No more actions to undo')
      return
    }
    
    const lastState = undoStack[undoStack.length - 1]
    setRedoStack(prev => [...prev, { staff, reviews, action: 'Undo' }])
    setUndoStack(prev => prev.slice(0, -1))
    
    setStaff(lastState.staff)
    setReviews(lastState.reviews)
    safeSetToStorage(STORAGE_KEY, lastState.staff)
    safeSetToStorage(REVIEWS_KEY, lastState.reviews)
    
    toast.info('Undone', `Reversed: ${lastState.action}`)
  }, [undoStack, staff, reviews, toast])

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) {
      toast.info('Nothing to Redo', 'No more actions to redo')
      return
    }
    
    const lastState = redoStack[redoStack.length - 1]
    setUndoStack(prev => [...prev, { staff, reviews, action: 'Redo' }])
    setRedoStack(prev => prev.slice(0, -1))
    
    setStaff(lastState.staff)
    setReviews(lastState.reviews)
    safeSetToStorage(STORAGE_KEY, lastState.staff)
    safeSetToStorage(REVIEWS_KEY, lastState.reviews)
    
    toast.info('Redone', 'Action restored')
  }, [redoStack, staff, reviews, toast])

  // ==================== FORM VALIDATION ====================
  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {}
    
    // Required field validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    } else if (!isValidName(formData.firstName)) {
      errors.firstName = 'Invalid first name format'
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    } else if (!isValidName(formData.lastName)) {
      errors.lastName = 'Invalid last name format'
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!isValidPhone(formData.phone)) {
      errors.phone = 'Invalid phone number format'
    }
    
    if (!formData.role) {
      errors.role = 'Role is required'
    }
    
    if (!formData.department) {
      errors.department = 'Department is required'
    }
    
    // Optional field validation
    if (formData.email && !isValidEmail(formData.email)) {
      errors.email = 'Invalid email format'
    }
    
    if (formData.salary && (isNaN(Number(formData.salary)) || Number(formData.salary) < 0)) {
      errors.salary = 'Invalid salary amount'
    }
    
    if (formData.dateOfBirth) {
      const dob = parseDate(formData.dateOfBirth)
      if (!dob) {
        errors.dateOfBirth = 'Invalid date format'
      } else if (dob > new Date()) {
        errors.dateOfBirth = 'Date of birth cannot be in the future'
      }
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  // ==================== ADD PENDING CHANGE FOR SYNC ====================
  const addPendingChange = useCallback((change: Omit<PendingChange, 'id' | 'timestamp'>) => {
    const newChange: PendingChange = {
      ...change,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
    }
    setPendingChanges(prev => {
      const updated = [...prev, newChange]
      safeSetToStorage(PENDING_CHANGES_KEY, updated)
      return updated
    })
  }, [])

  // ==================== SYNC WITH SERVER ====================
  const handleSync = useCallback(async () => {
    if (!syncMeta.syncEnabled || !syncMeta.serverUrl) {
      toast.error('Sync Error', 'Please configure sync settings first')
      return
    }

    if (syncRetryCount >= MAX_SYNC_RETRIES) {
      toast.error('Sync Failed', 'Maximum retry attempts reached. Please try again later.')
      setSyncRetryCount(0)
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
      //   headers: { 
      //     'Content-Type': 'application/json',
      //     'X-Device-Id': syncMeta.deviceId,
      //   },
      //   body: JSON.stringify({
      //     deviceId: syncMeta.deviceId,
      //     pendingChanges,
      //     lastSyncAt: syncMeta.lastSyncAt,
      //   }),
      // })
      // if (!response.ok) throw new Error(`HTTP ${response.status}`)
      // const { staff: serverStaff, reviews: serverReviews } = await response.json()
      // setStaff(serverStaff)
      // setReviews(serverReviews)

      // Clear pending changes after successful sync
      setPendingChanges([])
      safeSetToStorage(PENDING_CHANGES_KEY, [])

      // Update sync metadata
      const updatedMeta = {
        ...syncMeta,
        lastSyncAt: new Date().toISOString(),
      }
      setSyncMeta(updatedMeta)
      safeSetToStorage(SYNC_KEY, updatedMeta)
      setSyncRetryCount(0)

      toast.success('Synced', 'Data synchronized successfully')
    } catch (error) {
      console.error('Sync error:', error)
      setSyncRetryCount(prev => prev + 1)
      
      // Schedule retry
      if (syncRetryCount < MAX_SYNC_RETRIES - 1) {
        setTimeout(() => {
          if (isOnline) handleSync()
        }, SYNC_RETRY_DELAY * (syncRetryCount + 1))
        toast.warning('Sync Retry', `Sync failed. Retrying in ${(SYNC_RETRY_DELAY * (syncRetryCount + 1)) / 1000}s...`)
      } else {
        toast.error('Sync Failed', 'Unable to sync data. Please try again later.')
      }
    } finally {
      setIsSyncing(false)
    }
  }, [syncMeta, pendingChanges, toast, syncRetryCount, isOnline])

  // Enable/Disable sync
  const toggleSync = useCallback((enabled: boolean, serverUrl?: string) => {
    const updatedMeta: SyncMeta = {
      ...syncMeta,
      syncEnabled: enabled,
      serverUrl: serverUrl || syncMeta.serverUrl,
    }
    setSyncMeta(updatedMeta)
    safeSetToStorage(SYNC_KEY, updatedMeta)

    if (enabled) {
      toast.success('Sync Enabled', 'Cross-device sync is now active')
    } else {
      toast.info('Sync Disabled', 'Working in offline mode only')
    }
  }, [syncMeta, toast])

  // ==================== SAVE FUNCTIONS WITH UNDO SUPPORT ====================
  const saveStaff = useCallback((newStaff: StaffMember[], changeType?: 'create' | 'update' | 'delete', entityId?: string, actionDescription?: string) => {
    // Save undo state before making changes
    if (actionDescription) {
      saveUndoState(actionDescription)
    }
    
    const success = safeSetToStorage(STORAGE_KEY, newStaff)
    if (!success) {
      toast.error('Save Error', 'Failed to save staff data')
      return
    }
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
  }, [syncMeta.syncEnabled, addPendingChange, saveUndoState, toast])

  const saveReviews = useCallback((newReviews: PerformanceReview[], changeType?: 'create' | 'update' | 'delete', entityId?: string, actionDescription?: string) => {
    // Save undo state before making changes
    if (actionDescription) {
      saveUndoState(actionDescription)
    }
    
    const success = safeSetToStorage(REVIEWS_KEY, newReviews)
    if (!success) {
      toast.error('Save Error', 'Failed to save review data')
      return
    }
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
  }, [syncMeta.syncEnabled, addPendingChange, saveUndoState, toast])

  // ==================== FORM RESET ====================
  const resetForm = useCallback(() => {
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
    setFormErrors({})
    setIsFormDirty(false)
  }, [])

  // ==================== EMPLOYEE ID GENERATOR ====================
  const generateEmployeeId = useCallback(() => {
    const prefix = 'EMP'
    const year = new Date().getFullYear()
    const number = String(staff.length + 1).padStart(4, '0')
    return `${prefix}-${year}-${number}`
  }, [staff.length])

  // ==================== FORM SAVE HANDLER ====================
  const handleSave = useCallback(async () => {
    // Validate form
    if (!validateForm()) {
      toast.error('Validation Error', 'Please correct the errors before saving')
      return
    }

    setIsSaving(true)
    try {
      const activityEntry = {
        action: editingStaff ? 'Profile Updated' : 'Profile Created',
        date: new Date().toISOString(),
        details: editingStaff ? 'Staff information was updated' : 'New staff member was added to the system',
      }

      const validGender = formData.gender ? (formData.gender as 'Male' | 'Female' | 'Other') : undefined
      const validShiftType = formData.shiftType ? (formData.shiftType as 'Morning' | 'Evening' | 'Night' | 'Rotating') : undefined
      const validContractType = formData.contractType ? (formData.contractType as 'Full-time' | 'Part-time' | 'Contract' | 'Intern') : undefined

      // Sanitize input data
      const sanitizedData = {
        firstName: sanitizeInput(formData.firstName),
        lastName: sanitizeInput(formData.lastName),
        email: sanitizeInput(formData.email),
        phone: sanitizeInput(formData.phone),
        address: sanitizeInput(formData.address),
        notes: sanitizeInput(formData.notes),
        emergencyContact: sanitizeInput(formData.emergencyContact),
        emergencyRelation: sanitizeInput(formData.emergencyRelation),
      }

      if (editingStaff) {
        const updated = staff.map(s => {
          if (s.id === editingStaff.id) {
            return {
              ...s,
              firstName: sanitizedData.firstName,
              lastName: sanitizedData.lastName,
              email: sanitizedData.email,
              phone: sanitizedData.phone,
              role: formData.role,
              department: formData.department,
              employeeId: formData.employeeId || s.employeeId,
              joinDate: formData.joinDate || s.joinDate,
              address: sanitizedData.address,
              emergencyContact: sanitizedData.emergencyContact,
              emergencyPhone: formData.emergencyPhone,
              emergencyRelation: sanitizedData.emergencyRelation,
              notes: sanitizedData.notes,
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
            skills: formData.skills ? formData.skills.split(',').map(sk => sk.trim()).filter(Boolean) : undefined,
            certifications: formData.certifications ? formData.certifications.split(',').map(c => c.trim()).filter(Boolean) : undefined,
            leaveBalance: formData.leaveBalance ? parseInt(formData.leaveBalance) : 20,
            activityLog: [...(s.activityLog || []), activityEntry],
            updatedAt: new Date().toISOString(),
          }
        }
        return s
      })
      saveStaff(updated, 'update', editingStaff.id, `Updated ${formData.firstName} ${formData.lastName}`)
      toast.success('Updated', 'Staff member updated successfully')
    } else {
      const newId = crypto.randomUUID()
      const newStaffMember: StaffMember = {
        id: newId,
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        role: formData.role,
        department: formData.department,
        employeeId: formData.employeeId || generateEmployeeId(),
        joinDate: formData.joinDate || new Date().toISOString(),
        address: sanitizedData.address,
        emergencyContact: sanitizedData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        emergencyRelation: sanitizedData.emergencyRelation,
        notes: sanitizedData.notes,
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
        skills: formData.skills ? formData.skills.split(',').map(sk => sk.trim()).filter(Boolean) : undefined,
        certifications: formData.certifications ? formData.certifications.split(',').map(c => c.trim()).filter(Boolean) : undefined,
        performance: Math.floor(Math.random() * 20) + 75,
        rating: 3,
        leaveBalance: formData.leaveBalance ? parseInt(formData.leaveBalance) : 20,
        attendance: Math.floor(Math.random() * 10) + 90,
        isFavorite: false,
        activityLog: [activityEntry],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      saveStaff([...staff, newStaffMember], 'create', newId, `Added ${sanitizedData.firstName} ${sanitizedData.lastName}`)
      toast.success('Success', 'Staff member added successfully')
    }

    setShowAddDialog(false)
    setEditingStaff(null)
    resetForm()
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Save Error', 'Failed to save staff member')
    } finally {
      setIsSaving(false)
    }
  }, [formData, editingStaff, staff, validateForm, saveStaff, generateEmployeeId, resetForm, toast])

  // ==================== EDIT HANDLER ====================
  const handleEdit = useCallback((member: StaffMember) => {
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
  }, [])

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

  // ==================== FILTERED & PAGINATED STAFF ====================
  const filteredStaff = useMemo(() => {
    let filtered = staff.filter(member => {
      // Use debounced search query for better performance
      const searchLower = debouncedSearchQuery.toLowerCase()
      const matchesSearch = !debouncedSearchQuery || 
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.employeeId.toLowerCase().includes(searchLower) ||
        member.phone.includes(debouncedSearchQuery) ||
        member.role.toLowerCase().includes(searchLower) ||
        member.department.toLowerCase().includes(searchLower)
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
  }, [staff, debouncedSearchQuery, selectedDepartment, selectedStatus, selectedRole, selectedShift, showFavoritesOnly, sortBy, sortOrder])

  // Pagination calculations
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage)
  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredStaff.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredStaff, currentPage, itemsPerPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedDepartment, selectedStatus, selectedRole, selectedShift, showFavoritesOnly])

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
      const joinDate = parseDate(s.joinDate)
      if (!joinDate) return false
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
      setSelectedStaffIds(new Set(paginatedStaff.map(s => s.id)))
    }
  }

  const staffReviews = useMemo(() => {
    if (!selectedStaff) return []
    return reviews.filter(r => r.staffId === selectedStaff.id).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [reviews, selectedStaff])

  // ==================== NEW FEATURE FUNCTIONS ====================
  
  // Get alerts for staff (expiring certs, overdue reviews, birthdays, etc.)
  const alerts = useMemo(() => {
    const now = new Date()
    const alertsList: { type: 'warning' | 'info' | 'success' | 'error'; title: string; message: string; staffId?: string }[] = []
    
    staff.forEach(member => {
      // Birthday this week
      if (member.dateOfBirth) {
        const dob = parseISO(member.dateOfBirth)
        const thisYearBirthday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate())
        const daysDiff = Math.ceil((thisYearBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff >= 0 && daysDiff <= 7) {
          alertsList.push({
            type: 'info',
            title: `🎂 Birthday ${daysDiff === 0 ? 'Today!' : `in ${daysDiff} days`}`,
            message: `${member.firstName} ${member.lastName}`,
            staffId: member.id
          })
        }
      }
      
      // Overdue performance review
      if (member.nextReviewDate) {
        const reviewDate = parseISO(member.nextReviewDate)
        if (reviewDate < now) {
          alertsList.push({
            type: 'warning',
            title: 'Overdue Review',
            message: `${member.firstName} ${member.lastName} - Review was due ${formatDistanceToNow(reviewDate)} ago`,
            staffId: member.id
          })
        }
      }
      
      // Low attendance alert
      if (member.attendance && member.attendance < 80) {
        alertsList.push({
          type: 'error',
          title: 'Low Attendance',
          message: `${member.firstName} ${member.lastName} - ${member.attendance}% attendance`,
          staffId: member.id
        })
      }
      
      // Probation ending soon (within 30 days)
      if (member.status === 'PROBATION' && member.joinDate) {
        const joinDate = parseISO(member.joinDate)
        const probationEnd = new Date(joinDate)
        probationEnd.setMonth(probationEnd.getMonth() + 3) // Assuming 3 month probation
        const daysLeft = Math.ceil((probationEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (daysLeft > 0 && daysLeft <= 30) {
          alertsList.push({
            type: 'warning',
            title: 'Probation Ending Soon',
            message: `${member.firstName} ${member.lastName} - ${daysLeft} days left`,
            staffId: member.id
          })
        }
      }
    })
    
    return alertsList
  }, [staff])

  // Get birthdays this month
  const birthdaysThisMonth = useMemo(() => {
    const currentMonth = new Date().getMonth()
    return staff.filter(member => {
      if (!member.dateOfBirth) return false
      return parseISO(member.dateOfBirth).getMonth() === currentMonth
    }).sort((a, b) => {
      const dayA = parseISO(a.dateOfBirth!).getDate()
      const dayB = parseISO(b.dateOfBirth!).getDate()
      return dayA - dayB
    })
  }, [staff])

  // Get staff needing review
  const staffNeedingReview = useMemo(() => {
    const now = new Date()
    return staff.filter(member => {
      if (!member.nextReviewDate) return true
      return parseISO(member.nextReviewDate) < now
    })
  }, [staff])

  // Get new joiners (last 30 days)
  const newJoiners = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return staff.filter(member => {
      if (!member.joinDate) return false
      return parseISO(member.joinDate) > thirtyDaysAgo
    })
  }, [staff])

  // Get top performers
  const topPerformers = useMemo(() => {
    return [...staff]
      .filter(s => s.performance !== undefined)
      .sort((a, b) => (b.performance || 0) - (a.performance || 0))
      .slice(0, 10)
  }, [staff])

  // Get low attendance staff
  const lowAttendanceStaff = useMemo(() => {
    return staff.filter(s => s.attendance !== undefined && s.attendance < 85)
  }, [staff])

  // Recent activity across all staff
  const recentActivity = useMemo(() => {
    const activities: { date: string; action: string; staffName: string; staffId: string; details?: string }[] = []
    
    staff.forEach(member => {
      if (member.activityLog) {
        member.activityLog.forEach(log => {
          activities.push({
            date: log.date,
            action: log.action,
            staffName: `${member.firstName} ${member.lastName}`,
            staffId: member.id,
            details: log.details
          })
        })
      }
      // Add join date as activity
      if (member.joinDate) {
        activities.push({
          date: member.joinDate,
          action: 'Joined',
          staffName: `${member.firstName} ${member.lastName}`,
          staffId: member.id
        })
      }
    })
    
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, RECENT_ACTIVITY_LIMIT)
  }, [staff])

  // Quick filter logic
  const quickFilteredStaff = useMemo(() => {
    switch (quickFilter) {
      case 'birthday':
        return birthdaysThisMonth
      case 'review-due':
        return staffNeedingReview
      case 'new-joiners':
        return newJoiners
      case 'top-performers':
        return topPerformers
      case 'low-attendance':
        return lowAttendanceStaff
      default:
        return null // Use normal filtered staff
    }
  }, [quickFilter, birthdaysThisMonth, staffNeedingReview, newJoiners, topPerformers, lowAttendanceStaff])

  // Advanced search filter
  const advancedFilteredStaff = useMemo(() => {
    if (!showAdvancedSearch) return null
    
    return staff.filter(member => {
      const { name, email, department, role, minPerformance, maxPerformance, joinDateFrom, joinDateTo } = advancedSearchFields
      
      if (name && !`${member.firstName} ${member.lastName}`.toLowerCase().includes(name.toLowerCase())) return false
      if (email && member.email && !member.email.toLowerCase().includes(email.toLowerCase())) return false
      if (department && member.department !== department) return false
      if (role && member.role !== role) return false
      if (minPerformance && (member.performance || 0) < Number(minPerformance)) return false
      if (maxPerformance && (member.performance || 0) > Number(maxPerformance)) return false
      if (joinDateFrom && member.joinDate && parseISO(member.joinDate) < parseISO(joinDateFrom)) return false
      if (joinDateTo && member.joinDate && parseISO(member.joinDate) > parseISO(joinDateTo)) return false
      
      return true
    })
  }, [showAdvancedSearch, advancedSearchFields, staff])

  // Import CSV handler
  const handleImportCSV = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setIsImporting(true)
    setImportProgress(0)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
        
        const imported: StaffMember[] = []
        const total = lines.length - 1
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue
          
          const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || []
          
          const row: Record<string, string> = {}
          headers.forEach((header, idx) => {
            row[header] = values[idx] || ''
          })
          
          // Map CSV columns to staff member
          const newMember: StaffMember = {
            id: crypto.randomUUID(),
            firstName: row['first name'] || row['firstname'] || row['name']?.split(' ')[0] || '',
            lastName: row['last name'] || row['lastname'] || row['name']?.split(' ').slice(1).join(' ') || '',
            email: row['email'] || '',
            phone: row['phone'] || row['telephone'] || row['mobile'] || '',
            role: row['role'] || row['position'] || row['job title'] || 'Other',
            department: row['department'] || row['dept'] || 'Administration',
            employeeId: row['employee id'] || row['employeeid'] || row['id'] || `EMP${String(staff.length + imported.length + 1).padStart(4, '0')}`,
            joinDate: row['join date'] || row['joindate'] || row['start date'] || format(new Date(), 'yyyy-MM-dd'),
            status: 'ACTIVE',
          }
          
          if (newMember.firstName && newMember.lastName) {
            imported.push(newMember)
          }
          
          setImportProgress(Math.round((i / total) * 100))
        }
        
        if (imported.length > 0) {
          saveUndoState('Import staff')
          const updated = [...staff, ...imported]
          saveStaff(updated)
          toast.success('Import Complete', `Imported ${imported.length} staff members`)
        } else {
          toast.error('Import Failed', 'No valid staff data found in the file')
        }
      } catch (error) {
        console.error('Import error:', error)
        toast.error('Import Error', 'Failed to parse the CSV file')
      } finally {
        setIsImporting(false)
        setShowImportDialog(false)
        event.target.value = ''
      }
    }
    reader.readAsText(file)
  }, [staff, saveStaff, saveUndoState, toast])

  // Export selected staff
  const exportSelected = useCallback(() => {
    if (selectedStaffIds.size === 0) {
      toast.error('No Selection', 'Please select staff members to export')
      return
    }
    
    const selectedMembers = staff.filter(s => selectedStaffIds.has(s.id))
    const headers = ['Employee ID', 'Name', 'Email', 'Phone', 'Role', 'Department', 'Status']
    const rows = selectedMembers.map(s => [
      s.employeeId,
      `${s.firstName} ${s.lastName}`,
      s.email || '',
      s.phone,
      s.role,
      s.department,
      s.status,
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `selected_staff_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    toast.success('Exported', `Exported ${selectedMembers.length} staff members`)
  }, [selectedStaffIds, staff, toast])

  // Send bulk email (mailto)
  const sendBulkEmail = useCallback(() => {
    if (selectedStaffIds.size === 0) {
      toast.error('No Selection', 'Please select staff members to email')
      return
    }
    
    const emails = staff
      .filter(s => selectedStaffIds.has(s.id) && s.email)
      .map(s => s.email)
      .join(',')
    
    if (!emails) {
      toast.error('No Emails', 'Selected staff members have no email addresses')
      return
    }
    
    window.location.href = `mailto:${emails}`
    toast.success('Opening Email', `Composing email to ${selectedStaffIds.size} staff members`)
  }, [selectedStaffIds, staff, toast])

  // Toggle compare staff
  const toggleCompareStaff = useCallback((member: StaffMember) => {
    setCompareStaff(prev => {
      const exists = prev.find(s => s.id === member.id)
      if (exists) {
        return prev.filter(s => s.id !== member.id)
      }
      if (prev.length >= COMPARISON_MAX) {
        toast.error('Max Comparison', `You can only compare up to ${COMPARISON_MAX} staff members`)
        return prev
      }
      return [...prev, member]
    })
  }, [toast])

  // Add note to staff
  const addNoteToStaff = useCallback((staffId: string) => {
    if (!noteText.trim()) return
    const newNote = {
      id: Date.now().toString(),
      text: noteText,
      timestamp: new Date().toISOString(),
      isPrivate: noteIsPrivate,
      author: 'Current User', // In production, get from auth context
    }
    setStaffNotes(prev => ({
      ...prev,
      [staffId]: [...(prev[staffId] || []), newNote]
    }))
    setNoteText('')
    toast.success('Note Added', 'Note has been saved')
  }, [noteText, noteIsPrivate, toast])

  // Delete note from staff
  const deleteNoteFromStaff = useCallback((staffId: string, noteId: string) => {
    setStaffNotes(prev => ({
      ...prev,
      [staffId]: (prev[staffId] || []).filter(n => n.id !== noteId)
    }))
    toast.success('Note Deleted', 'Note has been removed')
  }, [toast])

  // Generate mock shift schedule for staff
  const generateMockShifts = useCallback((_staffId: string) => {
    const shifts = []
    const shiftTypes = ['Morning', 'Afternoon', 'Night', 'On-Call']
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      if (Math.random() > 0.3) { // 70% chance of having a shift
        const shiftType = shiftTypes[Math.floor(Math.random() * shiftTypes.length)]
        let startTime = '07:00'
        let endTime = '15:00'
        if (shiftType === 'Afternoon') { startTime = '15:00'; endTime = '23:00' }
        if (shiftType === 'Night') { startTime = '23:00'; endTime = '07:00' }
        if (shiftType === 'On-Call') { startTime = '00:00'; endTime = '23:59' }
        shifts.push({
          date: date.toISOString().split('T')[0],
          dayName: format(date, 'EEEE'),
          shiftType,
          startTime,
          endTime,
          isToday: i === 0,
        })
      }
    }
    return shifts
  }, [])

  // Calculate staff workload metrics
  const workloadMetrics = useMemo(() => {
    return staff.map(s => {
      // Mock workload calculation based on various factors
      const hasScheduledReview = s.lastReviewDate ? 
        new Date(s.lastReviewDate) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) : true
      const activeTaskCount = Math.floor(Math.random() * 15) + 1
      const pendingApprovals = Math.floor(Math.random() * 5)
      const upcomingMeetings = Math.floor(Math.random() * 8)
      
      let workloadScore = 0
      workloadScore += activeTaskCount * 5
      workloadScore += pendingApprovals * 10
      workloadScore += upcomingMeetings * 3
      if (hasScheduledReview) workloadScore += 15
      
      let workloadLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low'
      if (workloadScore > 30) workloadLevel = 'moderate'
      if (workloadScore > 60) workloadLevel = 'high'
      if (workloadScore > 90) workloadLevel = 'critical'
      
      return {
        staffId: s.id,
        staffName: `${s.firstName} ${s.lastName}`,
        department: s.department,
        activeTaskCount,
        pendingApprovals,
        upcomingMeetings,
        workloadScore,
        workloadLevel,
        performance: s.performance || 0,
        attendance: s.attendance || 0,
      }
    }).sort((a, b) => b.workloadScore - a.workloadScore)
  }, [staff])

  // Quick contact handlers
  const handleQuickCall = useCallback((phone: string) => {
    window.open(`tel:${phone}`, '_self')
    toast.info('Calling', `Initiating call to ${phone}`)
  }, [toast])

  const handleQuickSMS = useCallback((phone: string) => {
    window.open(`sms:${phone}`, '_self')
    toast.info('SMS', `Opening SMS to ${phone}`)
  }, [toast])

  const handleQuickWhatsApp = useCallback((phone: string) => {
    // Remove non-numeric characters for WhatsApp
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`https://wa.me/${cleanPhone}`, '_blank')
    toast.info('WhatsApp', `Opening WhatsApp chat`)
  }, [toast])

  const handleQuickEmail = useCallback((email: string) => {
    window.open(`mailto:${email}`, '_self')
    toast.info('Email', `Opening email to ${email}`)
  }, [toast])

  // Mock department transfer history
  const getDepartmentTransferHistory = useCallback((staffMember: StaffMember) => {
    // In production, this would come from staff.transferHistory or an API
    const departments = ['Emergency', 'Surgery', 'Pediatrics', 'Cardiology', 'Oncology', 'Radiology', 'ICU']
    const history: Array<{
      id: string
      fromDepartment: string
      toDepartment: string
      date: string
      reason: string
      approvedBy: string
    }> = []
    const currentDept = staffMember.department
    const joinDate = staffMember.joinDate ? new Date(staffMember.joinDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    
    // Generate 1-4 transfer records
    const numTransfers = Math.floor(Math.random() * 4)
    for (let i = 0; i < numTransfers; i++) {
      const fromDept: string = i === 0 ? departments[Math.floor(Math.random() * departments.length)] : (history[i-1]?.toDepartment || currentDept)
      const toDept: string = i === numTransfers - 1 ? currentDept : departments[Math.floor(Math.random() * departments.length)]
      const transferDate = new Date(joinDate)
      transferDate.setMonth(transferDate.getMonth() + (i + 1) * 6)
      
      if (transferDate < new Date() && fromDept !== toDept) {
        history.push({
          id: `transfer-${i}`,
          fromDepartment: fromDept,
          toDepartment: toDept,
          date: transferDate.toISOString(),
          reason: ['Promotion', 'Request', 'Restructuring', 'Skill Development'][Math.floor(Math.random() * 4)],
          approvedBy: 'HR Manager',
        })
      }
    }
    
    // Add initial assignment
    history.unshift({
      id: 'initial',
      fromDepartment: 'N/A',
      toDepartment: history.length > 0 ? history[0].fromDepartment : currentDept,
      date: joinDate.toISOString(),
      reason: 'Initial Assignment',
      approvedBy: 'HR',
    })
    
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [])

  // Print entire directory
  const printDirectory = useCallback(() => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const staffRows = (quickFilteredStaff || advancedFilteredStaff || filteredStaff).map(s => `
        <tr>
          <td>${s.employeeId}</td>
          <td>${s.firstName} ${s.lastName}</td>
          <td>${s.role}</td>
          <td>${s.department}</td>
          <td>${s.phone}</td>
          <td>${s.email || '-'}</td>
          <td>${s.status}</td>
        </tr>
      `).join('')
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Staff Directory - ${format(new Date(), 'yyyy-MM-dd')}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
              th { background-color: #4a5568; color: white; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .footer { margin-top: 20px; text-align: center; color: #666; font-size: 10px; }
            </style>
          </head>
          <body>
            <h1>Staff Directory</h1>
            <p>Generated on: ${format(new Date(), 'PPpp')}</p>
            <p>Total: ${(quickFilteredStaff || advancedFilteredStaff || filteredStaff).length} staff members</p>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${staffRows}
              </tbody>
            </table>
            <div class="footer">Tansiq Pulse - Hospital Management System</div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }, [quickFilteredStaff, advancedFilteredStaff, filteredStaff])

  // Bulk status change
  const bulkStatusChange = useCallback((newStatus: StaffMember['status']) => {
    if (selectedStaffIds.size === 0) {
      toast.error('No Selection', 'Please select staff members first')
      return
    }
    
    saveUndoState('Bulk status change')
    const updated = staff.map(s => 
      selectedStaffIds.has(s.id) ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s
    )
    saveStaff(updated)
    toast.success('Status Updated', `Changed status for ${selectedStaffIds.size} staff members`)
    setSelectedStaffIds(new Set())
  }, [selectedStaffIds, staff, saveStaff, saveUndoState, toast])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="h-9 w-48 bg-muted rounded animate-pulse" />
            <div className="h-5 w-64 bg-muted rounded animate-pulse mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 bg-muted rounded animate-pulse" />
            <div className="h-9 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
        {/* Grid skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

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
          
          {/* Undo/Redo */}
          <div className="flex items-center border rounded-md">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className="rounded-r-none"
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    className="rounded-l-none"
                  >
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Keyboard Shortcuts */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setShowKeyboardShortcuts(true)}>
                  <Keyboard className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Keyboard shortcuts (?)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Alerts Badge */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAlertsPanel(!showAlertsPanel)}
                  className={cn(alerts.length > 0 && "border-orange-500")}
                >
                  {alerts.length > 0 ? <BellRing className="h-4 w-4 text-orange-500" /> : <Bell className="h-4 w-4" />}
                  {alerts.length > 0 && (
                    <span className="ml-1 text-xs bg-orange-500 text-white rounded-full px-1.5">
                      {alerts.length}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{alerts.length} alerts</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Activity Timeline */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setShowActivityTimeline(!showActivityTimeline)}>
                  <History className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Activity Timeline</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Compare */}
          {compareStaff.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowCompareDialog(true)}
                    className="border-blue-500"
                  >
                    <GitCompare className="h-4 w-4 text-blue-500" />
                    <span className="ml-1 text-xs">{compareStaff.length}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Compare {compareStaff.length} staff members</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Import */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Import from CSV</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Print Directory */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={printDirectory}>
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print Directory</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Staff Workload Overview */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowWorkloadOverview(true)}
                  className="relative"
                >
                  <Gauge className="h-4 w-4" />
                  {workloadMetrics.filter(m => m.workloadLevel === 'critical').length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {workloadMetrics.filter(m => m.workloadLevel === 'critical').length}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Staff Workload Overview</TooltipContent>
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

      {/* Alerts Panel */}
      <AnimatePresence>
        {showAlertsPanel && alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BellRing className="h-5 w-5 text-orange-500" />
                    Alerts & Notifications
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowAlertsPanel(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-48">
                  <div className="space-y-2">
                    {alerts.map((alert, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-background/50",
                          alert.type === 'error' && "bg-red-100/50 dark:bg-red-900/20",
                          alert.type === 'warning' && "bg-amber-100/50 dark:bg-amber-900/20",
                          alert.type === 'info' && "bg-blue-100/50 dark:bg-blue-900/20",
                          alert.type === 'success' && "bg-green-100/50 dark:bg-green-900/20"
                        )}
                        onClick={() => {
                          if (alert.staffId) {
                            const member = staff.find(s => s.id === alert.staffId)
                            if (member) {
                              setSelectedStaff(member)
                              setShowDetails(true)
                            }
                          }
                        }}
                      >
                        {alert.type === 'error' && <AlertOctagon className="h-4 w-4 text-red-500 flex-shrink-0" />}
                        {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />}
                        {alert.type === 'info' && <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                        {alert.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{alert.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Timeline Panel */}
      <AnimatePresence>
        {showActivityTimeline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowActivityTimeline(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-64">
                  <div className="space-y-3">
                    {recentActivity.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                    ) : (
                      recentActivity.map((activity, idx) => (
                        <div key={idx} className="flex items-start gap-3 group">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{activity.staffName}</span>
                              <Badge variant="secondary" className="text-xs">{activity.action}</Badge>
                            </div>
                            {activity.details && (
                              <p className="text-xs text-muted-foreground">{activity.details}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(parseISO(activity.date), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
                  ref={searchInputRef}
                  placeholder="Search by name, email, ID, phone, role... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-20 bg-muted/50 border-0"
                  aria-label="Search staff members"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
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

                <Separator orientation="vertical" className="h-6" />

                {/* Quick Filters */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant={quickFilter !== 'all' ? 'default' : 'ghost'} 
                      size="sm" 
                      className="h-8 gap-1"
                    >
                      <Sparkles className={cn("h-3.5 w-3.5", quickFilter !== 'all' && "text-yellow-300")} />
                      <span className="text-xs">
                        {quickFilter === 'all' ? 'Quick Filters' : 
                         quickFilter === 'birthday' ? `🎂 Birthdays (${birthdaysThisMonth.length})` :
                         quickFilter === 'review-due' ? `📋 Review Due (${staffNeedingReview.length})` :
                         quickFilter === 'new-joiners' ? `✨ New (${newJoiners.length})` :
                         quickFilter === 'top-performers' ? `🏆 Top (${topPerformers.length})` :
                         `⚠️ Low Attendance (${lowAttendanceStaff.length})`}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem onClick={() => setQuickFilter('all')}>
                      <Users className="h-4 w-4 mr-2" /> All Staff
                      {quickFilter === 'all' && <CheckCircle2 className="h-4 w-4 ml-auto text-primary" />}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setQuickFilter('birthday')}>
                      <Cake className="h-4 w-4 mr-2" /> 🎂 Birthdays This Month
                      <Badge variant="secondary" className="ml-auto text-xs">{birthdaysThisMonth.length}</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setQuickFilter('review-due')}>
                      <ClipboardList className="h-4 w-4 mr-2" /> Review Due/Overdue
                      <Badge variant="secondary" className="ml-auto text-xs">{staffNeedingReview.length}</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setQuickFilter('new-joiners')}>
                      <PartyPopper className="h-4 w-4 mr-2" /> New Joiners (30 days)
                      <Badge variant="secondary" className="ml-auto text-xs">{newJoiners.length}</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setQuickFilter('top-performers')}>
                      <TrendingUp className="h-4 w-4 mr-2" /> Top Performers
                      <Badge variant="secondary" className="ml-auto text-xs">{topPerformers.length}</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setQuickFilter('low-attendance')}>
                      <TrendingDown className="h-4 w-4 mr-2 text-red-500" /> Low Attendance
                      <Badge variant="destructive" className="ml-auto text-xs">{lowAttendanceStaff.length}</Badge>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Advanced Search Toggle */}
                <Button
                  variant={showAdvancedSearch ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                  <span className="text-xs">Advanced</span>
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
                        <DropdownMenuItem onClick={() => bulkStatusChange('ACTIVE')}>
                          <UserCheck className="h-4 w-4 mr-2" /> Set Active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => bulkStatusChange('ON_LEAVE')}>
                          <Clock className="h-4 w-4 mr-2" /> Set On Leave
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => bulkStatusChange('INACTIVE')}>
                          <UserX className="h-4 w-4 mr-2" /> Set Inactive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={sendBulkEmail}>
                          <SendHorizontal className="h-4 w-4 mr-2" /> Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportSelected}>
                          <Download className="h-4 w-4 mr-2" /> Export Selected
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

      {/* Advanced Search Panel */}
      <AnimatePresence>
        {showAdvancedSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-0 shadow-md border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ZoomIn className="h-5 w-5 text-primary" />
                    Advanced Search
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setAdvancedSearchFields({
                        name: '', email: '', department: '', role: '',
                        minPerformance: '', maxPerformance: '', joinDateFrom: '', joinDateTo: ''
                      })}
                    >
                      Clear All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowAdvancedSearch(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      placeholder="Search name..."
                      value={advancedSearchFields.name}
                      onChange={(e) => setAdvancedSearchFields(prev => ({ ...prev, name: e.target.value }))}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input
                      placeholder="Search email..."
                      value={advancedSearchFields.email}
                      onChange={(e) => setAdvancedSearchFields(prev => ({ ...prev, email: e.target.value }))}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Department</Label>
                    <Select 
                      value={advancedSearchFields.department} 
                      onValueChange={(v) => setAdvancedSearchFields(prev => ({ ...prev, department: v === 'all' ? '' : v }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Department</SelectItem>
                        {DEPARTMENTS.map(d => (
                          <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Role</Label>
                    <Select 
                      value={advancedSearchFields.role} 
                      onValueChange={(v) => setAdvancedSearchFields(prev => ({ ...prev, role: v === 'all' ? '' : v }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Role</SelectItem>
                        {ROLES.map(r => (
                          <SelectItem key={r.name} value={r.name}>{r.icon} {r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Min Performance %</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="100"
                      value={advancedSearchFields.minPerformance}
                      onChange={(e) => setAdvancedSearchFields(prev => ({ ...prev, minPerformance: e.target.value }))}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Max Performance %</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      min="0"
                      max="100"
                      value={advancedSearchFields.maxPerformance}
                      onChange={(e) => setAdvancedSearchFields(prev => ({ ...prev, maxPerformance: e.target.value }))}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Joined After</Label>
                    <Input
                      type="date"
                      value={advancedSearchFields.joinDateFrom}
                      onChange={(e) => setAdvancedSearchFields(prev => ({ ...prev, joinDateFrom: e.target.value }))}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Joined Before</Label>
                    <Input
                      type="date"
                      value={advancedSearchFields.joinDateTo}
                      onChange={(e) => setAdvancedSearchFields(prev => ({ ...prev, joinDateTo: e.target.value }))}
                      className="h-8"
                    />
                  </div>
                </div>
                {advancedFilteredStaff && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Found {advancedFilteredStaff.length} matching staff members
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count & Pagination Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredStaff.length)}-{Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} staff members
            {filteredStaff.length !== staff.length && ` (filtered from ${staff.length})`}
          </p>
          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Per page:</span>
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(value) => {
                setItemsPerPage(Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
            <EmptyState
              icon={<Users className="h-8 w-8 text-muted-foreground" />}
              title="No staff members found"
              description={staff.length === 0 ? 'Add your first staff member to get started' : 'Try adjusting your search or filters'}
              action={staff.length === 0 ? {
                label: 'Add Staff Member',
                onClick: () => setShowAddDialog(true)
              } : undefined}
            />
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {paginatedStaff.map((member) => {
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
              {paginatedStaff.map((member) => {
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
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleCompareStaff(member) }}>
                          <GitCompare className="h-4 w-4 mr-2" />
                          {compareStaff.find(s => s.id === member.id) ? 'Remove from Compare' : 'Add to Compare'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedStaff(member);
                          setShowNotesDialog(true);
                        }}>
                          <StickyNote className="h-4 w-4 mr-2" /> View Notes
                          {staffNotes[member.id]?.length > 0 && (
                            <Badge variant="secondary" className="ml-auto">{staffNotes[member.id].length}</Badge>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedScheduleStaff(member);
                          setShowShiftSchedule(true);
                        }}>
                          <CalendarDays className="h-4 w-4 mr-2" /> View Schedule
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { 
                          e.stopPropagation(); 
                          setTransferHistoryStaff(member);
                          setShowTransferHistory(true);
                        }}>
                          <ArrowRightLeft className="h-4 w-4 mr-2" /> Transfer History
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { 
                          e.stopPropagation(); 
                          setContactActionsStaff(member);
                          setShowContactActions(true);
                        }}>
                          <PhoneCall className="h-4 w-4 mr-2" /> Quick Contact
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
                  {paginatedStaff.map((member) => {
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
                              <DropdownMenuItem onClick={() => toggleCompareStaff(member)}>
                                <GitCompare className="h-4 w-4 mr-2" />
                                {compareStaff.find(s => s.id === member.id) ? 'Remove from Compare' : 'Add to Compare'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { 
                                setSelectedStaff(member);
                                setShowNotesDialog(true);
                              }}>
                                <StickyNote className="h-4 w-4 mr-2" /> View Notes
                                {staffNotes[member.id]?.length > 0 && (
                                  <Badge variant="secondary" className="ml-auto">{staffNotes[member.id].length}</Badge>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { 
                                setSelectedScheduleStaff(member);
                                setShowShiftSchedule(true);
                              }}>
                                <CalendarDays className="h-4 w-4 mr-2" /> View Schedule
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { 
                                setTransferHistoryStaff(member);
                                setShowTransferHistory(true);
                              }}>
                                <ArrowRightLeft className="h-4 w-4 mr-2" /> Transfer History
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { 
                                setContactActionsStaff(member);
                                setShowContactActions(true);
                              }}>
                                <PhoneCall className="h-4 w-4 mr-2" /> Quick Contact
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

      {/* Pagination Controls */}
      {filteredStaff.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>First page</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous page</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next page</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Last page</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

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
      <Dialog 
        open={showAddDialog} 
        onOpenChange={(open) => {
          if (!open && isFormDirty) {
            // Confirm before closing if form is dirty
            if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
              setShowAddDialog(false)
              setIsFormDirty(false)
              resetForm()
            }
          } else {
            setShowAddDialog(open)
            if (!open) resetForm()
          }
        }}
      >
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
              {isFormDirty && <span className="text-orange-500 ml-2">(Unsaved changes)</span>}
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
                    onChange={(e) => {
                      setFormData({ ...formData, firstName: e.target.value })
                      setIsFormDirty(true)
                      if (formErrors.firstName) setFormErrors(prev => ({ ...prev, firstName: undefined }))
                    }}
                    placeholder="John"
                    className={formErrors.firstName ? 'border-destructive' : ''}
                  />
                  {formErrors.firstName && (
                    <p className="text-xs text-destructive">{formErrors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData({ ...formData, lastName: e.target.value })
                      setIsFormDirty(true)
                      if (formErrors.lastName) setFormErrors(prev => ({ ...prev, lastName: undefined }))
                    }}
                    placeholder="Doe"
                    className={formErrors.lastName ? 'border-destructive' : ''}
                  />
                  {formErrors.lastName && (
                    <p className="text-xs text-destructive">{formErrors.lastName}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value })
                      setIsFormDirty(true)
                      if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: undefined }))
                    }}
                    placeholder="+1234567890"
                    className={formErrors.phone ? 'border-destructive' : ''}
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-destructive">{formErrors.phone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      setIsFormDirty(true)
                      if (formErrors.email) setFormErrors(prev => ({ ...prev, email: undefined }))
                    }}
                    placeholder="john@example.com"
                    className={formErrors.email ? 'border-destructive' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-xs text-destructive">{formErrors.email}</p>
                  )}
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
                    onValueChange={(v) => {
                      setFormData({ ...formData, role: v })
                      setIsFormDirty(true)
                      if (formErrors.role) setFormErrors(prev => ({ ...prev, role: undefined }))
                    }}
                  >
                    <SelectTrigger className={formErrors.role ? 'border-destructive' : ''}>
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
                  {formErrors.role && (
                    <p className="text-xs text-destructive">{formErrors.role}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(v) => {
                      setFormData({ ...formData, department: v })
                      setIsFormDirty(true)
                      if (formErrors.department) setFormErrors(prev => ({ ...prev, department: undefined }))
                    }}
                  >
                    <SelectTrigger className={formErrors.department ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.department && (
                    <p className="text-xs text-destructive">{formErrors.department}</p>
                  )}
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
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="bg-gradient-to-r from-primary to-primary/80"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <BadgeCheck className="h-4 w-4 mr-2" />
                  {editingStaff ? 'Save Changes' : 'Add Staff Member'}
                </>
              )}
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

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-primary" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Quick actions to boost your productivity
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid gap-3">
              {[
                { keys: ['⌘', 'K'], description: 'Focus search' },
                { keys: ['⌘', 'N'], description: 'Add new staff member' },
                { keys: ['⌘', 'Z'], description: 'Undo last action' },
                { keys: ['⌘', '⇧', 'Z'], description: 'Redo last action' },
                { keys: ['Esc'], description: 'Close dialogs' },
                { keys: ['?'], description: 'Show this help' },
              ].map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, j) => (
                      <kbd key={j} className="px-2 py-1 text-xs font-semibold bg-muted rounded border">
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              On Windows/Linux, use Ctrl instead of ⌘
            </p>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowKeyboardShortcuts(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Import Staff from CSV
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import staff members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
                id="csv-import"
                disabled={isImporting}
              />
              <label htmlFor="csv-import" className="cursor-pointer">
                <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">
                  {isImporting ? 'Importing...' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
              </label>
            </div>
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing...</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium mb-2">Expected CSV columns:</p>
              <p className="text-xs text-muted-foreground">
                First Name, Last Name, Email, Phone, Role, Department, Employee ID, Join Date
              </p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowImportDialog(false)} disabled={isImporting}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare Staff Dialog */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-primary" />
              Compare Staff Members
            </DialogTitle>
            <DialogDescription>
              Side-by-side comparison of {compareStaff.length} staff members
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {compareStaff.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Columns className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No staff members selected for comparison</p>
                <p className="text-sm">Use the compare button on staff cards to add members</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Attribute</TableHead>
                      {compareStaff.map(member => (
                        <TableHead key={member.id} className="min-w-40">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={cn("text-xs font-bold text-white bg-gradient-to-br", getRoleInfo(member.role).gradient)}>
                                {getInitials(member.firstName, member.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member.firstName} {member.lastName}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-auto"
                              onClick={() => toggleCompareStaff(member)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { label: 'Employee ID', key: 'employeeId' },
                      { label: 'Role', key: 'role' },
                      { label: 'Department', key: 'department' },
                      { label: 'Status', key: 'status' },
                      { label: 'Join Date', key: 'joinDate', format: (v: string) => v ? format(parseISO(v), 'PP') : '-' },
                      { label: 'Performance', key: 'performance', format: (v: number) => v !== undefined ? `${v}%` : '-' },
                      { label: 'Attendance', key: 'attendance', format: (v: number) => v !== undefined ? `${v}%` : '-' },
                      { label: 'Contract', key: 'contractType' },
                      { label: 'Shift', key: 'shiftType' },
                      { label: 'Leave Balance', key: 'leaveBalance', format: (v: number) => v !== undefined ? `${v} days` : '-' },
                      { label: 'Email', key: 'email' },
                      { label: 'Phone', key: 'phone' },
                    ].map(row => (
                      <TableRow key={row.label}>
                        <TableCell className="font-medium text-muted-foreground">{row.label}</TableCell>
                        {compareStaff.map(member => {
                          const value = member[row.key as keyof StaffMember]
                          const displayValue = row.format ? row.format(value as never) : (value !== undefined && value !== null ? String(value) : '-')
                          return (
                            <TableCell key={member.id}>
                              {row.key === 'status' ? (
                                <Badge className={cn(getStatusConfig(value as StaffMember['status']).badgeColor)}>
                                  {getStatusConfig(value as StaffMember['status']).label}
                                </Badge>
                              ) : row.key === 'performance' || row.key === 'attendance' ? (
                                <span className={cn(
                                  (value as number) >= 90 ? 'text-emerald-600' :
                                  (value as number) >= 70 ? 'text-amber-600' : 'text-red-600'
                                )}>
                                  {displayValue}
                                </span>
                              ) : (
                                displayValue
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCompareStaff([])}>
              Clear All
            </Button>
            <Button variant="outline" onClick={() => setShowCompareDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-amber-500" />
              Staff Notes
              {selectedStaff && (
                <span className="text-muted-foreground font-normal">
                  - {selectedStaff.firstName} {selectedStaff.lastName}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Add private notes or comments about this staff member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Add New Note</Label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter your note here..."
                className="min-h-[80px]"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={noteIsPrivate}
                    onChange={(e) => setNoteIsPrivate(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-muted-foreground">Private note (only visible to you)</span>
                </label>
                <Button 
                  size="sm" 
                  onClick={() => selectedStaff && addNoteToStaff(selectedStaff.id)}
                  disabled={!noteText.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Note
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Previous Notes</Label>
              <ScrollArea className="h-[200px]">
                {selectedStaff && (staffNotes[selectedStaff.id] || []).length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notes yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedStaff && (staffNotes[selectedStaff.id] || [])
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map(note => (
                        <div 
                          key={note.id} 
                          className={cn(
                            "p-3 rounded-lg border",
                            note.isPrivate ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800" : "bg-muted/50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm flex-1">{note.text}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => selectedStaff && deleteNoteFromStaff(selectedStaff.id, note.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>{note.author}</span>
                            <span>•</span>
                            <span>{format(parseISO(note.timestamp), 'PPp')}</span>
                            {note.isPrivate && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="h-5 text-xs">Private</Badge>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shift Schedule Dialog */}
      <Dialog open={showShiftSchedule} onOpenChange={setShowShiftSchedule}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-500" />
              Shift Schedule
              {selectedScheduleStaff && (
                <span className="text-muted-foreground font-normal">
                  - {selectedScheduleStaff.firstName} {selectedScheduleStaff.lastName}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Upcoming 2-week shift schedule
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {selectedScheduleStaff && (
              <div className="space-y-2">
                {generateMockShifts(selectedScheduleStaff.id).map((shift, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      shift.isToday && "bg-primary/5 border-primary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-10 rounded-full",
                        shift.shiftType === 'Morning' && "bg-yellow-400",
                        shift.shiftType === 'Afternoon' && "bg-orange-400",
                        shift.shiftType === 'Night' && "bg-indigo-600",
                        shift.shiftType === 'On-Call' && "bg-rose-500",
                      )} />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {shift.dayName}
                          {shift.isToday && <Badge className="bg-primary">Today</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">{shift.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={cn(
                        shift.shiftType === 'Morning' && "border-yellow-400 text-yellow-700",
                        shift.shiftType === 'Afternoon' && "border-orange-400 text-orange-700",
                        shift.shiftType === 'Night' && "border-indigo-400 text-indigo-700",
                        shift.shiftType === 'On-Call' && "border-rose-400 text-rose-700",
                      )}>
                        {shift.shiftType}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </div>
                  </div>
                ))}
                {generateMockShifts(selectedScheduleStaff.id).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No shifts scheduled</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowShiftSchedule(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Department Transfer History Dialog */}
      <Dialog open={showTransferHistory} onOpenChange={setShowTransferHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-purple-500" />
              Department Transfer History
              {transferHistoryStaff && (
                <span className="text-muted-foreground font-normal">
                  - {transferHistoryStaff.firstName} {transferHistoryStaff.lastName}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Track of department changes and transfers
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {transferHistoryStaff && (
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />
                <div className="space-y-4">
                  {getDepartmentTransferHistory(transferHistoryStaff).map((transfer, idx) => (
                    <div key={transfer.id} className="relative pl-10">
                      <div className={cn(
                        "absolute left-2.5 w-3 h-3 rounded-full border-2 border-background",
                        idx === 0 ? "bg-primary" : "bg-muted-foreground/50"
                      )} />
                      <div className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{transfer.reason}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(transfer.date), 'PP')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{transfer.fromDepartment}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{transfer.toDepartment}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Approved by: {transfer.approvedBy}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowTransferHistory(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Workload Overview Dialog */}
      <Dialog open={showWorkloadOverview} onOpenChange={setShowWorkloadOverview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-orange-500" />
              Staff Workload Overview
            </DialogTitle>
            <DialogDescription>
              Monitor workload distribution across all staff members
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-3">
              <Card className="p-3">
                <div className="text-2xl font-bold text-emerald-600">
                  {workloadMetrics.filter(m => m.workloadLevel === 'low').length}
                </div>
                <div className="text-xs text-muted-foreground">Low Workload</div>
              </Card>
              <Card className="p-3">
                <div className="text-2xl font-bold text-amber-600">
                  {workloadMetrics.filter(m => m.workloadLevel === 'moderate').length}
                </div>
                <div className="text-xs text-muted-foreground">Moderate</div>
              </Card>
              <Card className="p-3">
                <div className="text-2xl font-bold text-orange-600">
                  {workloadMetrics.filter(m => m.workloadLevel === 'high').length}
                </div>
                <div className="text-xs text-muted-foreground">High Workload</div>
              </Card>
              <Card className="p-3">
                <div className="text-2xl font-bold text-red-600">
                  {workloadMetrics.filter(m => m.workloadLevel === 'critical').length}
                </div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </Card>
            </div>

            {/* Detailed List */}
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {workloadMetrics.map(metric => (
                  <div 
                    key={metric.staffId}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-8 rounded-full",
                        metric.workloadLevel === 'low' && "bg-emerald-500",
                        metric.workloadLevel === 'moderate' && "bg-amber-500",
                        metric.workloadLevel === 'high' && "bg-orange-500",
                        metric.workloadLevel === 'critical' && "bg-red-500",
                      )} />
                      <div>
                        <div className="font-medium">{metric.staffName}</div>
                        <div className="text-sm text-muted-foreground">{metric.department}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium">{metric.activeTaskCount}</div>
                        <div className="text-xs text-muted-foreground">Tasks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">{metric.pendingApprovals}</div>
                        <div className="text-xs text-muted-foreground">Approvals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">{metric.upcomingMeetings}</div>
                        <div className="text-xs text-muted-foreground">Meetings</div>
                      </div>
                      <Badge className={cn(
                        "min-w-20 justify-center",
                        metric.workloadLevel === 'low' && "bg-emerald-100 text-emerald-700 border-emerald-200",
                        metric.workloadLevel === 'moderate' && "bg-amber-100 text-amber-700 border-amber-200",
                        metric.workloadLevel === 'high' && "bg-orange-100 text-orange-700 border-orange-200",
                        metric.workloadLevel === 'critical' && "bg-red-100 text-red-700 border-red-200",
                      )}>
                        {metric.workloadLevel.charAt(0).toUpperCase() + metric.workloadLevel.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowWorkloadOverview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Contact Actions Dialog */}
      <Dialog open={showContactActions} onOpenChange={setShowContactActions}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-green-500" />
              Quick Contact
              {contactActionsStaff && (
                <span className="text-muted-foreground font-normal">
                  - {contactActionsStaff.firstName}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Choose how to contact this staff member
            </DialogDescription>
          </DialogHeader>
          {contactActionsStaff && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => handleQuickCall(contactActionsStaff.phone)}
              >
                <PhoneCall className="h-6 w-6 text-green-600" />
                <span>Call</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => handleQuickSMS(contactActionsStaff.phone)}
              >
                <MessageCircle className="h-6 w-6 text-blue-600" />
                <span>SMS</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => handleQuickWhatsApp(contactActionsStaff.phone)}
              >
                <Share2 className="h-6 w-6 text-green-500" />
                <span>WhatsApp</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => contactActionsStaff.email && handleQuickEmail(contactActionsStaff.email)}
                disabled={!contactActionsStaff.email}
              >
                <Mail className="h-6 w-6 text-purple-600" />
                <span>Email</span>
              </Button>
            </div>
          )}
          {contactActionsStaff && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-1">
              <div className="text-sm flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {contactActionsStaff.phone}
              </div>
              {contactActionsStaff.email && (
                <div className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {contactActionsStaff.email}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== EXPORTED UTILITIES ====================
// These utilities are available for use in other components
export {
  formatCurrency,
  debounce,
  safeGetFromStorage,
  safeSetToStorage,
  safeRemoveFromStorage,
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  isValidName,
  parseDate,
}

// Export types for external use
export type { StaffMember, PerformanceReview, FormErrors, SyncMeta, PendingChange }
