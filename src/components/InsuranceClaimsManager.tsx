import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import {
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Send,
  FileText,
  Download,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  LayoutGrid,
  List,
  RefreshCw,
  Building2,
  Calendar,
  Hash,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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

interface InsuranceClaim {
  id: string
  claimNumber: string
  patientName: string
  patientId?: number
  insuranceProvider: string
  policyNumber: string
  serviceDate: string
  submissionDate: string
  claimAmount: number
  approvedAmount?: number
  status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'DENIED' | 'APPEALED'
  serviceDescription: string
  diagnosisCode?: string
  procedureCode?: string
  notes?: string
  denialReason?: string
  lastUpdated?: string
  documents?: { name: string; uploadDate: string }[]
  timeline?: { status: string; date: string; note?: string }[]
}

const INSURANCE_PROVIDERS = [
  { name: 'Blue Cross Blue Shield', color: 'blue', abbrev: 'BCBS' },
  { name: 'Aetna', color: 'purple', abbrev: 'AET' },
  { name: 'UnitedHealthcare', color: 'orange', abbrev: 'UHC' },
  { name: 'Cigna', color: 'teal', abbrev: 'CIG' },
  { name: 'Humana', color: 'green', abbrev: 'HUM' },
  { name: 'Kaiser Permanente', color: 'red', abbrev: 'KP' },
  { name: 'Anthem', color: 'indigo', abbrev: 'ANT' },
  { name: 'Medicare', color: 'sky', abbrev: 'MED' },
  { name: 'Medicaid', color: 'emerald', abbrev: 'MCD' },
  { name: 'Other', color: 'slate', abbrev: 'OTH' },
]

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; label: string; color: string; bgClass: string }> = {
  DRAFT: {
    icon: FileText,
    label: 'Draft',
    color: 'slate',
    bgClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400',
  },
  SUBMITTED: {
    icon: Send,
    label: 'Submitted',
    color: 'blue',
    bgClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  IN_REVIEW: {
    icon: Clock,
    label: 'In Review',
    color: 'amber',
    bgClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  APPROVED: {
    icon: CheckCircle,
    label: 'Approved',
    color: 'emerald',
    bgClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  PARTIALLY_APPROVED: {
    icon: AlertCircle,
    label: 'Partial',
    color: 'orange',
    bgClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  DENIED: {
    icon: XCircle,
    label: 'Denied',
    color: 'red',
    bgClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  APPEALED: {
    icon: RefreshCw,
    label: 'Appealed',
    color: 'purple',
    bgClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
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

export function InsuranceClaimsManager() {
  const toast = useToast()
  const [claims, setClaims] = useState<InsuranceClaim[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterProvider, setFilterProvider] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingClaim, setEditingClaim] = useState<InsuranceClaim | null>(null)
  const [viewingClaim, setViewingClaim] = useState<InsuranceClaim | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  const [claimForm, setClaimForm] = useState({
    patientName: '',
    insuranceProvider: '',
    policyNumber: '',
    serviceDate: '',
    claimAmount: '',
    serviceDescription: '',
    diagnosisCode: '',
    procedureCode: '',
    notes: '',
  })

  const loadClaims = useCallback(() => {
    const stored = localStorage.getItem('insurance_claims')
    if (stored) {
      setClaims(JSON.parse(stored))
    } else {
      const sampleClaims: InsuranceClaim[] = [
        {
          id: '1',
          claimNumber: 'CLM-2026-0001',
          patientName: 'John Doe',
          insuranceProvider: 'Blue Cross Blue Shield',
          policyNumber: 'BCBS-123456',
          serviceDate: '2026-01-15',
          submissionDate: '2026-01-20',
          claimAmount: 1500,
          approvedAmount: 1350,
          status: 'APPROVED',
          serviceDescription: 'General consultation and lab tests',
          diagnosisCode: 'Z00.00',
          lastUpdated: '2026-01-25T10:00:00Z',
          timeline: [
            { status: 'DRAFT', date: '2026-01-20T09:00:00Z' },
            { status: 'SUBMITTED', date: '2026-01-20T10:00:00Z' },
            { status: 'IN_REVIEW', date: '2026-01-22T14:00:00Z' },
            { status: 'APPROVED', date: '2026-01-25T10:00:00Z', note: 'Approved with minor adjustments' },
          ],
        },
        {
          id: '2',
          claimNumber: 'CLM-2026-0002',
          patientName: 'Jane Smith',
          insuranceProvider: 'Aetna',
          policyNumber: 'AET-789012',
          serviceDate: '2026-01-25',
          submissionDate: '2026-01-28',
          claimAmount: 2500,
          status: 'IN_REVIEW',
          serviceDescription: 'MRI scan and specialist consultation',
          diagnosisCode: 'M54.5',
          lastUpdated: '2026-01-30T16:00:00Z',
          timeline: [
            { status: 'DRAFT', date: '2026-01-28T09:00:00Z' },
            { status: 'SUBMITTED', date: '2026-01-28T11:00:00Z' },
            { status: 'IN_REVIEW', date: '2026-01-30T16:00:00Z' },
          ],
        },
        {
          id: '3',
          claimNumber: 'CLM-2026-0003',
          patientName: 'Mike Wilson',
          insuranceProvider: 'UnitedHealthcare',
          policyNumber: 'UHC-345678',
          serviceDate: '2026-02-01',
          submissionDate: '2026-02-02',
          claimAmount: 800,
          status: 'DENIED',
          serviceDescription: 'Physical therapy session',
          denialReason: 'Service not covered under plan',
          lastUpdated: '2026-02-05T09:00:00Z',
          timeline: [
            { status: 'DRAFT', date: '2026-02-02T08:00:00Z' },
            { status: 'SUBMITTED', date: '2026-02-02T09:00:00Z' },
            { status: 'IN_REVIEW', date: '2026-02-03T10:00:00Z' },
            { status: 'DENIED', date: '2026-02-05T09:00:00Z', note: 'Service not covered under plan' },
          ],
        },
        {
          id: '4',
          claimNumber: 'CLM-2026-0004',
          patientName: 'Sarah Johnson',
          insuranceProvider: 'Cigna',
          policyNumber: 'CIG-567890',
          serviceDate: '2026-02-10',
          submissionDate: '2026-02-12',
          claimAmount: 3200,
          status: 'DRAFT',
          serviceDescription: 'Emergency room visit and X-rays',
          diagnosisCode: 'S52.501A',
        },
      ]
      setClaims(sampleClaims)
      localStorage.setItem('insurance_claims', JSON.stringify(sampleClaims))
    }
  }, [])

  useEffect(() => {
    loadClaims()
  }, [loadClaims])

  const saveClaims = (newClaims: InsuranceClaim[]) => {
    localStorage.setItem('insurance_claims', JSON.stringify(newClaims))
    setClaims(newClaims)
  }

  const generateClaimNumber = () => {
    const year = new Date().getFullYear()
    const count = claims.length + 1
    return `CLM-${year}-${count.toString().padStart(4, '0')}`
  }

  const resetForm = () => {
    setClaimForm({
      patientName: '',
      insuranceProvider: '',
      policyNumber: '',
      serviceDate: '',
      claimAmount: '',
      serviceDescription: '',
      diagnosisCode: '',
      procedureCode: '',
      notes: '',
    })
  }

  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      const matchesSearch = c.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.policyNumber.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus
      const matchesProvider = filterProvider === 'all' || c.insuranceProvider === filterProvider
      return matchesSearch && matchesStatus && matchesProvider
    })
  }, [claims, searchQuery, filterStatus, filterProvider])

  const stats = useMemo(() => {
    const totalClaimed = claims.reduce((sum, c) => sum + c.claimAmount, 0)
    const totalApproved = claims.reduce((sum, c) => sum + (c.approvedAmount || 0), 0)
    const approvalRate = totalClaimed > 0 ? (totalApproved / totalClaimed) * 100 : 0
    return {
      total: claims.length,
      totalClaimed,
      totalApproved,
      pending: claims.filter(c => ['SUBMITTED', 'IN_REVIEW'].includes(c.status)).length,
      denied: claims.filter(c => c.status === 'DENIED').length,
      drafts: claims.filter(c => c.status === 'DRAFT').length,
      approvalRate,
    }
  }, [claims])

  const handleSaveClaim = () => {
    if (!claimForm.patientName || !claimForm.insuranceProvider || !claimForm.claimAmount) {
      toast.error('Error', 'Please fill in required fields')
      return
    }

    if (editingClaim) {
      const updated = claims.map(c => {
        if (c.id === editingClaim.id) {
          return {
            ...c,
            patientName: claimForm.patientName,
            insuranceProvider: claimForm.insuranceProvider,
            policyNumber: claimForm.policyNumber,
            serviceDate: claimForm.serviceDate,
            claimAmount: parseFloat(claimForm.claimAmount),
            serviceDescription: claimForm.serviceDescription,
            diagnosisCode: claimForm.diagnosisCode || undefined,
            procedureCode: claimForm.procedureCode || undefined,
            notes: claimForm.notes || undefined,
            lastUpdated: new Date().toISOString(),
          }
        }
        return c
      })
      saveClaims(updated)
      toast.success('Updated', 'Claim updated successfully')
    } else {
      const newClaim: InsuranceClaim = {
        id: crypto.randomUUID(),
        claimNumber: generateClaimNumber(),
        patientName: claimForm.patientName,
        insuranceProvider: claimForm.insuranceProvider,
        policyNumber: claimForm.policyNumber,
        serviceDate: claimForm.serviceDate,
        submissionDate: new Date().toISOString(),
        claimAmount: parseFloat(claimForm.claimAmount),
        status: 'DRAFT',
        serviceDescription: claimForm.serviceDescription,
        diagnosisCode: claimForm.diagnosisCode || undefined,
        procedureCode: claimForm.procedureCode || undefined,
        notes: claimForm.notes || undefined,
        lastUpdated: new Date().toISOString(),
        timeline: [{ status: 'DRAFT', date: new Date().toISOString() }],
      }
      saveClaims([newClaim, ...claims])
      toast.success('Created', 'New claim created')
    }

    setShowAddDialog(false)
    setEditingClaim(null)
    resetForm()
  }

  const handleEditClaim = (claim: InsuranceClaim) => {
    setEditingClaim(claim)
    setClaimForm({
      patientName: claim.patientName,
      insuranceProvider: claim.insuranceProvider,
      policyNumber: claim.policyNumber,
      serviceDate: claim.serviceDate,
      claimAmount: claim.claimAmount.toString(),
      serviceDescription: claim.serviceDescription,
      diagnosisCode: claim.diagnosisCode || '',
      procedureCode: claim.procedureCode || '',
      notes: claim.notes || '',
    })
    setShowAddDialog(true)
  }

  const handleSubmitClaim = (id: string) => {
    const updated = claims.map(c => {
      if (c.id === id) {
        const newTimeline = [...(c.timeline || []), { status: 'SUBMITTED', date: new Date().toISOString() }]
        return {
          ...c,
          status: 'SUBMITTED' as const,
          submissionDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          timeline: newTimeline,
        }
      }
      return c
    })
    saveClaims(updated)
    toast.success('Submitted', 'Claim submitted to insurance')
  }

  const handleAppealClaim = (id: string) => {
    const updated = claims.map(c => {
      if (c.id === id) {
        const newTimeline = [...(c.timeline || []), { status: 'APPEALED', date: new Date().toISOString(), note: 'Appeal submitted' }]
        return {
          ...c,
          status: 'APPEALED' as const,
          lastUpdated: new Date().toISOString(),
          timeline: newTimeline,
        }
      }
      return c
    })
    saveClaims(updated)
    toast.success('Appealed', 'Claim appeal submitted')
    setViewingClaim(null)
  }

  const handleDelete = (id: string) => {
    const updated = claims.filter(c => c.id !== id)
    saveClaims(updated)
    toast.success('Deleted', 'Claim removed')
    setViewingClaim(null)
  }

  const getProviderInfo = (providerName: string) => {
    return INSURANCE_PROVIDERS.find(p => p.name === providerName) || INSURANCE_PROVIDERS[INSURANCE_PROVIDERS.length - 1]
  }

  const getStatusConfig = (status: InsuranceClaim['status']) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT
  }

  const exportClaims = () => {
    const csv = [
      ['Claim #', 'Patient', 'Provider', 'Service Date', 'Amount', 'Approved', 'Status'].join(','),
      ...claims.map(c => [
        c.claimNumber,
        `"${c.patientName}"`,
        `"${c.insuranceProvider}"`,
        c.serviceDate,
        c.claimAmount,
        c.approvedAmount || '',
        c.status,
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `insurance_claims_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <Shield className="h-6 w-6" />
            </div>
            Insurance Claims
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track insurance claims
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportClaims} className="shadow-sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)} className="shadow-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Claim
          </Button>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Claims</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Claimed</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalClaimed)}</p>
                </div>
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Approved</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(stats.totalApproved)}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Approval Rate</p>
                  <p className="text-2xl font-bold">{stats.approvalRate.toFixed(0)}%</p>
                </div>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <Progress value={stats.approvalRate} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className={cn(
            "border-0 shadow-md hover:shadow-lg transition-all",
            stats.pending > 0 && "ring-2 ring-amber-500/20"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                </div>
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className={cn(
            "border-0 shadow-md hover:shadow-lg transition-all",
            stats.denied > 0 && "ring-2 ring-red-500/20"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Denied</p>
                  <p className="text-2xl font-bold text-red-600">{stats.denied}</p>
                </div>
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 shadow-sm"
              placeholder="Search claims..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] shadow-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <SelectItem key={status} value={status}>
                  <span className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", `bg-${config.color}-500`)} />
                    {config.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterProvider} onValueChange={setFilterProvider}>
            <SelectTrigger className="w-[180px] shadow-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {INSURANCE_PROVIDERS.map(p => (
                <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex border rounded-md overflow-hidden shadow-sm">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Claims Table / Grid */}
      {viewMode === 'table' ? (
        <Card className="border-0 shadow-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Claim #</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Service Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Approved</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredClaims.map((claim) => {
                  const statusConfig = getStatusConfig(claim.status)
                  const StatusIcon = statusConfig.icon
                  const providerInfo = getProviderInfo(claim.insuranceProvider)

                  return (
                    <motion.tr
                      key={claim.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group cursor-pointer hover:bg-muted/30"
                      onClick={() => setViewingClaim(claim)}
                    >
                      <TableCell className="font-mono text-sm font-medium">{claim.claimNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{claim.patientName}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {claim.serviceDescription}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-xs", `border-${providerInfo.color}-300`)}>
                            {providerInfo.abbrev}
                          </Badge>
                          <div>
                            <p className="text-sm">{claim.insuranceProvider}</p>
                            <p className="text-xs text-muted-foreground font-mono">{claim.policyNumber}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{format(new Date(claim.serviceDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(claim.claimAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {claim.approvedAmount ? (
                          <span className="text-emerald-600 font-medium">
                            {formatCurrency(claim.approvedAmount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", statusConfig.bgClass)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          {claim.status === 'DRAFT' && (
                            <Button size="sm" variant="ghost" onClick={() => handleSubmitClaim(claim.id)} className="h-8 w-8 p-0">
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleEditClaim(claim)} className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(claim.id)}>
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
          {filteredClaims.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No claims found</p>
            </div>
          )}
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredClaims.map((claim) => {
            const statusConfig = getStatusConfig(claim.status)
            const StatusIcon = statusConfig.icon
            const providerInfo = getProviderInfo(claim.insuranceProvider)

            return (
              <motion.div key={claim.id} variants={itemVariants}>
                <Card
                  className={cn(
                    "border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group",
                    claim.status === 'DENIED' && "ring-2 ring-red-500/20"
                  )}
                  onClick={() => setViewingClaim(claim)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "p-2 rounded-lg",
                          `bg-${providerInfo.color}-100 dark:bg-${providerInfo.color}-900/30`
                        )}>
                          <Building2 className={cn("h-5 w-5", `text-${providerInfo.color}-600`)} />
                        </div>
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">{claim.claimNumber}</p>
                          <p className="font-semibold">{claim.patientName}</p>
                        </div>
                      </div>
                      <Badge className={cn("gap-1 text-xs", statusConfig.bgClass)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {claim.serviceDescription}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Provider</span>
                        <span className="font-medium">{providerInfo.abbrev}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Claimed</span>
                        <span className="font-semibold">{formatCurrency(claim.claimAmount)}</span>
                      </div>
                      {claim.approvedAmount && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Approved</span>
                          <span className="font-semibold text-emerald-600">{formatCurrency(claim.approvedAmount)}</span>
                        </div>
                      )}
                    </div>

                    <Separator className="my-3" />

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{format(new Date(claim.serviceDate), 'MMM d, yyyy')}</span>
                      {claim.lastUpdated && (
                        <span>{formatDistanceToNow(new Date(claim.lastUpdated), { addSuffix: true })}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Claim Detail Sheet */}
      <Sheet open={!!viewingClaim} onOpenChange={() => setViewingClaim(null)}>
        <SheetContent className="sm:max-w-lg">
          {viewingClaim && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  {(() => {
                    const providerInfo = getProviderInfo(viewingClaim.insuranceProvider)
                    return (
                      <div className={cn(
                        "p-3 rounded-xl",
                        `bg-${providerInfo.color}-100 dark:bg-${providerInfo.color}-900/30`
                      )}>
                        <Shield className={cn("h-6 w-6", `text-${providerInfo.color}-600`)} />
                      </div>
                    )
                  })()}
                  <div>
                    <SheetTitle>{viewingClaim.claimNumber}</SheetTitle>
                    <SheetDescription>{viewingClaim.patientName}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="details" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4 space-y-4">
                  {/* Status Card */}
                  <Card className="border-0 shadow-sm bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Status</span>
                        {(() => {
                          const statusConfig = getStatusConfig(viewingClaim.status)
                          const StatusIcon = statusConfig.icon
                          return (
                            <Badge className={cn("gap-1", statusConfig.bgClass)}>
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                          )
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financial Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Claimed Amount</p>
                        <p className="text-xl font-bold">{formatCurrency(viewingClaim.claimAmount)}</p>
                      </CardContent>
                    </Card>
                    <Card className={cn(
                      "border-0 shadow-sm",
                      viewingClaim.approvedAmount
                        ? "bg-emerald-50 dark:bg-emerald-950/30"
                        : "bg-muted/30"
                    )}>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Approved Amount</p>
                        <p className={cn(
                          "text-xl font-bold",
                          viewingClaim.approvedAmount ? "text-emerald-600" : "text-muted-foreground"
                        )}>
                          {viewingClaim.approvedAmount ? formatCurrency(viewingClaim.approvedAmount) : '—'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Claim Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Claim Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Provider</p>
                          <p className="font-medium">{viewingClaim.insuranceProvider}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Policy #</p>
                          <p className="font-medium font-mono">{viewingClaim.policyNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Service Date</p>
                          <p className="font-medium">{format(new Date(viewingClaim.serviceDate), 'PPP')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Send className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground">Submitted</p>
                          <p className="font-medium">{format(new Date(viewingClaim.submissionDate), 'PPP')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Service Description */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Service Description</h4>
                    <div className="bg-muted/30 p-3 rounded-lg text-sm">
                      {viewingClaim.serviceDescription}
                    </div>
                  </div>

                  {/* Codes */}
                  {(viewingClaim.diagnosisCode || viewingClaim.procedureCode) && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {viewingClaim.diagnosisCode && (
                        <div>
                          <p className="text-muted-foreground text-xs">Diagnosis Code (ICD-10)</p>
                          <Badge variant="outline" className="font-mono mt-1">{viewingClaim.diagnosisCode}</Badge>
                        </div>
                      )}
                      {viewingClaim.procedureCode && (
                        <div>
                          <p className="text-muted-foreground text-xs">Procedure Code (CPT)</p>
                          <Badge variant="outline" className="font-mono mt-1">{viewingClaim.procedureCode}</Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Denial Reason */}
                  {viewingClaim.denialReason && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-red-600">Denial Reason</h4>
                      <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{viewingClaim.denialReason}</span>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="timeline" className="mt-4">
                  {viewingClaim.timeline && viewingClaim.timeline.length > 0 ? (
                    <div className="relative pl-6 space-y-6">
                      <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-muted" />
                      {viewingClaim.timeline.map((event, idx) => {
                        const statusConfig = getStatusConfig(event.status as InsuranceClaim['status'])
                        const StatusIcon = statusConfig.icon
                        return (
                          <div key={idx} className="relative">
                            <div className={cn(
                              "absolute left-[-24px] w-5 h-5 rounded-full border-2 border-background flex items-center justify-center",
                              `bg-${statusConfig.color}-500`
                            )}>
                              <StatusIcon className="h-3 w-3 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge className={statusConfig.bgClass}>{statusConfig.label}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(event.date), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                              {event.note && (
                                <p className="text-sm text-muted-foreground mt-1">{event.note}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">No timeline available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="mt-4 space-y-4">
                  <div className="grid gap-3">
                    {viewingClaim.status === 'DRAFT' && (
                      <Button className="w-full justify-start gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700" onClick={() => {
                        handleSubmitClaim(viewingClaim.id)
                        setViewingClaim(null)
                      }}>
                        <Send className="h-4 w-4" />
                        Submit to Insurance
                      </Button>
                    )}
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => {
                      setViewingClaim(null)
                      handleEditClaim(viewingClaim)
                    }}>
                      <Edit className="h-4 w-4" />
                      Edit Claim
                    </Button>
                    {viewingClaim.status === 'DENIED' && (
                      <Button variant="outline" className="w-full justify-start gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50" onClick={() => handleAppealClaim(viewingClaim.id)}>
                        <RefreshCw className="h-4 w-4" />
                        File Appeal
                      </Button>
                    )}
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Download className="h-4 w-4" />
                      Download Claim PDF
                    </Button>
                    <Separator />
                    <Button
                      variant="destructive"
                      className="w-full justify-start gap-2"
                      onClick={() => handleDelete(viewingClaim.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Claim
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add/Edit Claim Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open)
        if (!open) {
          setEditingClaim(null)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {editingClaim ? 'Edit Claim' : 'New Insurance Claim'}
            </DialogTitle>
            <DialogDescription>
              {editingClaim ? 'Update claim information' : 'Create a new insurance claim'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="patient" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="patient">Patient & Insurance</TabsTrigger>
              <TabsTrigger value="service">Service Details</TabsTrigger>
            </TabsList>

            <TabsContent value="patient" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patient Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={claimForm.patientName}
                    onChange={(e) => setClaimForm({ ...claimForm, patientName: e.target.value })}
                    placeholder="Patient name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Claim Amount <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    value={claimForm.claimAmount}
                    onChange={(e) => setClaimForm({ ...claimForm, claimAmount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Insurance Provider <span className="text-red-500">*</span></Label>
                  <Select
                    value={claimForm.insuranceProvider}
                    onValueChange={(value) => setClaimForm({ ...claimForm, insuranceProvider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {INSURANCE_PROVIDERS.map(p => (
                        <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Policy Number</Label>
                  <Input
                    value={claimForm.policyNumber}
                    onChange={(e) => setClaimForm({ ...claimForm, policyNumber: e.target.value })}
                    placeholder="Policy #"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Service Date</Label>
                <Input
                  type="date"
                  value={claimForm.serviceDate}
                  onChange={(e) => setClaimForm({ ...claimForm, serviceDate: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="service" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Service Description</Label>
                <Textarea
                  value={claimForm.serviceDescription}
                  onChange={(e) => setClaimForm({ ...claimForm, serviceDescription: e.target.value })}
                  placeholder="Describe the services provided..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Diagnosis Code (ICD-10)</Label>
                  <Input
                    value={claimForm.diagnosisCode}
                    onChange={(e) => setClaimForm({ ...claimForm, diagnosisCode: e.target.value })}
                    placeholder="e.g., Z00.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Procedure Code (CPT)</Label>
                  <Input
                    value={claimForm.procedureCode}
                    onChange={(e) => setClaimForm({ ...claimForm, procedureCode: e.target.value })}
                    placeholder="e.g., 99213"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={claimForm.notes}
                  onChange={(e) => setClaimForm({ ...claimForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false)
              setEditingClaim(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveClaim} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
              {editingClaim ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Claim
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Claim
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
