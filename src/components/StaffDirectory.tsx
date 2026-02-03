import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  UserCircle,
  Calendar,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { getInitials } from '@/lib/utils'

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
}

const ROLES = [
  'Receptionist',
  'Nurse',
  'Lab Technician',
  'Pharmacist',
  'Administrator',
  'Accountant',
  'Maintenance',
  'Security',
  'Cleaner',
  'IT Support',
  'HR Manager',
  'Other',
]

const DEPARTMENTS = [
  'Administration',
  'Front Desk',
  'Nursing',
  'Laboratory',
  'Pharmacy',
  'Radiology',
  'Emergency',
  'ICU',
  'OPD',
  'Finance',
  'IT',
  'Maintenance',
  'Human Resources',
]

const STORAGE_KEY = 'staff_directory'

export function StaffDirectory() {
  const toast = useToast()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)

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
          }
        }
        return s
      })
      saveStaff(updated)
      toast.success('Updated', 'Staff member updated successfully')
    } else {
      const newStaff: StaffMember = {
        id: crypto.randomUUID(),
        ...formData,
        employeeId: formData.employeeId || generateEmployeeId(),
        status: 'ACTIVE',
      }
      saveStaff([...staff, newStaff])
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
      email: member.email,
      phone: member.phone,
      role: member.role,
      department: member.department,
      employeeId: member.employeeId,
      joinDate: member.joinDate,
      address: member.address || '',
      emergencyContact: member.emergencyContact || '',
      emergencyPhone: member.emergencyPhone || '',
      notes: member.notes || '',
    })
    setShowAddDialog(true)
  }

  const handleDelete = (id: string) => {
    const updated = staff.filter(s => s.id !== id)
    saveStaff(updated)
    setSelectedStaff(null)
    toast.success('Deleted', 'Staff member removed')
  }

  const handleStatusChange = (id: string, status: StaffMember['status']) => {
    const updated = staff.map(s => {
      if (s.id === id) {
        return { ...s, status }
      }
      return s
    })
    saveStaff(updated)
    if (selectedStaff?.id === id) {
      setSelectedStaff({ ...selectedStaff, status })
    }
  }

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.employeeId.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDepartment = selectedDepartment === 'all' || member.department === selectedDepartment
    const matchesStatus = selectedStatus === 'all' || member.status === selectedStatus

    return matchesSearch && matchesDepartment && matchesStatus
  })

  const departmentCounts = staff.reduce((acc, member) => {
    acc[member.department] = (acc[member.department] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const getStatusBadge = (status: StaffMember['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
      case 'ON_LEAVE':
        return <Badge className="bg-amber-100 text-amber-700">On Leave</Badge>
      case 'INACTIVE':
        return <Badge variant="secondary">Inactive</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Staff Directory
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage hospital staff and employees
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total Staff</span>
            </div>
            <p className="text-2xl font-bold mt-1">{staff.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-emerald-600">
              {staff.filter(s => s.status === 'ACTIVE').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-muted-foreground">On Leave</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-amber-600">
              {staff.filter(s => s.status === 'ON_LEAVE').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-violet-600" />
              <span className="text-sm text-muted-foreground">Departments</span>
            </div>
            <p className="text-2xl font-bold mt-1">{Object.keys(departmentCounts).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept} {departmentCounts[dept] ? `(${departmentCounts[dept]})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ON_LEAVE">On Leave</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff List and Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Staff List */}
        <div className="lg:col-span-2">
          {filteredStaff.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  {staff.length === 0 ? 'No staff members added yet' : 'No matching staff found'}
                </p>
                {staff.length === 0 && (
                  <Button variant="link" onClick={() => setShowAddDialog(true)}>
                    Add your first staff member
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <AnimatePresence>
                {filteredStaff.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedStaff?.id === member.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedStaff(member)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(member.firstName, member.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold truncate">
                                {member.firstName} {member.lastName}
                              </h4>
                              {getStatusBadge(member.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {member.department} • {member.employeeId}
                            </p>
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

        {/* Staff Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName}` : 'Staff Details'}
            </CardTitle>
            <CardDescription>
              {selectedStaff ? selectedStaff.role : 'Select a staff member to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedStaff ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {getInitials(selectedStaff.firstName, selectedStaff.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="text-center">
                  {getStatusBadge(selectedStaff.status)}
                  <p className="text-sm text-muted-foreground mt-2">
                    Employee ID: {selectedStaff.employeeId}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedStaff.department}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedStaff.phone}</span>
                  </div>
                  {selectedStaff.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{selectedStaff.email}</span>
                    </div>
                  )}
                  {selectedStaff.address && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{selectedStaff.address}</span>
                    </div>
                  )}
                  {selectedStaff.joinDate && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Joined: {selectedStaff.joinDate}</span>
                    </div>
                  )}
                </div>

                {(selectedStaff.emergencyContact || selectedStaff.emergencyPhone) && (
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">EMERGENCY CONTACT</p>
                    {selectedStaff.emergencyContact && (
                      <p className="text-sm font-medium">{selectedStaff.emergencyContact}</p>
                    )}
                    {selectedStaff.emergencyPhone && (
                      <p className="text-sm text-muted-foreground">{selectedStaff.emergencyPhone}</p>
                    )}
                  </div>
                )}

                {/* Status Actions */}
                <div className="border-t pt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">CHANGE STATUS</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={selectedStaff.status === 'ACTIVE' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(selectedStaff.id, 'ACTIVE')}
                    >
                      Active
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedStaff.status === 'ON_LEAVE' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(selectedStaff.id, 'ON_LEAVE')}
                    >
                      On Leave
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedStaff.status === 'INACTIVE' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(selectedStaff.id, 'INACTIVE')}
                    >
                      Inactive
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEdit(selectedStaff)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(selectedStaff.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select a staff member to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open)
        if (!open) {
          setEditingStaff(null)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
            </DialogTitle>
            <DialogDescription>
              {editingStaff ? 'Update staff member information' : 'Add a new staff member to the directory'}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
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
                  <Label>Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@hospital.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder={generateEmployeeId()}
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
            </TabsContent>
            <TabsContent value="additional" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, City"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Emergency Contact</Label>
                  <Input
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Phone</Label>
                  <Input
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false)
              setEditingStaff(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingStaff ? 'Update' : 'Add Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
