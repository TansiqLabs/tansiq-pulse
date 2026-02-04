import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
}

const INSURANCE_PROVIDERS = [
  'Blue Cross Blue Shield',
  'Aetna',
  'UnitedHealthcare',
  'Cigna',
  'Humana',
  'Kaiser Permanente',
  'Anthem',
  'Medicare',
  'Medicaid',
  'Other',
]

export function InsuranceClaimsManager() {
  const toast = useToast()
  const [claims, setClaims] = useState<InsuranceClaim[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterProvider, setFilterProvider] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingClaim, setEditingClaim] = useState<InsuranceClaim | null>(null)

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
      // Sample claims
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
        return { ...c, status: 'SUBMITTED' as const, submissionDate: new Date().toISOString() }
      }
      return c
    })
    saveClaims(updated)
    toast.success('Submitted', 'Claim submitted to insurance')
  }

  const handleDelete = (id: string) => {
    const updated = claims.filter(c => c.id !== id)
    saveClaims(updated)
    toast.success('Deleted', 'Claim removed')
  }

  const getStatusBadge = (status: InsuranceClaim['status']) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">Draft</Badge>
      case 'SUBMITTED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Submitted</Badge>
      case 'IN_REVIEW':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">In Review</Badge>
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Approved</Badge>
      case 'PARTIALLY_APPROVED':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Partial</Badge>
      case 'DENIED':
        return <Badge variant="destructive">Denied</Badge>
      case 'APPEALED':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Appealed</Badge>
    }
  }

  const getStatusIcon = (status: InsuranceClaim['status']) => {
    switch (status) {
      case 'APPROVED':
      case 'PARTIALLY_APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'DENIED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'IN_REVIEW':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredClaims = claims.filter(c => {
    const matchesSearch = c.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.policyNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus
    const matchesProvider = filterProvider === 'all' || c.insuranceProvider === filterProvider
    return matchesSearch && matchesStatus && matchesProvider
  })

  const stats = {
    total: claims.length,
    totalClaimed: claims.reduce((sum, c) => sum + c.claimAmount, 0),
    totalApproved: claims.reduce((sum, c) => sum + (c.approvedAmount || 0), 0),
    pending: claims.filter(c => ['SUBMITTED', 'IN_REVIEW'].includes(c.status)).length,
    denied: claims.filter(c => c.status === 'DENIED').length,
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Claimed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalClaimed)}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalApproved)}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.denied}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search claims..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="DENIED">Denied</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterProvider} onValueChange={setFilterProvider}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {INSURANCE_PROVIDERS.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Claim
        </Button>
      </div>

      {/* Claims Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim #</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Service Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Approved</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredClaims.map((claim) => (
                  <motion.tr
                    key={claim.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group"
                  >
                    <TableCell className="font-mono text-sm">{claim.claimNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{claim.patientName}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {claim.serviceDescription}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{claim.insuranceProvider}</p>
                        <p className="text-xs text-muted-foreground font-mono">{claim.policyNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(claim.serviceDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(claim.claimAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {claim.approvedAmount ? (
                        <span className="text-green-600 font-medium">
                          {formatCurrency(claim.approvedAmount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(claim.status)}
                        {getStatusBadge(claim.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {claim.status === 'DRAFT' && (
                          <Button size="sm" variant="ghost" onClick={() => handleSubmitClaim(claim.id)}>
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleEditClaim(claim)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(claim.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
          {filteredClaims.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No claims found</p>
            </div>
          )}
        </CardContent>
      </Card>

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
            <DialogTitle>{editingClaim ? 'Edit Claim' : 'New Insurance Claim'}</DialogTitle>
            <DialogDescription>
              {editingClaim ? 'Update claim information' : 'Create a new insurance claim'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient Name *</Label>
                <Input
                  value={claimForm.patientName}
                  onChange={(e) => setClaimForm({ ...claimForm, patientName: e.target.value })}
                  placeholder="Patient name"
                />
              </div>
              <div className="space-y-2">
                <Label>Claim Amount *</Label>
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
                <Label>Insurance Provider *</Label>
                <Select
                  value={claimForm.insuranceProvider}
                  onValueChange={(value) => setClaimForm({ ...claimForm, insuranceProvider: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSURANCE_PROVIDERS.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
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

            <div className="space-y-2">
              <Label>Service Description</Label>
              <Textarea
                value={claimForm.serviceDescription}
                onChange={(e) => setClaimForm({ ...claimForm, serviceDescription: e.target.value })}
                placeholder="Describe the services provided..."
                rows={2}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false)
              setEditingClaim(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveClaim}>
              {editingClaim ? 'Update Claim' : 'Create Claim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
