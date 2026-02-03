import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  Pill,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Clock,
  Calendar,
  Droplets,
  Sun,
  Moon,
  Sunrise,
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
import { useToast } from '@/components/ui/toast'

interface Prescription {
  id: string
  patientId: number
  medicationName: string
  dosage: string
  frequency: string
  route: string
  duration: string
  startDate: string
  endDate?: string
  instructions?: string
  prescribedBy: string
  isActive: boolean
  createdAt: string
}

interface PrescriptionManagerProps {
  patientId: number
  patientName: string
}

const ROUTES = [
  'Oral',
  'Topical',
  'Injection (IM)',
  'Injection (IV)',
  'Injection (SC)',
  'Inhalation',
  'Sublingual',
  'Rectal',
  'Ophthalmic',
  'Otic',
  'Nasal',
  'Transdermal',
]

const FREQUENCIES = [
  { value: 'once_daily', label: 'Once daily', icon: Sun },
  { value: 'twice_daily', label: 'Twice daily (BID)', icon: Sunrise },
  { value: 'three_daily', label: 'Three times daily (TID)', icon: Clock },
  { value: 'four_daily', label: 'Four times daily (QID)', icon: Clock },
  { value: 'every_4h', label: 'Every 4 hours', icon: Clock },
  { value: 'every_6h', label: 'Every 6 hours', icon: Clock },
  { value: 'every_8h', label: 'Every 8 hours', icon: Clock },
  { value: 'every_12h', label: 'Every 12 hours', icon: Clock },
  { value: 'at_bedtime', label: 'At bedtime (HS)', icon: Moon },
  { value: 'before_meals', label: 'Before meals (AC)', icon: Droplets },
  { value: 'after_meals', label: 'After meals (PC)', icon: Droplets },
  { value: 'as_needed', label: 'As needed (PRN)', icon: AlertTriangle },
  { value: 'weekly', label: 'Weekly', icon: Calendar },
]

const DURATIONS = [
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '21 days',
  '30 days',
  '60 days',
  '90 days',
  'Ongoing',
]

const COMMON_MEDICATIONS = [
  // Pain & Fever
  'Paracetamol 500mg',
  'Ibuprofen 400mg',
  'Aspirin 100mg',
  'Diclofenac 50mg',
  // Antibiotics
  'Amoxicillin 500mg',
  'Azithromycin 250mg',
  'Ciprofloxacin 500mg',
  'Metronidazole 400mg',
  // GI
  'Omeprazole 20mg',
  'Pantoprazole 40mg',
  'Domperidone 10mg',
  'Ondansetron 4mg',
  // Cardiovascular
  'Amlodipine 5mg',
  'Metoprolol 50mg',
  'Atorvastatin 10mg',
  'Aspirin 75mg',
  // Diabetes
  'Metformin 500mg',
  'Glimepiride 2mg',
  // Respiratory
  'Salbutamol Inhaler',
  'Montelukast 10mg',
  'Cetirizine 10mg',
  // Other
  'Multivitamin',
  'Vitamin D3 1000IU',
  'Iron Supplement',
]

export function PrescriptionManager({ patientId, patientName }: PrescriptionManagerProps) {
  const toast = useToast()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  
  const [formData, setFormData] = useState({
    medicationName: '',
    customMedication: '',
    dosage: '',
    frequency: '',
    route: 'Oral',
    duration: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    instructions: '',
    prescribedBy: '',
  })

  const loadPrescriptions = useCallback(() => {
    const stored = localStorage.getItem(`prescriptions_${patientId}`)
    if (stored) {
      setPrescriptions(JSON.parse(stored))
    }
  }, [patientId])

  useEffect(() => {
    loadPrescriptions()
  }, [loadPrescriptions])

  const savePrescriptions = (newPrescriptions: Prescription[]) => {
    localStorage.setItem(`prescriptions_${patientId}`, JSON.stringify(newPrescriptions))
    setPrescriptions(newPrescriptions)
  }

  const resetForm = () => {
    setFormData({
      medicationName: '',
      customMedication: '',
      dosage: '',
      frequency: '',
      route: 'Oral',
      duration: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      instructions: '',
      prescribedBy: '',
    })
  }

  const handleSave = () => {
    const medication = formData.medicationName === 'custom' 
      ? formData.customMedication 
      : formData.medicationName

    if (!medication || !formData.frequency || !formData.duration || !formData.prescribedBy) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    if (editingPrescription) {
      // Update existing
      const updated = prescriptions.map(p => {
        if (p.id === editingPrescription.id) {
          return {
            ...p,
            medicationName: medication,
            dosage: formData.dosage,
            frequency: formData.frequency,
            route: formData.route,
            duration: formData.duration,
            startDate: formData.startDate,
            instructions: formData.instructions,
            prescribedBy: formData.prescribedBy,
          }
        }
        return p
      })
      savePrescriptions(updated)
      toast.success('Updated', 'Prescription updated successfully')
    } else {
      // Add new
      const newPrescription: Prescription = {
        id: crypto.randomUUID(),
        patientId,
        medicationName: medication,
        dosage: formData.dosage,
        frequency: formData.frequency,
        route: formData.route,
        duration: formData.duration,
        startDate: formData.startDate,
        instructions: formData.instructions,
        prescribedBy: formData.prescribedBy,
        isActive: true,
        createdAt: new Date().toISOString(),
      }
      savePrescriptions([newPrescription, ...prescriptions])
      toast.success('Success', 'Prescription added successfully')
    }

    setShowAddDialog(false)
    setEditingPrescription(null)
    resetForm()
  }

  const handleEdit = (prescription: Prescription) => {
    setEditingPrescription(prescription)
    const isCommon = COMMON_MEDICATIONS.includes(prescription.medicationName)
    setFormData({
      medicationName: isCommon ? prescription.medicationName : 'custom',
      customMedication: isCommon ? '' : prescription.medicationName,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      route: prescription.route,
      duration: prescription.duration,
      startDate: prescription.startDate.split('T')[0],
      instructions: prescription.instructions || '',
      prescribedBy: prescription.prescribedBy,
    })
    setShowAddDialog(true)
  }

  const handleToggleActive = (id: string) => {
    const updated = prescriptions.map(p => {
      if (p.id === id) {
        return { ...p, isActive: !p.isActive }
      }
      return p
    })
    savePrescriptions(updated)
  }

  const handleDelete = (id: string) => {
    const updated = prescriptions.filter(p => p.id !== id)
    savePrescriptions(updated)
    toast.success('Deleted', 'Prescription removed')
  }

  const getFrequencyLabel = (value: string) => {
    return FREQUENCIES.find(f => f.value === value)?.label || value
  }

  const getFrequencyIcon = (value: string) => {
    const freq = FREQUENCIES.find(f => f.value === value)
    if (freq) {
      const Icon = freq.icon
      return <Icon className="h-4 w-4" />
    }
    return <Clock className="h-4 w-4" />
  }

  const activePrescriptions = prescriptions.filter(p => p.isActive)
  const inactivePrescriptions = prescriptions.filter(p => !p.isActive)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Prescriptions
          </h3>
          <Badge variant="secondary">{activePrescriptions.length} active</Badge>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Prescription
        </Button>
      </div>

      {prescriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Pill className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No prescriptions</p>
            <Button variant="link" onClick={() => setShowAddDialog(true)}>
              Add a prescription
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Prescriptions */}
          <div className="space-y-3">
            <AnimatePresence>
              {activePrescriptions.map((prescription) => (
                <motion.div
                  key={prescription.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Pill className="h-5 w-5 text-emerald-600" />
                            <span className="font-semibold text-lg">{prescription.medicationName}</span>
                            {prescription.dosage && (
                              <Badge variant="outline">{prescription.dosage}</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {getFrequencyIcon(prescription.frequency)}
                              {getFrequencyLabel(prescription.frequency)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Droplets className="h-4 w-4" />
                              {prescription.route}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {prescription.duration}
                            </span>
                          </div>
                          {prescription.instructions && (
                            <p className="text-sm bg-amber-50 text-amber-800 p-2 rounded mt-2">
                              <AlertTriangle className="h-4 w-4 inline mr-1" />
                              {prescription.instructions}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Prescribed by {prescription.prescribedBy} on {format(new Date(prescription.startDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(prescription)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(prescription.id)}
                            title="Discontinue"
                          >
                            <Clock className="h-4 w-4 text-amber-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => handleDelete(prescription.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Inactive Prescriptions */}
          {inactivePrescriptions.length > 0 && (
            <div className="mt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInactive(!showInactive)}
                className="mb-3"
              >
                {showInactive ? 'Hide' : 'Show'} discontinued ({inactivePrescriptions.length})
              </Button>
              
              {showInactive && (
                <div className="space-y-2 opacity-60">
                  {inactivePrescriptions.map((prescription) => (
                    <Card key={prescription.id} className="bg-muted/50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4 text-muted-foreground" />
                            <span className="line-through">{prescription.medicationName}</span>
                            {prescription.dosage && (
                              <Badge variant="outline" className="opacity-50">{prescription.dosage}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleActive(prescription.id)}
                              title="Reactivate"
                            >
                              <Pill className="h-4 w-4 text-emerald-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500"
                              onClick={() => handleDelete(prescription.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open)
        if (!open) {
          setEditingPrescription(null)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingPrescription ? 'Edit Prescription' : 'Add Prescription'}
            </DialogTitle>
            <DialogDescription>
              {editingPrescription ? 'Update prescription details' : `Prescribe medication for ${patientName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Medication *</Label>
                <Select
                  value={formData.medicationName}
                  onValueChange={(value) => setFormData({ ...formData, medicationName: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select medication" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_MEDICATIONS.map((med) => (
                      <SelectItem key={med} value={med}>{med}</SelectItem>
                    ))}
                    <SelectItem value="custom">Other (Custom)</SelectItem>
                  </SelectContent>
                </Select>
                {formData.medicationName === 'custom' && (
                  <Input
                    className="mt-2"
                    value={formData.customMedication}
                    onChange={(e) => setFormData({ ...formData, customMedication: e.target.value })}
                    placeholder="Enter medication name & strength"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Dosage</Label>
                <Input
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="e.g., 1 tablet, 5ml, 2 puffs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frequency *</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Route</Label>
                <Select
                  value={formData.route}
                  onValueChange={(value) => setFormData({ ...formData, route: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUTES.map((route) => (
                      <SelectItem key={route} value={route}>{route}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration *</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData({ ...formData, duration: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((dur) => (
                      <SelectItem key={dur} value={dur}>{dur}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prescribed By *</Label>
              <Input
                value={formData.prescribedBy}
                onChange={(e) => setFormData({ ...formData, prescribedBy: e.target.value })}
                placeholder="Doctor name"
              />
            </div>

            <div className="space-y-2">
              <Label>Special Instructions</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="e.g., Take with food, Avoid alcohol, etc."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false)
              setEditingPrescription(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingPrescription ? 'Update' : 'Add Prescription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
