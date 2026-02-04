import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow, format } from 'date-fns'
import {
  AlertCircle,
  Search,
  Clock,
  CheckCircle,
  User,
  Activity,
  Ambulance,
  HeartPulse,
  Users,
  Timer,
  BedDouble,
  Siren,
  Thermometer,
  Wind,
  Droplets,
  ChevronRight,
  Plus,
  AlertTriangle,
  Stethoscope,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { getInitials, cn } from '@/lib/utils'

interface ERPatient {
  id: string
  patientName: string
  age: number
  gender: 'Male' | 'Female' | 'Other'
  chiefComplaint: string
  triageLevel: 1 | 2 | 3 | 4 | 5
  arrivalMode: 'Walk-in' | 'Ambulance' | 'Transfer' | 'Police'
  vitalSigns: {
    bp?: string
    pulse?: number
    temp?: number
    respRate?: number
    oxygenSat?: number
  }
  status: 'WAITING' | 'TRIAGE' | 'TREATMENT' | 'OBSERVATION' | 'ADMITTED' | 'DISCHARGED'
  assignedDoctor?: string
  assignedBed?: string
  notes?: string
  arrivalTime: string
  updatedAt: string
  phone?: string
  emergencyContact?: string
  allergies?: string
}

const TRIAGE_LEVELS = [
  { level: 1, name: 'Resuscitation', color: 'bg-red-600', textColor: 'text-white', ringColor: 'ring-red-500', description: 'Immediate life-threatening', icon: '🔴' },
  { level: 2, name: 'Emergency', color: 'bg-orange-500', textColor: 'text-white', ringColor: 'ring-orange-500', description: 'Potentially life-threatening', icon: '🟠' },
  { level: 3, name: 'Urgent', color: 'bg-yellow-500', textColor: 'text-black', ringColor: 'ring-yellow-500', description: 'Serious but stable', icon: '🟡' },
  { level: 4, name: 'Less Urgent', color: 'bg-green-500', textColor: 'text-white', ringColor: 'ring-green-500', description: 'Non-urgent', icon: '🟢' },
  { level: 5, name: 'Non-Urgent', color: 'bg-blue-500', textColor: 'text-white', ringColor: 'ring-blue-500', description: 'Minor conditions', icon: '🔵' },
]

const ER_DOCTORS = [
  { name: 'Dr. John Smith', specialty: 'Emergency Medicine' },
  { name: 'Dr. Sarah Miller', specialty: 'Trauma Surgery' },
  { name: 'Dr. Michael Chen', specialty: 'Critical Care' },
  { name: 'Dr. Emily Rodriguez', specialty: 'Emergency Medicine' },
  { name: 'Dr. James Wilson', specialty: 'Cardiology' },
]

const ER_BEDS = [
  { id: 'ER-01', zone: 'General' },
  { id: 'ER-02', zone: 'General' },
  { id: 'ER-03', zone: 'General' },
  { id: 'ER-04', zone: 'General' },
  { id: 'ER-05', zone: 'General' },
  { id: 'ER-06', zone: 'General' },
  { id: 'Trauma-1', zone: 'Trauma' },
  { id: 'Trauma-2', zone: 'Trauma' },
  { id: 'Resus-1', zone: 'Resuscitation' },
  { id: 'Resus-2', zone: 'Resuscitation' },
  { id: 'Obs-1', zone: 'Observation' },
  { id: 'Obs-2', zone: 'Observation' },
]

const STATUS_CONFIG = {
  WAITING: { label: 'Waiting', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Clock },
  TRIAGE: { label: 'Triage', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Activity },
  TREATMENT: { label: 'Treatment', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: Stethoscope },
  OBSERVATION: { label: 'Observation', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: Timer },
  ADMITTED: { label: 'Admitted', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: BedDouble },
  DISCHARGED: { label: 'Discharged', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle },
}

const STORAGE_KEY = 'er_patients'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function EmergencyDashboard() {
  const toast = useToast()
  const [patients, setPatients] = useState<ERPatient[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTriage, setFilterTriage] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<ERPatient | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [form, setForm] = useState({
    patientName: '',
    age: '',
    gender: 'Male' as ERPatient['gender'],
    chiefComplaint: '',
    triageLevel: 3 as ERPatient['triageLevel'],
    arrivalMode: 'Walk-in' as ERPatient['arrivalMode'],
    bp: '',
    pulse: '',
    temp: '',
    respRate: '',
    oxygenSat: '',
    notes: '',
    phone: '',
    emergencyContact: '',
    allergies: '',
  })

  const loadPatients = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setPatients(JSON.parse(stored))
    }
  }, [])

  const savePatients = (data: ERPatient[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setPatients(data)
  }

  useEffect(() => {
    loadPatients()
    const interval = setInterval(loadPatients, 30000)
    return () => clearInterval(interval)
  }, [loadPatients])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadPatients()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const resetForm = () => {
    setForm({
      patientName: '',
      age: '',
      gender: 'Male',
      chiefComplaint: '',
      triageLevel: 3,
      arrivalMode: 'Walk-in',
      bp: '',
      pulse: '',
      temp: '',
      respRate: '',
      oxygenSat: '',
      notes: '',
      phone: '',
      emergencyContact: '',
      allergies: '',
    })
  }

  const handleSubmit = () => {
    if (!form.patientName || !form.chiefComplaint) {
      toast.error('Error', 'Please fill in required fields')
      return
    }

    const newPatient: ERPatient = {
      id: `ER-${Date.now()}`,
      patientName: form.patientName,
      age: parseInt(form.age) || 0,
      gender: form.gender,
      chiefComplaint: form.chiefComplaint,
      triageLevel: form.triageLevel,
      arrivalMode: form.arrivalMode,
      vitalSigns: {
        bp: form.bp || undefined,
        pulse: form.pulse ? parseInt(form.pulse) : undefined,
        temp: form.temp ? parseFloat(form.temp) : undefined,
        respRate: form.respRate ? parseInt(form.respRate) : undefined,
        oxygenSat: form.oxygenSat ? parseInt(form.oxygenSat) : undefined,
      },
      status: 'WAITING',
      notes: form.notes,
      phone: form.phone,
      emergencyContact: form.emergencyContact,
      allergies: form.allergies,
      arrivalTime: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updated = [newPatient, ...patients].sort((a, b) => a.triageLevel - b.triageLevel)
    savePatients(updated)
    toast.success('Registered', 'Patient added to ER queue')
    setShowAddDialog(false)
    resetForm()
  }

  const handleStatusChange = (id: string, status: ERPatient['status']) => {
    const updated = patients.map(p =>
      p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
    )
    savePatients(updated)
    if (selectedPatient?.id === id) {
      setSelectedPatient({ ...selectedPatient, status, updatedAt: new Date().toISOString() })
    }
    toast.success('Updated', `Patient status changed to ${status.toLowerCase()}`)
  }

  const handleAssign = (id: string, field: 'assignedDoctor' | 'assignedBed', value: string) => {
    const updated = patients.map(p =>
      p.id === id ? { ...p, [field]: value, updatedAt: new Date().toISOString() } : p
    )
    savePatients(updated)
    if (selectedPatient?.id === id) {
      setSelectedPatient({ ...selectedPatient, [field]: value, updatedAt: new Date().toISOString() })
    }
    toast.success('Assigned', `${field === 'assignedDoctor' ? 'Doctor' : 'Bed'} assigned`)
  }

  const handleDischarge = (id: string) => {
    if (confirm('Are you sure you want to discharge this patient?')) {
      const updated = patients.filter(p => p.id !== id)
      savePatients(updated)
      toast.success('Discharged', 'Patient discharged from ER')
      setShowDetails(false)
    }
  }

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch =
        p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTriage = filterTriage === 'all' || p.triageLevel.toString() === filterTriage
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus
      return matchesSearch && matchesTriage && matchesStatus
    })
  }, [patients, searchQuery, filterTriage, filterStatus])

  const getTriageInfo = (level: ERPatient['triageLevel']) => {
    return TRIAGE_LEVELS.find(t => t.level === level)!
  }

  const getWaitTime = (arrivalTime: string) => {
    const mins = Math.floor((Date.now() - new Date(arrivalTime).getTime()) / 60000)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }

  const stats = useMemo(() => ({
    total: patients.length,
    critical: patients.filter(p => p.triageLevel <= 2).length,
    waiting: patients.filter(p => p.status === 'WAITING').length,
    inTreatment: patients.filter(p => p.status === 'TREATMENT' || p.status === 'OBSERVATION').length,
    avgWaitTime: patients.filter(p => p.status === 'WAITING').length > 0
      ? Math.round(
          patients
            .filter(p => p.status === 'WAITING')
            .reduce((sum, p) => sum + (Date.now() - new Date(p.arrivalTime).getTime()) / 60000, 0) /
          patients.filter(p => p.status === 'WAITING').length
        )
      : 0,
    bedsOccupied: patients.filter(p => p.assignedBed).length,
    triageDist: TRIAGE_LEVELS.map(t => ({
      level: t.level,
      count: patients.filter(p => p.triageLevel === t.level).length,
    })),
  }), [patients])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white">
              <Siren className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                Emergency Room
              </h2>
              <p className="text-muted-foreground">
                Real-time ER patient tracking and triage management
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={() => { resetForm(); setShowAddDialog(true) }} className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600">
            <Ambulance className="h-4 w-4 mr-2" />
            New ER Patient
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 grid-cols-2 lg:grid-cols-5"
      >
        {[
          { label: 'Total in ER', value: stats.total, icon: Users, color: 'from-blue-500 to-blue-600' },
          { label: 'Critical', value: stats.critical, icon: HeartPulse, color: 'from-red-500 to-red-600', alert: stats.critical > 0, pulse: true },
          { label: 'Waiting', value: stats.waiting, icon: Clock, color: 'from-amber-500 to-amber-600' },
          { label: 'In Treatment', value: stats.inTreatment, icon: Stethoscope, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Avg Wait', value: `${stats.avgWaitTime}m`, icon: Timer, color: 'from-purple-500 to-purple-600' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Card className={cn(
              "relative overflow-hidden border-0 shadow-md",
              stat.alert && "ring-2 ring-red-500 ring-offset-2"
            )}>
              <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", stat.color)} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={cn("p-2.5 rounded-xl bg-gradient-to-br text-white relative", stat.color)}>
                    <stat.icon className={cn("h-5 w-5", stat.pulse && "animate-pulse")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Triage Distribution & Bed Status */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              Triage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.triageDist.map((t) => {
                const triage = getTriageInfo(t.level as 1 | 2 | 3 | 4 | 5)
                const percent = stats.total > 0 ? (t.count / stats.total) * 100 : 0
                return (
                  <div key={t.level} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{triage.icon}</span>
                        <span className="font-medium">Level {t.level}</span>
                        <span className="text-muted-foreground">- {triage.name}</span>
                      </div>
                      <span className="font-bold">{t.count}</span>
                    </div>
                    <Progress
                      value={percent}
                      className={cn(
                        "h-2",
                        t.level === 1 && "[&>div]:bg-red-600",
                        t.level === 2 && "[&>div]:bg-orange-500",
                        t.level === 3 && "[&>div]:bg-yellow-500",
                        t.level === 4 && "[&>div]:bg-green-500",
                        t.level === 5 && "[&>div]:bg-blue-500"
                      )}
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-muted-foreground" />
              Bed Status
            </CardTitle>
            <CardDescription>{stats.bedsOccupied} of {ER_BEDS.length} beds occupied</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2">
              {ER_BEDS.map((bed) => {
                const occupied = patients.some(p => p.assignedBed === bed.id)
                const patient = patients.find(p => p.assignedBed === bed.id)
                return (
                  <div
                    key={bed.id}
                    className={cn(
                      "p-2 rounded-lg border text-center text-xs cursor-default transition-colors",
                      occupied
                        ? patient?.triageLevel && patient.triageLevel <= 2
                          ? "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700"
                          : "bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700"
                        : "bg-muted/50 border-dashed"
                    )}
                    title={occupied ? `${patient?.patientName}` : 'Available'}
                  >
                    <p className="font-medium truncate">{bed.id}</p>
                    <p className="text-[10px] text-muted-foreground">{bed.zone}</p>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
                <span>Critical</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-muted/50 border border-dashed" />
                <span>Available</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patients by name, complaint, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-0"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={filterTriage} onValueChange={setFilterTriage}>
                <SelectTrigger className="w-[160px] bg-muted/50 border-0">
                  <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Triage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {TRIAGE_LEVELS.map(t => (
                    <SelectItem key={t.level} value={t.level.toString()}>
                      <span className="mr-2">{t.icon}</span>
                      Level {t.level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px] bg-muted/50 border-0">
                  <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="WAITING">Waiting</SelectItem>
                  <SelectItem value="TRIAGE">Triage</SelectItem>
                  <SelectItem value="TREATMENT">Treatment</SelectItem>
                  <SelectItem value="OBSERVATION">Observation</SelectItem>
                  <SelectItem value="ADMITTED">Admitted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <AnimatePresence mode="wait">
        {filteredPatients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-0 shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Ambulance className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">No patients in ER</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {patients.length === 0 ? 'Register a patient to get started' : 'No patients match your filters'}
                </p>
                {patients.length === 0 && (
                  <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New ER Patient
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {filteredPatients.map((patient) => {
              const triageInfo = getTriageInfo(patient.triageLevel)
              const statusInfo = STATUS_CONFIG[patient.status]
              const StatusIcon = statusInfo.icon
              
              return (
                <motion.div key={patient.id} variants={item} layout>
                  <Card
                    className={cn(
                      "border-0 shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden",
                      patient.triageLevel <= 2 && "ring-2",
                      patient.triageLevel === 1 && "ring-red-500",
                      patient.triageLevel === 2 && "ring-orange-500"
                    )}
                    onClick={() => { setSelectedPatient(patient); setShowDetails(true) }}
                  >
                    <CardContent className="p-0">
                      {/* Triage Indicator */}
                      <div className={cn("h-1.5", triageInfo.color)} />
                      
                      <div className="p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                          {/* Patient Info */}
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <Avatar className={cn(
                              "h-14 w-14 ring-2 ring-offset-2",
                              triageInfo.ringColor
                            )}>
                              <AvatarFallback className={cn(
                                patient.triageLevel <= 2 
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' 
                                  : 'bg-primary/10 text-primary'
                              )}>
                                {getInitials(patient.patientName.split(' ')[0], patient.patientName.split(' ')[1] || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-lg">{patient.patientName}</h3>
                                <span className="text-sm text-muted-foreground">
                                  {patient.age}y • {patient.gender}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {patient.id}
                                </Badge>
                              </div>
                              <p className="font-medium text-foreground">{patient.chiefComplaint}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={cn(triageInfo.color, triageInfo.textColor)}>
                                  {triageInfo.icon} Level {patient.triageLevel}
                                </Badge>
                                <Badge variant="secondary" className={statusInfo.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                                <Badge variant="outline">{patient.arrivalMode}</Badge>
                              </div>
                            </div>
                          </div>

                          {/* Vitals Preview */}
                          {(patient.vitalSigns.bp || patient.vitalSigns.pulse) && (
                            <div className="hidden xl:flex items-center gap-4 px-4 py-2 rounded-lg bg-muted/50">
                              {patient.vitalSigns.bp && (
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">BP</p>
                                  <p className="font-bold text-sm">{patient.vitalSigns.bp}</p>
                                </div>
                              )}
                              {patient.vitalSigns.pulse && (
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">HR</p>
                                  <p className="font-bold text-sm">{patient.vitalSigns.pulse}</p>
                                </div>
                              )}
                              {patient.vitalSigns.oxygenSat && (
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">SpO2</p>
                                  <p className={cn(
                                    "font-bold text-sm",
                                    patient.vitalSigns.oxygenSat < 90 && "text-red-600"
                                  )}>
                                    {patient.vitalSigns.oxygenSat}%
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Time & Actions */}
                          <div className="flex lg:flex-col items-center lg:items-end gap-2 text-right">
                            <div className="flex items-center gap-1 text-sm bg-muted/50 px-3 py-1.5 rounded-full">
                              <Timer className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{getWaitTime(patient.arrivalTime)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {patient.assignedDoctor && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {patient.assignedDoctor.split(' ')[1]}
                                </span>
                              )}
                              {patient.assignedBed && (
                                <Badge variant="outline" className="text-xs">
                                  {patient.assignedBed}
                                </Badge>
                              )}
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground hidden lg:block" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patient Details Sheet */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedPatient && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className={cn(
                    "h-16 w-16 ring-2 ring-offset-2",
                    getTriageInfo(selectedPatient.triageLevel).ringColor
                  )}>
                    <AvatarFallback className={cn(
                      selectedPatient.triageLevel <= 2 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-primary/10 text-primary',
                      "text-xl font-bold"
                    )}>
                      {getInitials(selectedPatient.patientName.split(' ')[0], selectedPatient.patientName.split(' ')[1] || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-xl">{selectedPatient.patientName}</SheetTitle>
                    <SheetDescription>
                      {selectedPatient.age}y • {selectedPatient.gender} • {selectedPatient.id}
                    </SheetDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={cn(
                        getTriageInfo(selectedPatient.triageLevel).color,
                        getTriageInfo(selectedPatient.triageLevel).textColor
                      )}>
                        {getTriageInfo(selectedPatient.triageLevel).icon} Level {selectedPatient.triageLevel}
                      </Badge>
                      <Badge variant="secondary" className={STATUS_CONFIG[selectedPatient.status].color}>
                        {STATUS_CONFIG[selectedPatient.status].label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="vitals">Vitals</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <Card className="border-0 bg-muted/50">
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Chief Complaint</p>
                        <p className="font-medium mt-1">{selectedPatient.chiefComplaint}</p>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Arrival Mode</p>
                          <p className="font-medium mt-1">{selectedPatient.arrivalMode}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Wait Time</p>
                          <p className="font-medium mt-1">{getWaitTime(selectedPatient.arrivalTime)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-3">
                    <Card className="border-0 bg-muted/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Assigned Doctor</p>
                          <p className="font-medium truncate">{selectedPatient.assignedDoctor || 'Unassigned'}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 bg-muted/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <BedDouble className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Assigned Bed</p>
                          <p className="font-medium">{selectedPatient.assignedBed || 'Unassigned'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {selectedPatient.allergies && (
                    <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
                      <CardContent className="p-3 flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-xs text-red-600 font-medium uppercase tracking-wider">Allergies</p>
                          <p className="font-medium">{selectedPatient.allergies}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedPatient.notes && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Notes</p>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedPatient.notes}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Timeline</p>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Arrived</span>
                        <span>{format(new Date(selectedPatient.arrivalTime), 'MMM d, h:mm a')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Updated</span>
                        <span>{formatDistanceToNow(new Date(selectedPatient.updatedAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="vitals" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Blood Pressure', value: selectedPatient.vitalSigns.bp, unit: 'mmHg', icon: HeartPulse, color: 'text-red-500' },
                      { label: 'Heart Rate', value: selectedPatient.vitalSigns.pulse, unit: 'bpm', icon: Activity, color: 'text-pink-500' },
                      { label: 'Temperature', value: selectedPatient.vitalSigns.temp, unit: '°F', icon: Thermometer, color: 'text-orange-500' },
                      { label: 'Resp. Rate', value: selectedPatient.vitalSigns.respRate, unit: '/min', icon: Wind, color: 'text-blue-500' },
                      { label: 'Oxygen Sat.', value: selectedPatient.vitalSigns.oxygenSat, unit: '%', icon: Droplets, color: 'text-cyan-500', critical: selectedPatient.vitalSigns.oxygenSat && selectedPatient.vitalSigns.oxygenSat < 90 },
                    ].map((vital) => (
                      <Card key={vital.label} className={cn(
                        "border-0",
                        vital.critical ? "bg-red-50 dark:bg-red-950/30" : "bg-muted/50"
                      )}>
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <vital.icon className={cn("h-4 w-4", vital.color)} />
                            <p className="text-xs text-muted-foreground">{vital.label}</p>
                          </div>
                          <p className={cn(
                            "text-2xl font-bold",
                            vital.critical && "text-red-600"
                          )}>
                            {vital.value || '—'}
                            {vital.value && <span className="text-sm font-normal text-muted-foreground ml-1">{vital.unit}</span>}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Assign Doctor</Label>
                      <Select
                        value={selectedPatient.assignedDoctor || ''}
                        onValueChange={(v) => handleAssign(selectedPatient.id, 'assignedDoctor', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {ER_DOCTORS.map(doc => (
                            <SelectItem key={doc.name} value={doc.name}>
                              <div>
                                <p>{doc.name}</p>
                                <p className="text-xs text-muted-foreground">{doc.specialty}</p>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Assign Bed</Label>
                      <Select
                        value={selectedPatient.assignedBed || ''}
                        onValueChange={(v) => handleAssign(selectedPatient.id, 'assignedBed', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a bed" />
                        </SelectTrigger>
                        <SelectContent>
                          {ER_BEDS.filter(bed => !patients.some(p => p.assignedBed === bed.id && p.id !== selectedPatient.id)).map(bed => (
                            <SelectItem key={bed.id} value={bed.id}>
                              {bed.id} ({bed.zone})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Update Status</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPatient.status === 'WAITING' && (
                        <Button variant="outline" onClick={() => handleStatusChange(selectedPatient.id, 'TRIAGE')}>
                          <Activity className="h-4 w-4 mr-2" />
                          Start Triage
                        </Button>
                      )}
                      {selectedPatient.status === 'TRIAGE' && (
                        <Button variant="outline" onClick={() => handleStatusChange(selectedPatient.id, 'TREATMENT')}>
                          <Stethoscope className="h-4 w-4 mr-2" />
                          Start Treatment
                        </Button>
                      )}
                      {selectedPatient.status === 'TREATMENT' && (
                        <>
                          <Button variant="outline" onClick={() => handleStatusChange(selectedPatient.id, 'OBSERVATION')}>
                            <Timer className="h-4 w-4 mr-2" />
                            Observation
                          </Button>
                          <Button variant="outline" onClick={() => handleStatusChange(selectedPatient.id, 'ADMITTED')}>
                            <BedDouble className="h-4 w-4 mr-2" />
                            Admit
                          </Button>
                        </>
                      )}
                      {(selectedPatient.status === 'OBSERVATION' || selectedPatient.status === 'TREATMENT') && (
                        <Button 
                          variant="default" 
                          className="col-span-2 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleDischarge(selectedPatient.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Discharge Patient
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Patient Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                <Ambulance className="h-5 w-5" />
              </div>
              New ER Patient
            </DialogTitle>
            <DialogDescription>
              Register a new emergency room patient
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="patient" className="mt-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="patient">Patient Info</TabsTrigger>
              <TabsTrigger value="triage">Triage</TabsTrigger>
              <TabsTrigger value="vitals">Vitals</TabsTrigger>
            </TabsList>

            <TabsContent value="patient" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Patient Name *</Label>
                  <Input
                    value={form.patientName}
                    onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    placeholder="Age"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(v) => setForm({ ...form, gender: v as ERPatient['gender'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Contact number"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact</Label>
                <Input
                  value={form.emergencyContact}
                  onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  placeholder="Name and phone number"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Known Allergies
                </Label>
                <Input
                  value={form.allergies}
                  onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                  placeholder="List any known allergies"
                />
              </div>
            </TabsContent>

            <TabsContent value="triage" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Chief Complaint *</Label>
                <Textarea
                  value={form.chiefComplaint}
                  onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                  placeholder="Primary reason for ER visit"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Triage Level *</Label>
                <div className="grid gap-2">
                  {TRIAGE_LEVELS.map(t => (
                    <div
                      key={t.level}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        form.triageLevel === t.level
                          ? `${t.color} ${t.textColor} border-transparent`
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => setForm({ ...form, triageLevel: t.level as ERPatient['triageLevel'] })}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium">Level {t.level}: {t.name}</p>
                        <p className={cn(
                          "text-sm",
                          form.triageLevel === t.level ? "opacity-80" : "text-muted-foreground"
                        )}>
                          {t.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Arrival Mode</Label>
                <Select
                  value={form.arrivalMode}
                  onValueChange={(v) => setForm({ ...form, arrivalMode: v as ERPatient['arrivalMode'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Walk-in">Walk-in</SelectItem>
                    <SelectItem value="Ambulance">Ambulance</SelectItem>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                    <SelectItem value="Police">Police</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional notes"
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="vitals" className="space-y-4 mt-4">
              <Card className="border-0 bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <HeartPulse className="h-4 w-4" />
                    Vital Signs
                  </CardTitle>
                  <CardDescription>Record initial vital signs</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <HeartPulse className="h-4 w-4 text-red-500" />
                      Blood Pressure
                    </Label>
                    <Input
                      value={form.bp}
                      onChange={(e) => setForm({ ...form, bp: e.target.value })}
                      placeholder="120/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4 text-pink-500" />
                      Heart Rate
                    </Label>
                    <Input
                      type="number"
                      value={form.pulse}
                      onChange={(e) => setForm({ ...form, pulse: e.target.value })}
                      placeholder="72 bpm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      Temperature
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.temp}
                      onChange={(e) => setForm({ ...form, temp: e.target.value })}
                      placeholder="98.6 °F"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <Wind className="h-4 w-4 text-blue-500" />
                      Respiratory Rate
                    </Label>
                    <Input
                      type="number"
                      value={form.respRate}
                      onChange={(e) => setForm({ ...form, respRate: e.target.value })}
                      placeholder="16 /min"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-cyan-500" />
                      Oxygen Saturation
                    </Label>
                    <Input
                      type="number"
                      value={form.oxygenSat}
                      onChange={(e) => setForm({ ...form, oxygenSat: e.target.value })}
                      placeholder="98%"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-gradient-to-r from-red-600 to-red-500">
              <Ambulance className="h-4 w-4 mr-2" />
              Register Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
