import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  ShieldAlert,
  Pill,
  Apple,
  Bug,
  Syringe,
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

interface Allergy {
  id: string
  patientId: number
  allergen: string
  type: 'DRUG' | 'FOOD' | 'ENVIRONMENTAL' | 'OTHER'
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING'
  reaction: string
  diagnosedDate?: string
  notes?: string
  createdAt: string
}

interface MedicalCondition {
  id: string
  patientId: number
  condition: string
  status: 'ACTIVE' | 'RESOLVED' | 'MANAGED'
  diagnosedDate?: string
  notes?: string
  createdAt: string
}

interface PatientMedicalHistoryProps {
  patientId: number
  patientName: string
}

const COMMON_ALLERGIES = {
  DRUG: ['Penicillin', 'Sulfa Drugs', 'Aspirin', 'NSAIDs', 'Codeine', 'Morphine', 'Latex', 'Contrast Dye'],
  FOOD: ['Peanuts', 'Tree Nuts', 'Shellfish', 'Fish', 'Milk', 'Eggs', 'Wheat', 'Soy'],
  ENVIRONMENTAL: ['Pollen', 'Dust Mites', 'Mold', 'Pet Dander', 'Insect Stings', 'Grass'],
  OTHER: ['Nickel', 'Perfume', 'Adhesive Tape'],
}

const COMMON_CONDITIONS = [
  'Hypertension',
  'Diabetes Type 2',
  'Diabetes Type 1',
  'Asthma',
  'COPD',
  'Coronary Artery Disease',
  'Heart Failure',
  'Atrial Fibrillation',
  'Hypothyroidism',
  'Hyperthyroidism',
  'Arthritis',
  'Osteoporosis',
  'Depression',
  'Anxiety',
  'Chronic Kidney Disease',
  'Hepatitis',
  'HIV/AIDS',
  'Cancer',
  'Epilepsy',
  'Migraine',
  'GERD',
  'IBD',
]

export function PatientMedicalHistory({ patientId, patientName }: PatientMedicalHistoryProps) {
  const toast = useToast()
  const [allergies, setAllergies] = useState<Allergy[]>([])
  const [conditions, setConditions] = useState<MedicalCondition[]>([])
  const [showAllergyDialog, setShowAllergyDialog] = useState(false)
  const [showConditionDialog, setShowConditionDialog] = useState(false)
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null)
  const [editingCondition, setEditingCondition] = useState<MedicalCondition | null>(null)

  const [allergyForm, setAllergyForm] = useState({
    allergen: '',
    customAllergen: '',
    type: 'DRUG' as Allergy['type'],
    severity: 'MODERATE' as Allergy['severity'],
    reaction: '',
    diagnosedDate: '',
    notes: '',
  })

  const [conditionForm, setConditionForm] = useState({
    condition: '',
    customCondition: '',
    status: 'ACTIVE' as MedicalCondition['status'],
    diagnosedDate: '',
    notes: '',
  })

  const loadData = useCallback(() => {
    const storedAllergies = localStorage.getItem(`patient_allergies_${patientId}`)
    const storedConditions = localStorage.getItem(`patient_conditions_${patientId}`)
    if (storedAllergies) setAllergies(JSON.parse(storedAllergies))
    if (storedConditions) setConditions(JSON.parse(storedConditions))
  }, [patientId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const saveAllergies = (newAllergies: Allergy[]) => {
    localStorage.setItem(`patient_allergies_${patientId}`, JSON.stringify(newAllergies))
    setAllergies(newAllergies)
  }

  const saveConditions = (newConditions: MedicalCondition[]) => {
    localStorage.setItem(`patient_conditions_${patientId}`, JSON.stringify(newConditions))
    setConditions(newConditions)
  }

  const resetAllergyForm = () => {
    setAllergyForm({
      allergen: '',
      customAllergen: '',
      type: 'DRUG',
      severity: 'MODERATE',
      reaction: '',
      diagnosedDate: '',
      notes: '',
    })
  }

  const resetConditionForm = () => {
    setConditionForm({
      condition: '',
      customCondition: '',
      status: 'ACTIVE',
      diagnosedDate: '',
      notes: '',
    })
  }

  const handleSaveAllergy = () => {
    const allergen = allergyForm.allergen === 'custom' ? allergyForm.customAllergen : allergyForm.allergen
    if (!allergen || !allergyForm.reaction) {
      toast.error('Error', 'Please fill in allergen and reaction')
      return
    }

    if (editingAllergy) {
      const updated = allergies.map(a => {
        if (a.id === editingAllergy.id) {
          return {
            ...a,
            allergen,
            type: allergyForm.type,
            severity: allergyForm.severity,
            reaction: allergyForm.reaction,
            diagnosedDate: allergyForm.diagnosedDate,
            notes: allergyForm.notes,
          }
        }
        return a
      })
      saveAllergies(updated)
      toast.success('Updated', 'Allergy updated')
    } else {
      const newAllergy: Allergy = {
        id: crypto.randomUUID(),
        patientId,
        allergen,
        type: allergyForm.type,
        severity: allergyForm.severity,
        reaction: allergyForm.reaction,
        diagnosedDate: allergyForm.diagnosedDate,
        notes: allergyForm.notes,
        createdAt: new Date().toISOString(),
      }
      saveAllergies([...allergies, newAllergy])
      toast.success('Added', 'Allergy recorded')
    }

    setShowAllergyDialog(false)
    setEditingAllergy(null)
    resetAllergyForm()
  }

  const handleSaveCondition = () => {
    const condition = conditionForm.condition === 'custom' ? conditionForm.customCondition : conditionForm.condition
    if (!condition) {
      toast.error('Error', 'Please enter a condition')
      return
    }

    if (editingCondition) {
      const updated = conditions.map(c => {
        if (c.id === editingCondition.id) {
          return {
            ...c,
            condition,
            status: conditionForm.status,
            diagnosedDate: conditionForm.diagnosedDate,
            notes: conditionForm.notes,
          }
        }
        return c
      })
      saveConditions(updated)
      toast.success('Updated', 'Condition updated')
    } else {
      const newCondition: MedicalCondition = {
        id: crypto.randomUUID(),
        patientId,
        condition,
        status: conditionForm.status,
        diagnosedDate: conditionForm.diagnosedDate,
        notes: conditionForm.notes,
        createdAt: new Date().toISOString(),
      }
      saveConditions([...conditions, newCondition])
      toast.success('Added', 'Condition recorded')
    }

    setShowConditionDialog(false)
    setEditingCondition(null)
    resetConditionForm()
  }

  const handleEditAllergy = (allergy: Allergy) => {
    const isCommon = Object.values(COMMON_ALLERGIES).flat().includes(allergy.allergen)
    setEditingAllergy(allergy)
    setAllergyForm({
      allergen: isCommon ? allergy.allergen : 'custom',
      customAllergen: isCommon ? '' : allergy.allergen,
      type: allergy.type,
      severity: allergy.severity,
      reaction: allergy.reaction,
      diagnosedDate: allergy.diagnosedDate || '',
      notes: allergy.notes || '',
    })
    setShowAllergyDialog(true)
  }

  const handleEditCondition = (condition: MedicalCondition) => {
    const isCommon = COMMON_CONDITIONS.includes(condition.condition)
    setEditingCondition(condition)
    setConditionForm({
      condition: isCommon ? condition.condition : 'custom',
      customCondition: isCommon ? '' : condition.condition,
      status: condition.status,
      diagnosedDate: condition.diagnosedDate || '',
      notes: condition.notes || '',
    })
    setShowConditionDialog(true)
  }

  const handleDeleteAllergy = (id: string) => {
    const updated = allergies.filter(a => a.id !== id)
    saveAllergies(updated)
    toast.success('Deleted', 'Allergy removed')
  }

  const handleDeleteCondition = (id: string) => {
    const updated = conditions.filter(c => c.id !== id)
    saveConditions(updated)
    toast.success('Deleted', 'Condition removed')
  }

  const getAllergyIcon = (type: Allergy['type']) => {
    switch (type) {
      case 'DRUG': return <Pill className="h-4 w-4" />
      case 'FOOD': return <Apple className="h-4 w-4" />
      case 'ENVIRONMENTAL': return <Bug className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getSeverityBadge = (severity: Allergy['severity']) => {
    switch (severity) {
      case 'MILD':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Mild</Badge>
      case 'MODERATE':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Moderate</Badge>
      case 'SEVERE':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Severe</Badge>
      case 'LIFE_THREATENING':
        return <Badge variant="destructive">Life-Threatening</Badge>
    }
  }

  const getStatusBadge = (status: MedicalCondition['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="destructive">Active</Badge>
      case 'MANAGED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Managed</Badge>
      case 'RESOLVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Resolved</Badge>
    }
  }

  const severeAllergies = allergies.filter(a => a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING')
  const activeConditions = conditions.filter(c => c.status === 'ACTIVE')

  return (
    <div className="space-y-6">
      {/* Warning Banner for Severe Allergies */}
      {severeAllergies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-red-700">
            <ShieldAlert className="h-5 w-5" />
            <span className="font-semibold">Allergy Alert:</span>
            <span>
              {severeAllergies.map(a => a.allergen).join(', ')}
            </span>
          </div>
        </motion.div>
      )}

      {/* Allergies Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Syringe className="h-5 w-5 text-red-500" />
            Allergies
            {allergies.length > 0 && (
              <Badge variant="secondary">{allergies.length}</Badge>
            )}
          </h3>
          <Button size="sm" variant="outline" onClick={() => setShowAllergyDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Allergy
          </Button>
        </div>

        {allergies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Syringe className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No known allergies</p>
              <Button variant="link" size="sm" onClick={() => setShowAllergyDialog(true)}>
                Record an allergy
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <AnimatePresence>
              {allergies.map((allergy) => (
                <motion.div
                  key={allergy.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className={allergy.severity === 'LIFE_THREATENING' ? 'border-red-300 bg-red-50/50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getAllergyIcon(allergy.type)}
                            <span className="font-semibold">{allergy.allergen}</span>
                            {getSeverityBadge(allergy.severity)}
                          </div>
                          <p className="text-sm text-muted-foreground">{allergy.reaction}</p>
                          {allergy.diagnosedDate && (
                            <p className="text-xs text-muted-foreground">
                              Diagnosed: {format(new Date(allergy.diagnosedDate), 'MMM yyyy')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditAllergy(allergy)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteAllergy(allergy.id)}>
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
        )}
      </div>

      {/* Medical Conditions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Medical Conditions
            {activeConditions.length > 0 && (
              <Badge variant="secondary">{activeConditions.length} active</Badge>
            )}
          </h3>
          <Button size="sm" variant="outline" onClick={() => setShowConditionDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
        </div>

        {conditions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No medical conditions recorded</p>
              <Button variant="link" size="sm" onClick={() => setShowConditionDialog(true)}>
                Add a condition
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <AnimatePresence>
              {conditions.map((condition) => (
                <motion.div
                  key={condition.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className={condition.status === 'ACTIVE' ? 'border-amber-200' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{condition.condition}</span>
                            {getStatusBadge(condition.status)}
                          </div>
                          {condition.diagnosedDate && (
                            <p className="text-xs text-muted-foreground">
                              Diagnosed: {format(new Date(condition.diagnosedDate), 'MMM yyyy')}
                            </p>
                          )}
                          {condition.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{condition.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditCondition(condition)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteCondition(condition.id)}>
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
        )}
      </div>

      {/* Add/Edit Allergy Dialog */}
      <Dialog open={showAllergyDialog} onOpenChange={(open) => {
        setShowAllergyDialog(open)
        if (!open) {
          setEditingAllergy(null)
          resetAllergyForm()
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAllergy ? 'Edit Allergy' : 'Add Allergy'}</DialogTitle>
            <DialogDescription>Record an allergy for {patientName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Allergy Type</Label>
              <Select
                value={allergyForm.type}
                onValueChange={(value: Allergy['type']) => setAllergyForm({ ...allergyForm, type: value, allergen: '' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRUG">Drug</SelectItem>
                  <SelectItem value="FOOD">Food</SelectItem>
                  <SelectItem value="ENVIRONMENTAL">Environmental</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Allergen *</Label>
              <Select
                value={allergyForm.allergen}
                onValueChange={(value) => setAllergyForm({ ...allergyForm, allergen: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select allergen" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_ALLERGIES[allergyForm.type].map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                  <SelectItem value="custom">Other (Custom)</SelectItem>
                </SelectContent>
              </Select>
              {allergyForm.allergen === 'custom' && (
                <Input
                  className="mt-2"
                  value={allergyForm.customAllergen}
                  onChange={(e) => setAllergyForm({ ...allergyForm, customAllergen: e.target.value })}
                  placeholder="Enter allergen name"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Severity *</Label>
              <Select
                value={allergyForm.severity}
                onValueChange={(value: Allergy['severity']) => setAllergyForm({ ...allergyForm, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MILD">Mild</SelectItem>
                  <SelectItem value="MODERATE">Moderate</SelectItem>
                  <SelectItem value="SEVERE">Severe</SelectItem>
                  <SelectItem value="LIFE_THREATENING">Life-Threatening</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reaction *</Label>
              <Input
                value={allergyForm.reaction}
                onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })}
                placeholder="e.g., Hives, Anaphylaxis, Swelling"
              />
            </div>

            <div className="space-y-2">
              <Label>Diagnosed Date</Label>
              <Input
                type="date"
                value={allergyForm.diagnosedDate}
                onChange={(e) => setAllergyForm({ ...allergyForm, diagnosedDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={allergyForm.notes}
                onChange={(e) => setAllergyForm({ ...allergyForm, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAllergyDialog(false)
              setEditingAllergy(null)
              resetAllergyForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveAllergy}>
              {editingAllergy ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Condition Dialog */}
      <Dialog open={showConditionDialog} onOpenChange={(open) => {
        setShowConditionDialog(open)
        if (!open) {
          setEditingCondition(null)
          resetConditionForm()
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCondition ? 'Edit Condition' : 'Add Medical Condition'}</DialogTitle>
            <DialogDescription>Record a medical condition for {patientName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Condition *</Label>
              <Select
                value={conditionForm.condition}
                onValueChange={(value) => setConditionForm({ ...conditionForm, condition: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_CONDITIONS.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                  <SelectItem value="custom">Other (Custom)</SelectItem>
                </SelectContent>
              </Select>
              {conditionForm.condition === 'custom' && (
                <Input
                  className="mt-2"
                  value={conditionForm.customCondition}
                  onChange={(e) => setConditionForm({ ...conditionForm, customCondition: e.target.value })}
                  placeholder="Enter condition name"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={conditionForm.status}
                onValueChange={(value: MedicalCondition['status']) => setConditionForm({ ...conditionForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="MANAGED">Managed</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Diagnosed Date</Label>
              <Input
                type="date"
                value={conditionForm.diagnosedDate}
                onChange={(e) => setConditionForm({ ...conditionForm, diagnosedDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={conditionForm.notes}
                onChange={(e) => setConditionForm({ ...conditionForm, notes: e.target.value })}
                placeholder="Treatment notes, medications, etc."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowConditionDialog(false)
              setEditingCondition(null)
              resetConditionForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveCondition}>
              {editingCondition ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
