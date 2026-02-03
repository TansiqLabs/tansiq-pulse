import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns'
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  User,
  Coffee,
  Moon,
  Sun,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

interface Shift {
  id: string
  staffId: string
  staffName: string
  staffRole: string
  date: string
  type: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'FULL_DAY' | 'OFF'
  startTime: string
  endTime: string
  department: string
  notes?: string
}

const SHIFT_TYPES = {
  MORNING: { label: 'Morning', icon: Sun, color: 'bg-yellow-100 text-yellow-800', start: '06:00', end: '14:00' },
  AFTERNOON: { label: 'Afternoon', icon: Coffee, color: 'bg-orange-100 text-orange-800', start: '14:00', end: '22:00' },
  NIGHT: { label: 'Night', icon: Moon, color: 'bg-indigo-100 text-indigo-800', start: '22:00', end: '06:00' },
  FULL_DAY: { label: 'Full Day', icon: Clock, color: 'bg-blue-100 text-blue-800', start: '08:00', end: '20:00' },
  OFF: { label: 'Day Off', icon: Calendar, color: 'bg-gray-100 text-gray-800', start: '', end: '' },
}

const DEPARTMENTS = [
  'Emergency',
  'ICU',
  'General Ward',
  'Surgery',
  'Pediatrics',
  'Maternity',
  'Laboratory',
  'Pharmacy',
  'Radiology',
  'Reception',
]

export function ShiftManagement() {
  const toast = useToast()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const [staffList, setStaffList] = useState<{ id: string; name: string; role: string }[]>([])

  const [shiftForm, setShiftForm] = useState({
    staffId: '',
    type: 'MORNING' as Shift['type'],
    startTime: '',
    endTime: '',
    department: '',
    notes: '',
  })

  useEffect(() => {
    const stored = localStorage.getItem('staff_shifts')
    const storedStaff = localStorage.getItem('staff_directory')
    
    if (stored) {
      setShifts(JSON.parse(stored))
    }
    
    if (storedStaff) {
      const staff = JSON.parse(storedStaff)
      setStaffList(staff.map((s: { id: string; firstName: string; lastName: string; role: string }) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        role: s.role,
      })))
    } else {
      // Sample staff
      const sampleStaff = [
        { id: '1', name: 'Nurse Johnson', role: 'Nurse' },
        { id: '2', name: 'Dr. Smith', role: 'Doctor' },
        { id: '3', name: 'Tech Williams', role: 'Technician' },
        { id: '4', name: 'Nurse Davis', role: 'Nurse' },
        { id: '5', name: 'Receptionist Brown', role: 'Reception' },
      ]
      setStaffList(sampleStaff)
    }
  }, [])

  const saveShifts = (newShifts: Shift[]) => {
    localStorage.setItem('staff_shifts', JSON.stringify(newShifts))
    setShifts(newShifts)
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  const previousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7))
  }

  const nextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7))
  }

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  const resetForm = () => {
    setShiftForm({
      staffId: '',
      type: 'MORNING',
      startTime: '',
      endTime: '',
      department: '',
      notes: '',
    })
  }

  const handleSaveShift = () => {
    if (!shiftForm.staffId || !selectedDate || !shiftForm.department) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    const staff = staffList.find(s => s.id === shiftForm.staffId)
    if (!staff) return

    const shiftType = SHIFT_TYPES[shiftForm.type]
    const startTime = shiftForm.type === 'OFF' ? '' : (shiftForm.startTime || shiftType.start)
    const endTime = shiftForm.type === 'OFF' ? '' : (shiftForm.endTime || shiftType.end)

    if (editingShift) {
      const updated = shifts.map(s => {
        if (s.id === editingShift.id) {
          return {
            ...s,
            staffId: shiftForm.staffId,
            staffName: staff.name,
            staffRole: staff.role,
            type: shiftForm.type,
            startTime,
            endTime,
            department: shiftForm.department,
            notes: shiftForm.notes,
          }
        }
        return s
      })
      saveShifts(updated)
      toast.success('Updated', 'Shift updated')
    } else {
      const newShift: Shift = {
        id: crypto.randomUUID(),
        staffId: shiftForm.staffId,
        staffName: staff.name,
        staffRole: staff.role,
        date: format(selectedDate, 'yyyy-MM-dd'),
        type: shiftForm.type,
        startTime,
        endTime,
        department: shiftForm.department,
        notes: shiftForm.notes,
      }
      saveShifts([...shifts, newShift])
      toast.success('Added', 'Shift scheduled')
    }

    setShowAddDialog(false)
    setEditingShift(null)
    setSelectedDate(null)
    resetForm()
  }

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift)
    setSelectedDate(parseISO(shift.date))
    setShiftForm({
      staffId: shift.staffId,
      type: shift.type,
      startTime: shift.startTime,
      endTime: shift.endTime,
      department: shift.department,
      notes: shift.notes || '',
    })
    setShowAddDialog(true)
  }

  const handleDeleteShift = (id: string) => {
    const updated = shifts.filter(s => s.id !== id)
    saveShifts(updated)
    toast.success('Deleted', 'Shift removed')
  }

  const openAddDialog = (date: Date) => {
    setSelectedDate(date)
    setShowAddDialog(true)
  }

  const copyPreviousWeek = () => {
    const previousWeekStart = addDays(currentWeekStart, -7)
    const previousWeekShifts = shifts.filter(s => {
      const shiftDate = parseISO(s.date)
      return shiftDate >= previousWeekStart && shiftDate < currentWeekStart
    })

    if (previousWeekShifts.length === 0) {
      toast.error('Error', 'No shifts found in the previous week')
      return
    }

    const newShifts = previousWeekShifts.map(s => ({
      ...s,
      id: crypto.randomUUID(),
      date: format(addDays(parseISO(s.date), 7), 'yyyy-MM-dd'),
    }))

    saveShifts([...shifts, ...newShifts])
    toast.success('Copied', `${newShifts.length} shifts copied from previous week`)
  }

  const getShiftsForDay = (date: Date) => {
    return shifts.filter(s => {
      const shiftDate = parseISO(s.date)
      const matchesDate = isSameDay(shiftDate, date)
      const matchesDepartment = filterDepartment === 'all' || s.department === filterDepartment
      return matchesDate && matchesDepartment
    })
  }

  const getShiftTypeConfig = (type: Shift['type']) => SHIFT_TYPES[type]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={previousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
            </h2>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={goToCurrentWeek}>
              Go to current week
            </Button>
          </div>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={copyPreviousWeek}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Previous Week
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(SHIFT_TYPES).map(([key, { label, color }]) => (
          <Badge key={key} variant="outline" className={color}>
            {label}
          </Badge>
        ))}
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayShifts = getShiftsForDay(day)
          const isToday = isSameDay(day, new Date())

          return (
            <Card key={day.toISOString()} className={isToday ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className={isToday ? 'text-primary font-bold' : ''}>
                    {format(day, 'EEE')}
                    <span className="block text-lg">{format(day, 'd')}</span>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => openAddDialog(day)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <AnimatePresence>
                  {dayShifts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No shifts</p>
                  ) : (
                    dayShifts.map((shift) => {
                      const config = getShiftTypeConfig(shift.type)
                      const Icon = config.icon

                      return (
                        <motion.div
                          key={shift.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`p-2 rounded-lg text-xs ${config.color} group relative`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <Icon className="h-3 w-3" />
                            <span className="font-medium truncate">{shift.staffName}</span>
                          </div>
                          <p className="text-[10px] opacity-80 truncate">{shift.department}</p>
                          {shift.type !== 'OFF' && (
                            <p className="text-[10px] opacity-80">
                              {shift.startTime} - {shift.endTime}
                            </p>
                          )}
                          <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 bg-white/80"
                              onClick={() => handleEditShift(shift)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 bg-white/80 text-red-500"
                              onClick={() => handleDeleteShift(shift.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Staff Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Staff</th>
                  {weekDays.map(day => (
                    <th key={day.toISOString()} className="text-center py-2 font-medium min-w-[80px]">
                      {format(day, 'EEE d')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staffList.map(staff => (
                  <tr key={staff.id} className="border-b">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{staff.name}</span>
                        <Badge variant="outline" className="text-xs">{staff.role}</Badge>
                      </div>
                    </td>
                    {weekDays.map(day => {
                      const dayShift = shifts.find(s => 
                        s.staffId === staff.id && isSameDay(parseISO(s.date), day)
                      )
                      const config = dayShift ? getShiftTypeConfig(dayShift.type) : null

                      return (
                        <td key={day.toISOString()} className="text-center py-2">
                          {config ? (
                            <Badge variant="outline" className={`text-xs ${config.color}`}>
                              {config.label}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Shift Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open)
        if (!open) {
          setEditingShift(null)
          setSelectedDate(null)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingShift ? 'Edit Shift' : 'Schedule Shift'}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Staff Member *</Label>
              <Select
                value={shiftForm.staffId}
                onValueChange={(value) => setShiftForm({ ...shiftForm, staffId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map(staff => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} ({staff.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Department *</Label>
              <Select
                value={shiftForm.department}
                onValueChange={(value) => setShiftForm({ ...shiftForm, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Shift Type</Label>
              <Select
                value={shiftForm.type}
                onValueChange={(value: Shift['type']) => {
                  const config = SHIFT_TYPES[value]
                  setShiftForm({
                    ...shiftForm,
                    type: value,
                    startTime: config.start,
                    endTime: config.end,
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SHIFT_TYPES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {shiftForm.type !== 'OFF' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={shiftForm.notes}
                onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false)
              setEditingShift(null)
              setSelectedDate(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveShift}>
              {editingShift ? 'Update' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
