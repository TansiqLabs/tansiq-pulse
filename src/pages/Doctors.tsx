import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Stethoscope,
  Phone,
  Mail,
  Edit,
  Trash2,
  DollarSign,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, getInitials } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import type { Doctor } from '@/types'

const SPECIALIZATIONS = [
  'General Medicine',
  'Pediatrics',
  'Cardiology',
  'Orthopedics',
  'Dermatology',
  'ENT',
  'Ophthalmology',
  'Gynecology',
  'Neurology',
  'Psychiatry',
  'Dental',
  'General Surgery',
]

const doctorSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  specialization: z.string().min(1, 'Specialization is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  consultationFee: z.number().min(0, 'Fee must be positive'),
  consultationMinutes: z.number().min(5).max(120),
  isActive: z.boolean(),
})

type DoctorForm = z.infer<typeof doctorSchema>

export function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DoctorForm>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      consultationFee: 0,
      consultationMinutes: 15,
      isActive: true,
    },
  })

  useEffect(() => {
    loadDoctors()
  }, [])

  const loadDoctors = async () => {
    try {
      const data = await window.electronAPI.doctors.getAll()
      setDoctors(data)
    } catch (error) {
      console.error('Failed to load doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingDoctor(null)
    reset({
      firstName: '',
      lastName: '',
      specialization: '',
      phone: '',
      email: '',
      consultationFee: 75,
      consultationMinutes: 15,
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (doctor: Doctor) => {
    setEditingDoctor(doctor)
    reset({
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      specialization: doctor.specialization,
      phone: doctor.phone,
      email: doctor.email || '',
      consultationFee: doctor.consultationFee,
      consultationMinutes: doctor.consultationMinutes,
      isActive: doctor.isActive,
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: DoctorForm) => {
    setSaving(true)
    try {
      const doctorData = {
        ...data,
        email: data.email || null,
      }

      if (editingDoctor) {
        await window.electronAPI.doctors.update(editingDoctor.id, doctorData)
        toast.success('Doctor Updated', `Dr. ${data.firstName} ${data.lastName}'s profile has been updated.`)
      } else {
        await window.electronAPI.doctors.create(doctorData)
        toast.success('Doctor Added', `Dr. ${data.firstName} ${data.lastName} has been added to the system.`)
      }

      setIsDialogOpen(false)
      loadDoctors()
    } catch (error) {
      console.error('Failed to save doctor:', error)
      toast.error('Error', 'Failed to save doctor. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (doctor: Doctor) => {
    setDoctorToDelete(doctor)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!doctorToDelete) return
    try {
      await window.electronAPI.doctors.delete(doctorToDelete.id)
      toast.success('Doctor Removed', `Dr. ${doctorToDelete.firstName} ${doctorToDelete.lastName} has been removed.`)
      loadDoctors()
    } catch (error) {
      console.error('Failed to delete doctor:', error)
      toast.error('Error', 'Failed to delete doctor. Please try again.')
    } finally {
      setDeleteDialogOpen(false)
      setDoctorToDelete(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold tracking-tight"
          >
            Doctors
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground"
          >
            Manage your medical staff
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Doctor
          </Button>
        </motion.div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No doctors</h3>
            <p className="text-muted-foreground">Get started by adding a doctor</p>
            <Button onClick={openCreateDialog} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Doctor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence>
            {doctors.map((doctor, index) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
                  {/* Actions */}
                  <div className="absolute right-4 top-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(doctor)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(doctor)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-primary/10 text-primary text-xl">
                          {getInitials(doctor.firstName, doctor.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </CardTitle>
                        <CardDescription>{doctor.specialization}</CardDescription>
                        <div className="mt-1">
                          <Badge variant={doctor.isActive ? 'success' : 'secondary'}>
                            {doctor.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{doctor.phone}</span>
                    </div>
                    {doctor.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{doctor.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{formatCurrency(doctor.consultationFee)} per visit</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{doctor.consultationMinutes} min consultation</span>
                    </div>
                    <div className="pt-2">
                      <code className="rounded bg-muted px-2 py-1 text-xs">
                        {doctor.employeeId}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
            </DialogTitle>
            <DialogDescription>
              {editingDoctor
                ? 'Update doctor information'
                : 'Add a new doctor to your medical staff'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" {...register('firstName')} />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" {...register('lastName')} />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Specialization *</Label>
              <Select
                defaultValue={editingDoctor?.specialization || ''}
                onValueChange={(value) => setValue('specialization', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALIZATIONS.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.specialization && (
                <p className="text-sm text-destructive">{errors.specialization.message}</p>
              )}
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" {...register('phone')} />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="consultationFee">Consultation Fee ($)</Label>
                <Input
                  id="consultationFee"
                  type="number"
                  min={0}
                  step={0.01}
                  {...register('consultationFee', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>Consultation Duration</Label>
                <Select
                  defaultValue={editingDoctor?.consultationMinutes?.toString() || '15'}
                  onValueChange={(value) => setValue('consultationMinutes', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Add Doctor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Doctor</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove Dr. {doctorToDelete?.firstName} {doctorToDelete?.lastName}? 
              This will not delete their past appointment records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Remove Doctor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
