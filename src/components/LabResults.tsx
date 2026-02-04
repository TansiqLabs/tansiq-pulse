import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import {
  FlaskConical,
  Plus,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  Microscope,
  Stethoscope,
  Heart,
  Droplets,
  Brain,
  Bone,
  LayoutGrid,
  List,
  Printer,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import { cn } from '@/lib/utils'

interface LabTest {
  id: string
  patientId: number
  testName: string
  testCategory: string
  orderedBy: string
  orderedDate: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  result?: string
  normalRange?: string
  unit?: string
  isAbnormal?: boolean
  severity?: 'low' | 'normal' | 'high' | 'critical'
  resultDate?: string
  notes?: string
  priority?: 'routine' | 'urgent' | 'stat'
}

interface LabResultsProps {
  patientId: number
  patientName: string
}

const TEST_CATEGORIES = [
  { name: 'Blood Test', icon: Droplets, color: 'red' },
  { name: 'Urine Test', icon: FlaskConical, color: 'amber' },
  { name: 'X-Ray', icon: Bone, color: 'slate' },
  { name: 'MRI', icon: Brain, color: 'purple' },
  { name: 'CT Scan', icon: Activity, color: 'blue' },
  { name: 'Ultrasound', icon: Heart, color: 'pink' },
  { name: 'ECG', icon: Activity, color: 'emerald' },
  { name: 'Blood Chemistry', icon: Microscope, color: 'indigo' },
  { name: 'Hormone Panel', icon: TrendingUp, color: 'violet' },
  { name: 'Other', icon: Stethoscope, color: 'gray' },
]

const COMMON_TESTS: Record<string, { name: string; normalRange?: string; unit?: string }[]> = {
  'Blood Test': [
    { name: 'Complete Blood Count (CBC)', normalRange: 'Multiple values', unit: '' },
    { name: 'Blood Glucose', normalRange: '70-100', unit: 'mg/dL' },
    { name: 'Hemoglobin A1C', normalRange: '< 5.7', unit: '%' },
    { name: 'Lipid Panel', normalRange: 'Multiple values', unit: '' },
    { name: 'Liver Function Test', normalRange: 'Multiple values', unit: '' },
    { name: 'Kidney Function Test', normalRange: 'Multiple values', unit: '' },
  ],
  'Urine Test': [
    { name: 'Urinalysis', normalRange: 'Normal', unit: '' },
    { name: 'Urine Culture', normalRange: 'No growth', unit: '' },
    { name: 'Protein/Creatinine Ratio', normalRange: '< 0.2', unit: 'g/g' },
  ],
  'Blood Chemistry': [
    { name: 'Electrolytes', normalRange: 'Multiple values', unit: '' },
    { name: 'BUN/Creatinine', normalRange: '7-20 / 0.6-1.2', unit: 'mg/dL' },
    { name: 'Thyroid Panel (TSH, T3, T4)', normalRange: 'Multiple values', unit: '' },
  ],
  'Hormone Panel': [
    { name: 'Testosterone', normalRange: '270-1070', unit: 'ng/dL' },
    { name: 'Estrogen', normalRange: 'Varies', unit: 'pg/mL' },
    { name: 'Cortisol', normalRange: '6-23', unit: 'mcg/dL' },
    { name: 'Insulin', normalRange: '2.6-24.9', unit: 'mcIU/mL' },
  ],
  'X-Ray': [
    { name: 'Chest X-Ray', normalRange: 'Normal findings', unit: '' },
    { name: 'Abdominal X-Ray', normalRange: 'Normal findings', unit: '' },
    { name: 'Spine X-Ray', normalRange: 'Normal findings', unit: '' },
    { name: 'Extremity X-Ray', normalRange: 'Normal findings', unit: '' },
  ],
  'MRI': [
    { name: 'Brain MRI', normalRange: 'Normal findings', unit: '' },
    { name: 'Spine MRI', normalRange: 'Normal findings', unit: '' },
    { name: 'Abdominal MRI', normalRange: 'Normal findings', unit: '' },
    { name: 'Joint MRI', normalRange: 'Normal findings', unit: '' },
  ],
  'CT Scan': [
    { name: 'Head CT', normalRange: 'Normal findings', unit: '' },
    { name: 'Chest CT', normalRange: 'Normal findings', unit: '' },
    { name: 'Abdominal CT', normalRange: 'Normal findings', unit: '' },
    { name: 'Full Body CT', normalRange: 'Normal findings', unit: '' },
  ],
  'Ultrasound': [
    { name: 'Abdominal Ultrasound', normalRange: 'Normal findings', unit: '' },
    { name: 'Pelvic Ultrasound', normalRange: 'Normal findings', unit: '' },
    { name: 'Cardiac Echo', normalRange: 'Normal findings', unit: '' },
    { name: 'Thyroid Ultrasound', normalRange: 'Normal findings', unit: '' },
  ],
  'ECG': [
    { name: '12-Lead ECG', normalRange: 'Normal sinus rhythm', unit: '' },
    { name: 'Holter Monitor', normalRange: 'Normal findings', unit: '' },
    { name: 'Stress Test', normalRange: 'Normal findings', unit: '' },
  ],
  'Other': [
    { name: 'Biopsy', normalRange: 'Benign', unit: '' },
    { name: 'Endoscopy', normalRange: 'Normal findings', unit: '' },
    { name: 'Colonoscopy', normalRange: 'Normal findings', unit: '' },
  ],
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

export function LabResults({ patientId, patientName }: LabResultsProps) {
  const toast = useToast()
  const [tests, setTests] = useState<LabTest[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null)
  const [viewingTest, setViewingTest] = useState<LabTest | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  const [formData, setFormData] = useState({
    testName: '',
    testCategory: '',
    orderedBy: '',
    notes: '',
    priority: 'routine' as LabTest['priority'],
  })

  const [resultData, setResultData] = useState({
    result: '',
    normalRange: '',
    unit: '',
    isAbnormal: false,
    severity: 'normal' as LabTest['severity'],
    notes: '',
  })

  const loadTests = useCallback(() => {
    const stored = localStorage.getItem(`lab_tests_${patientId}`)
    if (stored) {
      setTests(JSON.parse(stored))
    }
  }, [patientId])

  useEffect(() => {
    loadTests()
  }, [loadTests])

  const saveTests = (newTests: LabTest[]) => {
    localStorage.setItem(`lab_tests_${patientId}`, JSON.stringify(newTests))
    setTests(newTests)
  }

  const filteredTests = useMemo(() => {
    return tests.filter(test => {
      const matchesSearch = test.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.testCategory.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === 'all' || test.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [tests, searchQuery, filterStatus])

  const stats = useMemo(() => {
    return {
      total: tests.length,
      pending: tests.filter(t => t.status === 'PENDING').length,
      inProgress: tests.filter(t => t.status === 'IN_PROGRESS').length,
      completed: tests.filter(t => t.status === 'COMPLETED').length,
      abnormal: tests.filter(t => t.isAbnormal).length,
    }
  }, [tests])

  const handleAddTest = () => {
    if (!formData.testName || !formData.testCategory || !formData.orderedBy) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    const selectedTestInfo = COMMON_TESTS[formData.testCategory]?.find(t => t.name === formData.testName)

    const newTest: LabTest = {
      id: crypto.randomUUID(),
      patientId,
      testName: formData.testName,
      testCategory: formData.testCategory,
      orderedBy: formData.orderedBy,
      orderedDate: new Date().toISOString(),
      status: 'PENDING',
      notes: formData.notes,
      priority: formData.priority,
      normalRange: selectedTestInfo?.normalRange,
      unit: selectedTestInfo?.unit,
    }

    saveTests([newTest, ...tests])
    setShowAddDialog(false)
    setFormData({ testName: '', testCategory: '', orderedBy: '', notes: '', priority: 'routine' })
    setSelectedCategory('')
    toast.success('Success', 'Lab test ordered successfully')
  }

  const handleAddResult = () => {
    if (!selectedTest || !resultData.result) {
      toast.error('Error', 'Please enter the test result')
      return
    }

    const updatedTests = tests.map(test => {
      if (test.id === selectedTest.id) {
        return {
          ...test,
          status: 'COMPLETED' as const,
          result: resultData.result,
          normalRange: resultData.normalRange || test.normalRange,
          unit: resultData.unit || test.unit,
          isAbnormal: resultData.isAbnormal,
          severity: resultData.severity,
          resultDate: new Date().toISOString(),
          notes: resultData.notes || test.notes,
        }
      }
      return test
    })

    saveTests(updatedTests)
    setShowResultDialog(false)
    setSelectedTest(null)
    setResultData({ result: '', normalRange: '', unit: '', isAbnormal: false, severity: 'normal', notes: '' })
    toast.success('Success', 'Test result added successfully')
  }

  const handleDeleteTest = (testId: string) => {
    const updatedTests = tests.filter(t => t.id !== testId)
    saveTests(updatedTests)
    toast.success('Deleted', 'Lab test removed')
    setViewingTest(null)
  }

  const handleMarkInProgress = (testId: string) => {
    const updatedTests = tests.map(test => {
      if (test.id === testId) {
        return { ...test, status: 'IN_PROGRESS' as const }
      }
      return test
    })
    saveTests(updatedTests)
    toast.info('Updated', 'Test marked as in progress')
  }

  const getCategoryInfo = (categoryName: string) => {
    return TEST_CATEGORIES.find(c => c.name === categoryName) || TEST_CATEGORIES[TEST_CATEGORIES.length - 1]
  }

  const getStatusConfig = (status: LabTest['status']) => {
    switch (status) {
      case 'PENDING':
        return { icon: Clock, label: 'Pending', bgClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
      case 'IN_PROGRESS':
        return { icon: FlaskConical, label: 'In Progress', bgClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
      case 'COMPLETED':
        return { icon: CheckCircle, label: 'Completed', bgClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' }
    }
  }

  const getSeverityConfig = (severity?: LabTest['severity']) => {
    switch (severity) {
      case 'low':
        return { label: 'Low', bgClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: TrendingDown }
      case 'high':
        return { label: 'High', bgClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: TrendingUp }
      case 'critical':
        return { label: 'Critical', bgClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle }
      default:
        return { label: 'Normal', bgClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle }
    }
  }

  const getPriorityConfig = (priority?: LabTest['priority']) => {
    switch (priority) {
      case 'urgent':
        return { label: 'Urgent', bgClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
      case 'stat':
        return { label: 'STAT', bgClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
      default:
        return { label: 'Routine', bgClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400' }
    }
  }

  const exportResults = () => {
    const completedTests = tests.filter(t => t.status === 'COMPLETED')
    const csv = [
      ['Test Name', 'Category', 'Result', 'Normal Range', 'Status', 'Date'].join(','),
      ...completedTests.map(t => [
        `"${t.testName}"`,
        t.testCategory,
        `"${t.result || ''}"`,
        `"${t.normalRange || ''}"`,
        t.isAbnormal ? 'Abnormal' : 'Normal',
        t.resultDate ? format(new Date(t.resultDate), 'yyyy-MM-dd') : '',
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lab_results_${patientName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20">
              <FlaskConical className="h-5 w-5" />
            </div>
            Lab Results
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {patientName} • {tests.length} total tests
          </p>
        </div>
        <div className="flex gap-2">
          {stats.completed > 0 && (
            <Button variant="outline" size="sm" onClick={exportResults} className="shadow-sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          <Button size="sm" onClick={() => setShowAddDialog(true)} className="shadow-sm bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Order Test
          </Button>
        </div>
      </div>

      {/* Stats */}
      {tests.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <FlaskConical className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-all">
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
            <Card className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                  </div>
                  <RefreshCw className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className={cn(
              "border-0 shadow-sm hover:shadow-md transition-all",
              stats.abnormal > 0 && "ring-2 ring-red-500/20"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Abnormal</p>
                    <p className="text-2xl font-bold text-red-600">{stats.abnormal}</p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Filters */}
      {tests.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 shadow-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] shadow-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
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
      )}

      {/* Tests List */}
      {tests.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <FlaskConical className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No Lab Tests</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              No lab tests have been ordered for this patient yet.
            </p>
            <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Order First Test
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="border-0 shadow-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Test</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Ordered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredTests.map((test) => {
                  const catInfo = getCategoryInfo(test.testCategory)
                  const statusConfig = getStatusConfig(test.status)
                  const StatusIcon = statusConfig.icon
                  const CatIcon = catInfo.icon

                  return (
                    <motion.tr
                      key={test.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group cursor-pointer hover:bg-muted/30"
                      onClick={() => setViewingTest(test)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            `bg-${catInfo.color}-100 dark:bg-${catInfo.color}-900/30`
                          )}>
                            <CatIcon className={cn("h-4 w-4", `text-${catInfo.color}-600`)} />
                          </div>
                          <div>
                            <span className="font-medium">{test.testName}</span>
                            {test.isAbnormal && (
                              <AlertTriangle className="inline-block ml-2 h-4 w-4 text-red-500" />
                            )}
                            {test.priority && test.priority !== 'routine' && (
                              <Badge className={cn("ml-2 text-xs", getPriorityConfig(test.priority).bgClass)}>
                                {getPriorityConfig(test.priority).label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{test.testCategory}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(test.orderedDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", statusConfig.bgClass)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {test.status === 'COMPLETED' ? (
                          <div className="text-sm">
                            <span className={test.isAbnormal ? 'text-red-600 font-medium' : 'font-medium'}>
                              {test.result} {test.unit}
                            </span>
                            {test.severity && test.severity !== 'normal' && (
                              <Badge className={cn("ml-2 text-xs", getSeverityConfig(test.severity).bgClass)}>
                                {getSeverityConfig(test.severity).label}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          {test.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkInProgress(test.id)}
                              title="Mark In Progress"
                              className="h-8 w-8 p-0"
                            >
                              <FlaskConical className="h-4 w-4" />
                            </Button>
                          )}
                          {test.status !== 'COMPLETED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTest(test)
                                setResultData({
                                  result: '',
                                  normalRange: test.normalRange || '',
                                  unit: test.unit || '',
                                  isAbnormal: false,
                                  severity: 'normal',
                                  notes: test.notes || '',
                                })
                                setShowResultDialog(true)
                              }}
                              title="Add Result"
                              className="h-8 w-8 p-0"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteTest(test.id)}
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredTests.map((test) => {
            const catInfo = getCategoryInfo(test.testCategory)
            const statusConfig = getStatusConfig(test.status)
            const StatusIcon = statusConfig.icon
            const CatIcon = catInfo.icon

            return (
              <motion.div key={test.id} variants={itemVariants}>
                <Card
                  className={cn(
                    "border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group",
                    test.isAbnormal && "ring-2 ring-red-500/20"
                  )}
                  onClick={() => setViewingTest(test)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "p-2 rounded-lg",
                          `bg-${catInfo.color}-100 dark:bg-${catInfo.color}-900/30`
                        )}>
                          <CatIcon className={cn("h-5 w-5", `text-${catInfo.color}-600`)} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm line-clamp-1">{test.testName}</h4>
                          <p className="text-xs text-muted-foreground">{test.testCategory}</p>
                        </div>
                      </div>
                      {test.isAbnormal && (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={cn("text-xs gap-1", statusConfig.bgClass)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                        {test.priority && test.priority !== 'routine' && (
                          <Badge className={cn("text-xs", getPriorityConfig(test.priority).bgClass)}>
                            {getPriorityConfig(test.priority).label}
                          </Badge>
                        )}
                      </div>

                      {test.status === 'COMPLETED' && (
                        <div className="bg-muted/50 rounded-lg p-2 mt-2">
                          <p className={cn(
                            "text-sm font-medium",
                            test.isAbnormal && "text-red-600"
                          )}>
                            {test.result} {test.unit}
                          </p>
                          {test.normalRange && (
                            <p className="text-xs text-muted-foreground">
                              Normal: {test.normalRange} {test.unit}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                        <span>{format(new Date(test.orderedDate), 'MMM d')}</span>
                        <span>{formatDistanceToNow(new Date(test.orderedDate), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Test Detail Sheet */}
      <Sheet open={!!viewingTest} onOpenChange={() => setViewingTest(null)}>
        <SheetContent className="sm:max-w-lg">
          {viewingTest && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  {(() => {
                    const catInfo = getCategoryInfo(viewingTest.testCategory)
                    const CatIcon = catInfo.icon
                    return (
                      <div className={cn(
                        "p-3 rounded-xl",
                        `bg-${catInfo.color}-100 dark:bg-${catInfo.color}-900/30`
                      )}>
                        <CatIcon className={cn("h-6 w-6", `text-${catInfo.color}-600`)} />
                      </div>
                    )
                  })()}
                  <div>
                    <SheetTitle>{viewingTest.testName}</SheetTitle>
                    <SheetDescription>{viewingTest.testCategory}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="details" className="mt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4 space-y-4">
                  {/* Status */}
                  <Card className="border-0 shadow-sm bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Status</span>
                        <Badge className={getStatusConfig(viewingTest.status).bgClass}>
                          {getStatusConfig(viewingTest.status).label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Test Info */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Test Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Ordered By</span>
                        <p className="font-medium">{viewingTest.orderedBy}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Order Date</span>
                        <p className="font-medium">{format(new Date(viewingTest.orderedDate), 'PP')}</p>
                      </div>
                      {viewingTest.priority && (
                        <div>
                          <span className="text-muted-foreground">Priority</span>
                          <p className="font-medium capitalize">{viewingTest.priority}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Result */}
                  {viewingTest.status === 'COMPLETED' && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Test Result</h4>
                        <Card className={cn(
                          "border-0 shadow-sm",
                          viewingTest.isAbnormal
                            ? "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10"
                            : "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10"
                        )}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className={cn(
                                "text-2xl font-bold",
                                viewingTest.isAbnormal ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"
                              )}>
                                {viewingTest.result} {viewingTest.unit}
                              </span>
                              {viewingTest.isAbnormal && (
                                <Badge className={getSeverityConfig(viewingTest.severity).bgClass}>
                                  {getSeverityConfig(viewingTest.severity).label}
                                </Badge>
                              )}
                            </div>
                            {viewingTest.normalRange && (
                              <p className="text-sm text-muted-foreground">
                                Normal Range: {viewingTest.normalRange} {viewingTest.unit}
                              </p>
                            )}
                            {viewingTest.resultDate && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Result added: {format(new Date(viewingTest.resultDate), 'PPp')}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}

                  {viewingTest.notes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Notes</h4>
                        <p className="text-sm bg-muted/30 p-3 rounded-lg">{viewingTest.notes}</p>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="mt-4 space-y-4">
                  <div className="grid gap-3">
                    {viewingTest.status === 'PENDING' && (
                      <Button className="w-full justify-start gap-2" onClick={() => handleMarkInProgress(viewingTest.id)}>
                        <FlaskConical className="h-4 w-4" />
                        Mark as In Progress
                      </Button>
                    )}
                    {viewingTest.status !== 'COMPLETED' && (
                      <Button className="w-full justify-start gap-2" onClick={() => {
                        setViewingTest(null)
                        setSelectedTest(viewingTest)
                        setResultData({
                          result: '',
                          normalRange: viewingTest.normalRange || '',
                          unit: viewingTest.unit || '',
                          isAbnormal: false,
                          severity: 'normal',
                          notes: viewingTest.notes || '',
                        })
                        setShowResultDialog(true)
                      }}>
                        <FileText className="h-4 w-4" />
                        Add Result
                      </Button>
                    )}
                    {viewingTest.status === 'COMPLETED' && (
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Printer className="h-4 w-4" />
                        Print Result
                      </Button>
                    )}
                    <Separator />
                    <Button
                      variant="destructive"
                      className="w-full justify-start gap-2"
                      onClick={() => handleDeleteTest(viewingTest.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Test
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Order Test Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Order Lab Test
            </DialogTitle>
            <DialogDescription>
              Order a new lab test for {patientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Test Category <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.testCategory}
                  onValueChange={(value) => {
                    setFormData({ ...formData, testCategory: value, testName: '' })
                    setSelectedCategory(value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEST_CATEGORIES.map((cat) => {
                      const CatIcon = cat.icon
                      return (
                        <SelectItem key={cat.name} value={cat.name}>
                          <span className="flex items-center gap-2">
                            <CatIcon className="h-4 w-4" />
                            {cat.name}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as LabTest['priority'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="stat">STAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Test Name <span className="text-red-500">*</span></Label>
              {selectedCategory && COMMON_TESTS[selectedCategory] ? (
                <Select
                  value={formData.testName}
                  onValueChange={(value) => setFormData({ ...formData, testName: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select test" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_TESTS[selectedCategory].map((test) => (
                      <SelectItem key={test.name} value={test.name}>{test.name}</SelectItem>
                    ))}
                    <SelectItem value="custom">Other (Custom)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={formData.testName}
                  onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                  placeholder="Enter test name"
                />
              )}
              {formData.testName === 'custom' && (
                <Input
                  className="mt-2"
                  placeholder="Enter custom test name"
                  onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Ordered By <span className="text-red-500">*</span></Label>
              <Input
                value={formData.orderedBy}
                onChange={(e) => setFormData({ ...formData, orderedBy: e.target.value })}
                placeholder="Doctor name"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional instructions..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTest} className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Order Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Add Test Result
            </DialogTitle>
            <DialogDescription>
              {selectedTest?.testName} - {selectedTest?.testCategory}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Result <span className="text-red-500">*</span></Label>
                <Input
                  value={resultData.result}
                  onChange={(e) => setResultData({ ...resultData, result: e.target.value })}
                  placeholder="Enter result value"
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  value={resultData.unit}
                  onChange={(e) => setResultData({ ...resultData, unit: e.target.value })}
                  placeholder="e.g., mg/dL"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Normal Range</Label>
              <Input
                value={resultData.normalRange}
                onChange={(e) => setResultData({ ...resultData, normalRange: e.target.value })}
                placeholder="e.g., 70-100"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="abnormal"
                  checked={resultData.isAbnormal}
                  onChange={(e) => setResultData({ ...resultData, isAbnormal: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="abnormal" className="text-sm font-normal cursor-pointer">
                  Mark as abnormal result
                </Label>
              </div>

              {resultData.isAbnormal && (
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select
                    value={resultData.severity}
                    onValueChange={(value) => setResultData({ ...resultData, severity: value as LabTest['severity'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={resultData.notes}
                onChange={(e) => setResultData({ ...resultData, notes: e.target.value })}
                placeholder="Additional notes about the result..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowResultDialog(false)
              setSelectedTest(null)
              setResultData({ result: '', normalRange: '', unit: '', isAbnormal: false, severity: 'normal', notes: '' })
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddResult} className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
