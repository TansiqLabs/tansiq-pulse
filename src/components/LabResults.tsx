import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  FlaskConical,
  Plus,
  FileText,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
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
  isAbnormal?: boolean
  resultDate?: string
  notes?: string
}

interface LabResultsProps {
  patientId: number
  patientName: string
}

const TEST_CATEGORIES = [
  'Blood Test',
  'Urine Test',
  'X-Ray',
  'MRI',
  'CT Scan',
  'Ultrasound',
  'ECG',
  'Blood Chemistry',
  'Hormone Panel',
  'Other',
]

const COMMON_TESTS: Record<string, string[]> = {
  'Blood Test': ['Complete Blood Count (CBC)', 'Blood Glucose', 'Hemoglobin A1C', 'Lipid Panel', 'Liver Function Test', 'Kidney Function Test'],
  'Urine Test': ['Urinalysis', 'Urine Culture', 'Protein/Creatinine Ratio'],
  'Blood Chemistry': ['Electrolytes', 'BUN/Creatinine', 'Thyroid Panel (TSH, T3, T4)'],
  'Hormone Panel': ['Testosterone', 'Estrogen', 'Cortisol', 'Insulin'],
  'X-Ray': ['Chest X-Ray', 'Abdominal X-Ray', 'Spine X-Ray', 'Extremity X-Ray'],
  'MRI': ['Brain MRI', 'Spine MRI', 'Abdominal MRI', 'Joint MRI'],
  'CT Scan': ['Head CT', 'Chest CT', 'Abdominal CT', 'Full Body CT'],
  'Ultrasound': ['Abdominal Ultrasound', 'Pelvic Ultrasound', 'Cardiac Echo', 'Thyroid Ultrasound'],
  'ECG': ['12-Lead ECG', 'Holter Monitor', 'Stress Test'],
  'Other': ['Biopsy', 'Endoscopy', 'Colonoscopy'],
}

export function LabResults({ patientId, patientName }: LabResultsProps) {
  const toast = useToast()
  const [tests, setTests] = useState<LabTest[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  
  const [formData, setFormData] = useState({
    testName: '',
    testCategory: '',
    orderedBy: '',
    notes: '',
  })

  const [resultData, setResultData] = useState({
    result: '',
    normalRange: '',
    isAbnormal: false,
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

  const handleAddTest = () => {
    if (!formData.testName || !formData.testCategory || !formData.orderedBy) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    const newTest: LabTest = {
      id: crypto.randomUUID(),
      patientId,
      testName: formData.testName,
      testCategory: formData.testCategory,
      orderedBy: formData.orderedBy,
      orderedDate: new Date().toISOString(),
      status: 'PENDING',
      notes: formData.notes,
    }

    saveTests([newTest, ...tests])
    setShowAddDialog(false)
    setFormData({ testName: '', testCategory: '', orderedBy: '', notes: '' })
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
          normalRange: resultData.normalRange,
          isAbnormal: resultData.isAbnormal,
          resultDate: new Date().toISOString(),
          notes: resultData.notes || test.notes,
        }
      }
      return test
    })

    saveTests(updatedTests)
    setShowResultDialog(false)
    setSelectedTest(null)
    setResultData({ result: '', normalRange: '', isAbnormal: false, notes: '' })
    toast.success('Success', 'Test result added successfully')
  }

  const handleDeleteTest = (testId: string) => {
    const updatedTests = tests.filter(t => t.id !== testId)
    saveTests(updatedTests)
    toast.success('Deleted', 'Lab test removed')
  }

  const handleMarkInProgress = (testId: string) => {
    const updatedTests = tests.map(test => {
      if (test.id === testId) {
        return { ...test, status: 'IN_PROGRESS' as const }
      }
      return test
    })
    saveTests(updatedTests)
  }

  const getStatusBadge = (status: LabTest['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><FlaskConical className="w-3 h-3 mr-1" />In Progress</Badge>
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
    }
  }

  const pendingCount = tests.filter(t => t.status !== 'COMPLETED').length
  const abnormalCount = tests.filter(t => t.isAbnormal).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Lab Results
          </h3>
          {pendingCount > 0 && (
            <Badge variant="secondary">{pendingCount} pending</Badge>
          )}
          {abnormalCount > 0 && (
            <Badge variant="destructive">{abnormalCount} abnormal</Badge>
          )}
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Order Test
        </Button>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FlaskConical className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No lab tests ordered yet</p>
            <Button variant="link" onClick={() => setShowAddDialog(true)}>
              Order a lab test
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Ordered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {tests.map((test) => (
                  <motion.tr
                    key={test.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="group"
                  >
                    <TableCell className="font-medium">
                      {test.testName}
                      {test.isAbnormal && (
                        <AlertTriangle className="inline-block ml-2 h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{test.testCategory}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(test.orderedDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{getStatusBadge(test.status)}</TableCell>
                    <TableCell>
                      {test.status === 'COMPLETED' ? (
                        <div className="text-sm">
                          <span className={test.isAbnormal ? 'text-red-600 font-medium' : ''}>
                            {test.result}
                          </span>
                          {test.normalRange && (
                            <span className="text-muted-foreground text-xs block">
                              Normal: {test.normalRange}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {test.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkInProgress(test.id)}
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
                              setShowResultDialog(true)
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        {test.status === 'COMPLETED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedTest(test)
                              setShowResultDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteTest(test.id)}
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

      {/* Order Test Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Order Lab Test</DialogTitle>
            <DialogDescription>
              Order a new lab test for {patientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Test Category *</Label>
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
                  {TEST_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Test Name *</Label>
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
                      <SelectItem key={test} value={test}>{test}</SelectItem>
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
              <Label>Ordered By *</Label>
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
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTest}>Order Test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/View Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedTest?.status === 'COMPLETED' ? 'View Result' : 'Add Result'}
            </DialogTitle>
            <DialogDescription>
              {selectedTest?.testName} - {selectedTest?.testCategory}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Result *</Label>
              <Textarea
                value={selectedTest?.status === 'COMPLETED' ? selectedTest.result : resultData.result}
                onChange={(e) => setResultData({ ...resultData, result: e.target.value })}
                placeholder="Enter test result"
                rows={3}
                disabled={selectedTest?.status === 'COMPLETED'}
              />
            </div>

            <div className="space-y-2">
              <Label>Normal Range</Label>
              <Input
                value={selectedTest?.status === 'COMPLETED' ? selectedTest.normalRange : resultData.normalRange}
                onChange={(e) => setResultData({ ...resultData, normalRange: e.target.value })}
                placeholder="e.g., 70-100 mg/dL"
                disabled={selectedTest?.status === 'COMPLETED'}
              />
            </div>

            {selectedTest?.status !== 'COMPLETED' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="abnormal"
                  checked={resultData.isAbnormal}
                  onChange={(e) => setResultData({ ...resultData, isAbnormal: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="abnormal" className="text-sm font-normal">
                  Mark as abnormal result
                </Label>
              </div>
            )}

            {selectedTest?.status === 'COMPLETED' && selectedTest.isAbnormal && (
              <Badge variant="destructive">Abnormal Result</Badge>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={selectedTest?.status === 'COMPLETED' ? selectedTest.notes : resultData.notes}
                onChange={(e) => setResultData({ ...resultData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
                disabled={selectedTest?.status === 'COMPLETED'}
              />
            </div>

            {selectedTest?.resultDate && (
              <p className="text-sm text-muted-foreground">
                Result added: {format(new Date(selectedTest.resultDate), 'MMM d, yyyy h:mm a')}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowResultDialog(false)
              setSelectedTest(null)
              setResultData({ result: '', normalRange: '', isAbnormal: false, notes: '' })
            }}>
              {selectedTest?.status === 'COMPLETED' ? 'Close' : 'Cancel'}
            </Button>
            {selectedTest?.status !== 'COMPLETED' && (
              <Button onClick={handleAddResult}>Save Result</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
