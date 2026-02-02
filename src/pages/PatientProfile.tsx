import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  AlertCircle,
  FileText,
  Clock,
  DollarSign,
  Edit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import type { Patient, Appointment, Invoice } from '@/types'

interface PatientDetails extends Patient {
  appointments: Appointment[]
  invoices: Invoice[]
}

export function PatientProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<PatientDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadPatient(parseInt(id))
    }
  }, [id])

  const loadPatient = async (patientId: number) => {
    try {
      const [patientData, appointments, invoices] = await Promise.all([
        window.electronAPI.patients.getById(patientId),
        window.electronAPI.appointments.getAll(),
        window.electronAPI.invoices.getAll(),
      ])

      const patientAppointments = appointments.filter(
        (apt: Appointment) => apt.patientId === patientId
      )
      const patientInvoices = invoices.filter(
        (inv: Invoice) => inv.patientId === patientId
      )

      setPatient({
        ...patientData,
        appointments: patientAppointments,
        invoices: patientInvoices,
      })
    } catch (error) {
      console.error('Failed to load patient:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAge = (dob: string) => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const stats = patient ? {
    totalAppointments: patient.appointments.length,
    completedAppointments: patient.appointments.filter(a => a.status === 'COMPLETED').length,
    totalSpent: patient.invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
    pendingBalance: patient.invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0),
  } : null

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 col-span-1" />
          <Skeleton className="h-64 col-span-2" />
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Patient Not Found</h2>
        <p className="text-muted-foreground mb-4">The patient you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/patients')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </Button>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/patients')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-muted-foreground font-mono">{patient.mrn}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/patients?edit=${patient.id}`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Patient
        </Button>
      </motion.div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patient Info Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="text-center pb-2">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {patient.firstName[0]}{patient.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <CardTitle>{patient.firstName} {patient.lastName}</CardTitle>
              <CardDescription>
                {getAge(patient.dateOfBirth)} years old • {patient.gender}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.phone}</span>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}
                {patient.address && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{patient.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>DOB: {format(new Date(patient.dateOfBirth), 'MMM d, yyyy')}</span>
                </div>
                {patient.bloodType && (
                  <div className="flex items-center gap-3 text-sm">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span>Blood Type: <strong>{patient.bloodType}</strong></span>
                  </div>
                )}
              </div>

              {(patient.emergencyContact || patient.emergencyPhone) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      EMERGENCY CONTACT
                    </p>
                    {patient.emergencyContact && (
                      <p className="text-sm font-medium">{patient.emergencyContact}</p>
                    )}
                    {patient.emergencyPhone && (
                      <p className="text-sm text-muted-foreground">{patient.emergencyPhone}</p>
                    )}
                  </div>
                </>
              )}

              {patient.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">NOTES</p>
                    <p className="text-sm">{patient.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats & History */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalAppointments}</p>
                    <p className="text-xs text-muted-foreground">Appointments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <Clock className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.completedAppointments}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-100">
                    <DollarSign className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(stats?.totalSpent || 0)}</p>
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <FileText className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">
                      {formatCurrency(stats?.pendingBalance || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Balance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Card>
            <Tabs defaultValue="appointments">
              <CardHeader className="pb-0">
                <TabsList>
                  <TabsTrigger value="appointments">Appointments</TabsTrigger>
                  <TabsTrigger value="invoices">Invoices</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4">
                <TabsContent value="appointments" className="m-0">
                  {patient.appointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No appointments yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patient.appointments
                          .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
                          .map((apt) => (
                            <TableRow key={apt.id}>
                              <TableCell>{formatDate(apt.scheduledDate)}</TableCell>
                              <TableCell>{apt.scheduledTime}</TableCell>
                              <TableCell>
                                {apt.doctor ? `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}` : '-'}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {apt.reason || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(apt.status)}>
                                  {apt.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="invoices" className="m-0">
                  {patient.invoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No invoices yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patient.invoices
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((inv) => (
                            <TableRow key={inv.id}>
                              <TableCell className="font-mono text-xs">
                                {inv.invoiceNumber}
                              </TableCell>
                              <TableCell>{formatDate(inv.createdAt)}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(inv.totalAmount)}
                              </TableCell>
                              <TableCell className="text-right text-emerald-600">
                                {formatCurrency(inv.paidAmount)}
                              </TableCell>
                              <TableCell className="text-right text-amber-600">
                                {formatCurrency(inv.balanceAmount)}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(inv.status)}>
                                  {inv.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
