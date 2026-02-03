import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  Activity,
  Heart,
  Thermometer,
  Droplets,
  Scale,
  Ruler,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface VitalRecord {
  id: string
  patientId: number
  recordedAt: string
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  heartRate?: number
  temperature?: number
  oxygenSaturation?: number
  weight?: number
  height?: number
  notes?: string
}

interface PatientVitalsProps {
  patientId: number
  patientName: string
}

const vitalRanges = {
  bloodPressureSystolic: { low: 90, normal: [90, 120], high: 140, unit: 'mmHg' },
  bloodPressureDiastolic: { low: 60, normal: [60, 80], high: 90, unit: 'mmHg' },
  heartRate: { low: 60, normal: [60, 100], high: 100, unit: 'bpm' },
  temperature: { low: 36, normal: [36.1, 37.2], high: 37.5, unit: '°C' },
  oxygenSaturation: { low: 95, normal: [95, 100], high: 100, unit: '%' },
}

export function PatientVitals({ patientId, patientName }: PatientVitalsProps) {
  const [records, setRecords] = useState<VitalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  // Form state
  const [formData, setFormData] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
    notes: '',
  })

  useEffect(() => {
    loadVitals()
  }, [patientId])

  const loadVitals = () => {
    setLoading(true)
    try {
      const stored = localStorage.getItem(`patient_vitals_${patientId}`)
      if (stored) {
        setRecords(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load vitals:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveVitals = (updatedRecords: VitalRecord[]) => {
    localStorage.setItem(`patient_vitals_${patientId}`, JSON.stringify(updatedRecords))
    setRecords(updatedRecords)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    // Validate at least one vital is entered
    const hasData = Object.entries(formData).some(([key, value]) => 
      key !== 'notes' && value !== ''
    )
    
    if (!hasData) {
      toast.error('Error', 'Please enter at least one vital sign')
      return
    }

    setSaving(true)
    const newRecord: VitalRecord = {
      id: Math.random().toString(36).substring(7),
      patientId,
      recordedAt: new Date().toISOString(),
      bloodPressureSystolic: formData.bloodPressureSystolic ? parseFloat(formData.bloodPressureSystolic) : undefined,
      bloodPressureDiastolic: formData.bloodPressureDiastolic ? parseFloat(formData.bloodPressureDiastolic) : undefined,
      heartRate: formData.heartRate ? parseFloat(formData.heartRate) : undefined,
      temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
      oxygenSaturation: formData.oxygenSaturation ? parseFloat(formData.oxygenSaturation) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      height: formData.height ? parseFloat(formData.height) : undefined,
      notes: formData.notes || undefined,
    }

    saveVitals([newRecord, ...records])
    setIsDialogOpen(false)
    setFormData({
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      heartRate: '',
      temperature: '',
      oxygenSaturation: '',
      weight: '',
      height: '',
      notes: '',
    })
    setSaving(false)
    toast.success('Vitals Recorded', 'Patient vitals have been saved.')
  }

  const getVitalStatus = (vital: keyof typeof vitalRanges, value: number | undefined) => {
    if (value === undefined) return null
    const range = vitalRanges[vital]
    if (value < range.normal[0]) return 'low'
    if (value > range.normal[1]) return 'high'
    return 'normal'
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'low':
        return 'text-blue-600 bg-blue-100'
      case 'high':
        return 'text-red-600 bg-red-100'
      case 'normal':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getTrend = (vital: string, currentValue: number | undefined) => {
    if (!currentValue || records.length < 2) return null
    const previousRecord = records[1]
    const previousValue = previousRecord[vital as keyof VitalRecord] as number | undefined
    if (!previousValue) return null
    
    const diff = currentValue - previousValue
    if (Math.abs(diff) < 0.5) return 'stable'
    return diff > 0 ? 'up' : 'down'
  }

  const latestVitals = records[0]
  const calculateBMI = () => {
    if (latestVitals?.weight && latestVitals?.height) {
      const heightInMeters = latestVitals.height / 100
      return (latestVitals.weight / (heightInMeters * heightInMeters)).toFixed(1)
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Vital Signs
            </CardTitle>
            <CardDescription>
              Monitor and record vital signs for {patientName}
            </CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Record Vitals
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : !latestVitals ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No vital records yet</p>
            <p className="text-sm">Click "Record Vitals" to add the first record</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Vitals Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Blood Pressure */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-full bg-red-100">
                    <Heart className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="text-sm font-medium">Blood Pressure</span>
                </div>
                {latestVitals.bloodPressureSystolic && latestVitals.bloodPressureDiastolic ? (
                  <div>
                    <span className="text-2xl font-bold">
                      {latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">mmHg</span>
                    <Badge className={cn('ml-2', getStatusColor(getVitalStatus('bloodPressureSystolic', latestVitals.bloodPressureSystolic)))}>
                      {getVitalStatus('bloodPressureSystolic', latestVitals.bloodPressureSystolic)}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Not recorded</span>
                )}
              </motion.div>

              {/* Heart Rate */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-full bg-pink-100">
                    <Activity className="h-4 w-4 text-pink-600" />
                  </div>
                  <span className="text-sm font-medium">Heart Rate</span>
                </div>
                {latestVitals.heartRate ? (
                  <div className="flex items-center">
                    <span className="text-2xl font-bold">{latestVitals.heartRate}</span>
                    <span className="text-sm text-muted-foreground ml-1">bpm</span>
                    {getTrend('heartRate', latestVitals.heartRate) === 'up' && (
                      <TrendingUp className="h-4 w-4 text-red-500 ml-2" />
                    )}
                    {getTrend('heartRate', latestVitals.heartRate) === 'down' && (
                      <TrendingDown className="h-4 w-4 text-green-500 ml-2" />
                    )}
                    {getTrend('heartRate', latestVitals.heartRate) === 'stable' && (
                      <Minus className="h-4 w-4 text-gray-500 ml-2" />
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Not recorded</span>
                )}
              </motion.div>

              {/* Temperature */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-full bg-orange-100">
                    <Thermometer className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium">Temperature</span>
                </div>
                {latestVitals.temperature ? (
                  <div>
                    <span className="text-2xl font-bold">{latestVitals.temperature}</span>
                    <span className="text-sm text-muted-foreground ml-1">°C</span>
                    <Badge className={cn('ml-2', getStatusColor(getVitalStatus('temperature', latestVitals.temperature)))}>
                      {getVitalStatus('temperature', latestVitals.temperature)}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Not recorded</span>
                )}
              </motion.div>

              {/* Oxygen Saturation */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-full bg-blue-100">
                    <Droplets className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">SpO2</span>
                </div>
                {latestVitals.oxygenSaturation ? (
                  <div>
                    <span className="text-2xl font-bold">{latestVitals.oxygenSaturation}</span>
                    <span className="text-sm text-muted-foreground ml-1">%</span>
                    <Badge className={cn('ml-2', getStatusColor(getVitalStatus('oxygenSaturation', latestVitals.oxygenSaturation)))}>
                      {getVitalStatus('oxygenSaturation', latestVitals.oxygenSaturation)}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Not recorded</span>
                )}
              </motion.div>

              {/* Weight */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-full bg-purple-100">
                    <Scale className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium">Weight</span>
                </div>
                {latestVitals.weight ? (
                  <div className="flex items-center">
                    <span className="text-2xl font-bold">{latestVitals.weight}</span>
                    <span className="text-sm text-muted-foreground ml-1">kg</span>
                    {getTrend('weight', latestVitals.weight) === 'up' && (
                      <TrendingUp className="h-4 w-4 text-orange-500 ml-2" />
                    )}
                    {getTrend('weight', latestVitals.weight) === 'down' && (
                      <TrendingDown className="h-4 w-4 text-green-500 ml-2" />
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Not recorded</span>
                )}
              </motion.div>

              {/* BMI */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-full bg-green-100">
                    <Ruler className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium">BMI</span>
                </div>
                {calculateBMI() ? (
                  <div>
                    <span className="text-2xl font-bold">{calculateBMI()}</span>
                    <span className="text-sm text-muted-foreground ml-1">kg/m²</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Need weight & height</span>
                )}
              </motion.div>
            </div>

            {/* Last recorded time */}
            <p className="text-xs text-muted-foreground text-right">
              Last recorded: {format(new Date(latestVitals.recordedAt), 'MMM d, yyyy h:mm a')}
            </p>

            {/* History */}
            {records.length > 1 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Recent History</h4>
                <div className="space-y-2">
                  {records.slice(1, 4).map((record) => (
                    <div key={record.id} className="text-sm flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-muted-foreground">
                        {format(new Date(record.recordedAt), 'MMM d, yyyy')}
                      </span>
                      <div className="flex gap-3 text-xs">
                        {record.bloodPressureSystolic && (
                          <span>BP: {record.bloodPressureSystolic}/{record.bloodPressureDiastolic}</span>
                        )}
                        {record.heartRate && <span>HR: {record.heartRate}</span>}
                        {record.temperature && <span>T: {record.temperature}°C</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Record Vitals Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Vital Signs</DialogTitle>
            <DialogDescription>
              Enter the current vital signs for {patientName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Systolic (mmHg)</Label>
                <Input
                  type="number"
                  placeholder="120"
                  value={formData.bloodPressureSystolic}
                  onChange={(e) => handleInputChange('bloodPressureSystolic', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Diastolic (mmHg)</Label>
                <Input
                  type="number"
                  placeholder="80"
                  value={formData.bloodPressureDiastolic}
                  onChange={(e) => handleInputChange('bloodPressureDiastolic', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Heart Rate (bpm)</Label>
                <Input
                  type="number"
                  placeholder="72"
                  value={formData.heartRate}
                  onChange={(e) => handleInputChange('heartRate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Temperature (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="36.5"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SpO2 (%)</Label>
                <Input
                  type="number"
                  placeholder="98"
                  value={formData.oxygenSaturation}
                  onChange={(e) => handleInputChange('oxygenSaturation', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="70"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input
                type="number"
                placeholder="170"
                value={formData.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Any additional observations..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Vitals'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
