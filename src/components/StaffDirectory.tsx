import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Building2,
  Filter,
  Download,
  UserCheck,
  UserX,
  Clock,
  Shield,
  Briefcase,
  Grid3X3,
  List,
  ChevronRight,
  Award,
  BadgeCheck,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { getInitials, cn } from '@/lib/utils'

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  department: string
  employeeId: string
  joinDate: string
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE'
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  notes?: string
  salary?: number
  skills?: string[]
  performance?: number
}

const ROLES = [
  { name: 'Receptionist', icon: '👋', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { name: 'Nurse', icon: '💉', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  { name: 'Lab Technician', icon: '🔬', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { name: 'Pharmacist', icon: '💊', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { name: 'Administrator', icon: '📋', color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300' },
  { name: 'Accountant', icon: '💰', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { name: 'Maintenance', icon: '🔧', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { name: 'Security', icon: '🛡️', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { name: 'Cleaner', icon: '🧹', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
  { name: 'IT Support', icon: '💻', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { name: 'HR Manager', icon: '👥', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  { name: 'Other', icon: '📌', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' },
]

const DEPARTMENTS = [
  { name: 'Administration', icon: Building2 },
  { name: 'Front Desk', icon: Users },
  { name: 'Nursing', icon: Shield },
  { name: 'Laboratory', icon: Briefcase },
  { name: 'Pharmacy', icon: Briefcase },
  { name: 'Radiology', icon: Briefcase },
  { name: 'Emergency', icon: Clock },
  { name: 'ICU', icon: Shield },
  { name: 'OPD', icon: Users },
  { name: 'Finance', icon: Briefcase },
  { name: 'IT', icon: Briefcase },
  { name: 'Maintenance', icon: Briefcase },
  { name: 'Human Resources', icon: Users },
]

const STORAGE_KEY = 'staff_directory'

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

export function StaffDirectory() {
  const toast = useToast()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    employeeId: '',
    joinDate: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: '',
    salary: '',
    skills: '',
  })

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setStaff(JSON.parse(stored))
    }
  }, [])

  const saveStaff = (newStaff: StaffMember[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStaff))
    setStaff(newStaff)
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      employeeId: '',
      joinDate: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      notes: '',
      salary: '',
      skills: '',
    })
  }

  const generateEmployeeId = () => {
    const prefix = 'EMP'
    const number = String(staff.length + 1).padStart(4, '0')
    return `${prefix}${number}`
  }

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.role || !formData.department) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    if (editingStaff) {
      const updated = staff.map(s => {
        if (s.id === editingStaff.id) {
          return {
            ...s,
            ...formData,
            salary: formData.salary ? parseFloat(formData.salary) : undefined,
            skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : undefined,
          }
        }
        return s
      })
      saveStaff(updated)
      toast.success('Updated', 'Staff member updated successfully')
    } else {
      const newStaffMember: StaffMember = {
        id: crypto.randomUUID(),
        ...formData,
        employeeId: formData.employeeId || generateEmployeeId(),
        status: 'ACTIVE',
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : undefined,
        performance: Math.floor(Math.random() * 30) + 70,
      }
      saveStaff([...staff, newStaffMember])
      toast.success('Success', 'Staff member added successfully')
    }

    setShowAddDialog(false)
    setEditingStaff(null)
    resetForm()
  }

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member)
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email || '',
      phone: member.phone,
      role: member.role,
      department: member.department,
      employeeId: member.employeeId,
      joinDate: member.joinDate || '',
      address: member.address || '',
      emergencyContact: member.emergencyContact || '',
      emergencyPhone: member.emergencyPhone || '',
      notes: member.notes || '',
      salary: member.salary?.toString() || '',
      skills: member.skills?.join(', ') || '',
    })
    setShowAddDialog(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      const updated = staff.filter(s => s.id !== id)
      saveStaff(updated)
      toast.success('Deleted', 'Staff member removed')
      setShowDetails(false)
    }
  }

  const handleStatusChange = (id: string, status: StaffMember['status']) => {
    const updated = staff.map(s => (s.id === id ? { ...s, status } : s))
    saveStaff(updated)
    if (selectedStaff?.id === id) {
      setSelectedStaff({ ...selectedStaff, status })
    }
    toast.success('Updated', 'Status changed successfully')
  }

  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      const matchesSearch = 
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.phone.includes(searchQuery)
      const matchesDepartment = selectedDepartment === 'all' || member.department === selectedDepartment
      const matchesStatus = selectedStatus === 'all' || member.status === selectedStatus
      const matchesRole = selectedRole === 'all' || member.role === selectedRole
      return matchesSearch && matchesDepartment && matchesStatus && matchesRole
    })
  }, [staff, searchQuery, selectedDepartment, selectedStatus, selectedRole])

  const stats = useMemo(() => ({
    total: staff.length,
    active: staff.filter(s => s.status === 'ACTIVE').length,
    onLeave: staff.filter(s => s.status === 'ON_LEAVE').length,
    inactive: staff.filter(s => s.status === 'INACTIVE').length,
    departments: [...new Set(staff.map(s => s.department))].length,
  }), [staff])

  const getRoleInfo = (roleName: string) => {
    return ROLES.find(r => r.name === roleName) || ROLES[ROLES.length - 1]
  }

  const getStatusConfig = (status: StaffMember['status']) => {
    switch (status) {
      case 'ACTIVE':
        return { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: UserCheck, label: 'Active' }
      case 'ON_LEAVE':
        return { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: Clock, label: 'On Leave' }
      case 'INACTIVE':
        return { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: UserX, label: 'Inactive' }
    }
  }

  const exportToCSV = () => {
    const headers = ['Employee ID', 'Name', 'Email', 'Phone', 'Role', 'Department', 'Status', 'Join Date']
    const rows = staff.map(s => [
      s.employeeId,
      `${s.firstName} ${s.lastName}`,
      s.email || '',
      s.phone,
      s.role,
      s.department,
      s.status,
      s.joinDate || '',
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `staff_directory_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Staff Directory
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your hospital staff and personnel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => { resetForm(); setEditingStaff(null); setShowAddDialog(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
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
          { label: 'Total Staff', value: stats.total, icon: Users, color: 'from-blue-500 to-blue-600' },
          { label: 'Active', value: stats.active, icon: UserCheck, color: 'from-emerald-500 to-emerald-600' },
          { label: 'On Leave', value: stats.onLeave, icon: Clock, color: 'from-amber-500 to-amber-600' },
          { label: 'Inactive', value: stats.inactive, icon: UserX, color: 'from-red-500 to-red-600' },
          { label: 'Departments', value: stats.departments, icon: Building2, color: 'from-purple-500 to-purple-600' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Card className="relative overflow-hidden border-0 shadow-md">
              <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", stat.color)} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={cn("p-2.5 rounded-xl bg-gradient-to-br text-white", stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, ID, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-0"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[160px] bg-muted/50 border-0">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map(d => (
                    <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[140px] bg-muted/50 border-0">
                  <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ROLES.map(r => (
                    <SelectItem key={r.name} value={r.name}>
                      <span className="mr-2">{r.icon}</span>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[130px] bg-muted/50 border-0">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Separator orientation="vertical" className="h-8 hidden lg:block" />
              <div className="flex items-center border rounded-lg p-1 bg-muted/50">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <AnimatePresence mode="wait">
        {filteredStaff.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-0 shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">No staff members found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {staff.length === 0 ? 'Add your first staff member to get started' : 'Try adjusting your search or filters'}
                </p>
                {staff.length === 0 && (
                  <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff Member
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filteredStaff.map((member) => {
              const roleInfo = getRoleInfo(member.role)
              const statusConfig = getStatusConfig(member.status)
              
              return (
                <motion.div key={member.id} variants={item} layout>
                  <Card 
                    className="group border-0 shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                    onClick={() => { setSelectedStaff(member); setShowDetails(true) }}
                  >
                    <CardContent className="p-0">
                      {/* Header gradient */}
                      <div className={cn("h-20 bg-gradient-to-br relative", 
                        member.status === 'ACTIVE' ? 'from-primary/20 to-primary/5' :
                        member.status === 'ON_LEAVE' ? 'from-amber-200/50 to-amber-100/20' :
                        'from-gray-200/50 to-gray-100/20'
                      )}>
                        <div className="absolute top-3 right-3">
                          <Badge className={cn("text-xs", statusConfig.color)}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Avatar */}
                      <div className="px-4 -mt-10 relative z-10">
                        <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                          <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary to-primary/60 text-white">
                            {getInitials(member.firstName, member.lastName)}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Info */}
                      <div className="p-4 pt-3 space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                            {member.firstName} {member.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">{member.employeeId}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={cn("text-xs", roleInfo.color)}>
                            <span className="mr-1">{roleInfo.icon}</span>
                            {member.role}
                          </Badge>
                        </div>

                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
                            <span className="truncate">{member.department}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{member.phone}</span>
                          </div>
                          {member.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3.5 w-3.5" />
                              <span className="truncate">{member.email}</span>
                            </div>
                          )}
                        </div>

                        {member.performance && (
                          <div className="pt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Performance</span>
                              <span className="font-medium">{member.performance}%</span>
                            </div>
                            <Progress value={member.performance} className="h-1.5" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="divide-y">
              {filteredStaff.map((member) => {
                const roleInfo = getRoleInfo(member.role)
                const statusConfig = getStatusConfig(member.status)
                
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => { setSelectedStaff(member); setShowDetails(true) }}
                  >
                    <Avatar className="h-12 w-12 border-2 border-background shadow">
                      <AvatarFallback className="font-semibold bg-gradient-to-br from-primary to-primary/60 text-white">
                        {getInitials(member.firstName, member.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{member.firstName} {member.lastName}</h3>
                        <Badge className={cn("text-xs", statusConfig.color)}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.employeeId} • {member.department}</p>
                    </div>
                    <Badge variant="secondary" className={cn("text-xs hidden sm:flex", roleInfo.color)}>
                      <span className="mr-1">{roleInfo.icon}</span>
                      {member.role}
                    </Badge>
                    <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{member.phone}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
                )
              })}
            </div>
          </Card>
        )}
      </AnimatePresence>

      {/* Details Sheet */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedStaff && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border-2">
                    <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary to-primary/60 text-white">
                      {getInitials(selectedStaff.firstName, selectedStaff.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-xl">
                      {selectedStaff.firstName} {selectedStaff.lastName}
                    </SheetTitle>
                    <SheetDescription>{selectedStaff.employeeId}</SheetDescription>
                    <Badge className={cn("mt-2", getStatusConfig(selectedStaff.status).color)}>
                      {getStatusConfig(selectedStaff.status).label}
                    </Badge>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="info" className="mt-4">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Role</p>
                      <p className="font-medium">{selectedStaff.role}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Department</p>
                      <p className="font-medium">{selectedStaff.department}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Join Date</p>
                      <p className="font-medium">
                        {selectedStaff.joinDate ? format(new Date(selectedStaff.joinDate), 'MMM d, yyyy') : 'Not set'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                      <Select
                        value={selectedStaff.status}
                        onValueChange={(v) => handleStatusChange(selectedStaff.id, v as StaffMember['status'])}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedStaff.performance && (
                    <Card className="border-0 bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="font-medium">Performance Score</span>
                          </div>
                          <span className="text-2xl font-bold text-primary">{selectedStaff.performance}%</span>
                        </div>
                        <Progress value={selectedStaff.performance} className="h-2" />
                      </CardContent>
                    </Card>
                  )}

                  {selectedStaff.skills && selectedStaff.skills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedStaff.skills.map((skill, i) => (
                          <Badge key={i} variant="outline" className="bg-primary/5">
                            <Award className="h-3 w-3 mr-1" />
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedStaff.notes && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Notes</p>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedStaff.notes}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="contact" className="space-y-4 mt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedStaff.phone}</p>
                      </div>
                    </div>
                    {selectedStaff.email && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedStaff.email}</p>
                        </div>
                      </div>
                    )}
                    {selectedStaff.address && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="font-medium">{selectedStaff.address}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {(selectedStaff.emergencyContact || selectedStaff.emergencyPhone) && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Emergency Contact</p>
                        <Card className="border-red-200 dark:border-red-900/50">
                          <CardContent className="p-3 space-y-2">
                            {selectedStaff.emergencyContact && (
                              <p className="font-medium">{selectedStaff.emergencyContact}</p>
                            )}
                            {selectedStaff.emergencyPhone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" />
                                {selectedStaff.emergencyPhone}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-6 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => { setShowDetails(false); handleEdit(selectedStaff) }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(selectedStaff.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingStaff ? (
                <>
                  <Edit className="h-5 w-5" />
                  Edit Staff Member
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Add New Staff Member
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingStaff ? 'Update the staff member information' : 'Fill in the details to add a new staff member'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="work">Work Details</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St, City"
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="work" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) => setFormData({ ...formData, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.name} value={role.name}>
                          <span className="mr-2">{role.icon}</span>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(v) => setFormData({ ...formData, department: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Join Date</Label>
                  <Input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salary (Monthly)</Label>
                  <Input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Skills (comma-separated)</Label>
                  <Input
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    placeholder="First Aid, CPR, etc."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-600" />
                    Emergency Contact
                  </CardTitle>
                  <CardDescription>Contact person in case of emergency</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Contact Name</Label>
                    <Input
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      placeholder="+1234567890"
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
            <Button onClick={handleSave}>
              <BadgeCheck className="h-4 w-4 mr-2" />
              {editingStaff ? 'Save Changes' : 'Add Staff Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
