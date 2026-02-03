import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, isPast, isToday, isTomorrow } from 'date-fns'
import {
  CalendarClock,
  Plus,
  Bell,
  Trash2,
  Check,
  Phone,
  Mail,
  Calendar,
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

interface FollowUp {
  id: string
  patientId: number
  reason: string
  scheduledDate: string
  reminderDate: string
  reminderType: 'EMAIL' | 'PHONE' | 'BOTH'
  status: 'PENDING' | 'REMINDED' | 'COMPLETED' | 'CANCELLED'
  notes?: string
  createdAt: string
}

interface FollowUpSchedulerProps {
  patientId: number
  patientName: string
  patientPhone?: string
  patientEmail?: string
}

const FOLLOW_UP_REASONS = [
  'Post-procedure check',
  'Medication review',
  'Lab result follow-up',
  'Chronic condition monitoring',
  'Vaccination due',
  'Annual checkup',
  'Referral follow-up',
  'Surgery post-op',
  'Other',
]

export function FollowUpScheduler({ patientId, patientName, patientPhone, patientEmail }: FollowUpSchedulerProps) {
  const toast = useToast()
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [formData, setFormData] = useState({
    reason: '',
    customReason: '',
    scheduledDate: '',
    reminderDays: '3',
    reminderType: 'PHONE' as 'EMAIL' | 'PHONE' | 'BOTH',
    notes: '',
  })

  const loadFollowUps = useCallback(() => {
    const stored = localStorage.getItem(`follow_ups_${patientId}`)
    if (stored) {
      setFollowUps(JSON.parse(stored))
    }
  }, [patientId])

  useEffect(() => {
    loadFollowUps()
  }, [loadFollowUps])

  const saveFollowUps = (newFollowUps: FollowUp[]) => {
    localStorage.setItem(`follow_ups_${patientId}`, JSON.stringify(newFollowUps))
    setFollowUps(newFollowUps)
  }

  const handleAddFollowUp = () => {
    const reason = formData.reason === 'Other' ? formData.customReason : formData.reason
    if (!reason || !formData.scheduledDate) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    const scheduledDate = new Date(formData.scheduledDate)
    const reminderDate = addDays(scheduledDate, -parseInt(formData.reminderDays))

    const newFollowUp: FollowUp = {
      id: crypto.randomUUID(),
      patientId,
      reason,
      scheduledDate: scheduledDate.toISOString(),
      reminderDate: reminderDate.toISOString(),
      reminderType: formData.reminderType,
      status: 'PENDING',
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    }

    saveFollowUps([newFollowUp, ...followUps])
    setShowAddDialog(false)
    setFormData({
      reason: '',
      customReason: '',
      scheduledDate: '',
      reminderDays: '3',
      reminderType: 'PHONE',
      notes: '',
    })
    toast.success('Success', 'Follow-up scheduled successfully')
  }

  const handleMarkReminded = (id: string) => {
    const updated = followUps.map(f => 
      f.id === id ? { ...f, status: 'REMINDED' as const } : f
    )
    saveFollowUps(updated)
    toast.success('Updated', 'Marked as reminded')
  }

  const handleMarkCompleted = (id: string) => {
    const updated = followUps.map(f => 
      f.id === id ? { ...f, status: 'COMPLETED' as const } : f
    )
    saveFollowUps(updated)
    toast.success('Completed', 'Follow-up marked as completed')
  }

  const handleDelete = (id: string) => {
    const updated = followUps.filter(f => f.id !== id)
    saveFollowUps(updated)
    toast.success('Deleted', 'Follow-up removed')
  }

  const quickSchedule = (days: number) => {
    const date = addDays(new Date(), days)
    setFormData({ ...formData, scheduledDate: format(date, 'yyyy-MM-dd') })
  }

  const getStatusBadge = (followUp: FollowUp) => {
    const scheduled = new Date(followUp.scheduledDate)
    
    if (followUp.status === 'COMPLETED') {
      return <Badge className="bg-green-100 text-green-700">Completed</Badge>
    }
    if (followUp.status === 'CANCELLED') {
      return <Badge variant="secondary">Cancelled</Badge>
    }
    if (followUp.status === 'REMINDED') {
      return <Badge className="bg-blue-100 text-blue-700">Reminded</Badge>
    }
    if (isPast(scheduled) && !isToday(scheduled)) {
      return <Badge variant="destructive">Overdue</Badge>
    }
    if (isToday(scheduled)) {
      return <Badge className="bg-amber-100 text-amber-700">Today</Badge>
    }
    if (isTomorrow(scheduled)) {
      return <Badge className="bg-orange-100 text-orange-700">Tomorrow</Badge>
    }
    return <Badge variant="outline">Scheduled</Badge>
  }

  const getReminderIcon = (type: FollowUp['reminderType']) => {
    switch (type) {
      case 'EMAIL':
        return <Mail className="h-4 w-4" />
      case 'PHONE':
        return <Phone className="h-4 w-4" />
      case 'BOTH':
        return (
          <div className="flex gap-1">
            <Phone className="h-3 w-3" />
            <Mail className="h-3 w-3" />
          </div>
        )
    }
  }

  const pendingCount = followUps.filter(f => f.status === 'PENDING' || f.status === 'REMINDED').length
  const overdueCount = followUps.filter(f => 
    (f.status === 'PENDING' || f.status === 'REMINDED') && 
    isPast(new Date(f.scheduledDate)) && 
    !isToday(new Date(f.scheduledDate))
  ).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Follow-ups
          </h3>
          {pendingCount > 0 && (
            <Badge variant="secondary">{pendingCount} scheduled</Badge>
          )}
          {overdueCount > 0 && (
            <Badge variant="destructive">{overdueCount} overdue</Badge>
          )}
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Follow-up
        </Button>
      </div>

      {followUps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarClock className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No follow-ups scheduled</p>
            <Button variant="link" onClick={() => setShowAddDialog(true)}>
              Schedule a follow-up
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {followUps
              .filter(f => f.status !== 'COMPLETED' && f.status !== 'CANCELLED')
              .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
              .map((followUp) => (
                <motion.div
                  key={followUp.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className={isPast(new Date(followUp.scheduledDate)) && !isToday(new Date(followUp.scheduledDate)) ? 'border-red-200 bg-red-50/50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{followUp.reason}</span>
                            {getStatusBadge(followUp)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(followUp.scheduledDate), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              {getReminderIcon(followUp.reminderType)}
                              Remind {format(new Date(followUp.reminderDate), 'MMM d')}
                            </span>
                          </div>
                          {followUp.notes && (
                            <p className="text-sm text-muted-foreground mt-2">{followUp.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {followUp.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkReminded(followUp.id)}
                              title="Mark as reminded"
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkCompleted(followUp.id)}
                            title="Mark as completed"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => handleDelete(followUp.id)}
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

          {/* Completed follow-ups */}
          {followUps.filter(f => f.status === 'COMPLETED').length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Completed</h4>
              <div className="space-y-2">
                {followUps
                  .filter(f => f.status === 'COMPLETED')
                  .slice(0, 5)
                  .map((followUp) => (
                    <div
                      key={followUp.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm"
                    >
                      <span className="text-muted-foreground">{followUp.reason}</span>
                      <span className="text-muted-foreground">
                        {format(new Date(followUp.scheduledDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Follow-up Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Follow-up</DialogTitle>
            <DialogDescription>
              Schedule a follow-up appointment for {patientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData({ ...formData, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {FOLLOW_UP_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.reason === 'Other' && (
                <Input
                  className="mt-2"
                  value={formData.customReason}
                  onChange={(e) => setFormData({ ...formData, customReason: e.target.value })}
                  placeholder="Enter reason"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Scheduled Date *</Label>
              <Input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              <div className="flex gap-2 mt-2">
                <Button type="button" size="sm" variant="outline" onClick={() => quickSchedule(7)}>
                  1 Week
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => quickSchedule(14)}>
                  2 Weeks
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => quickSchedule(30)}>
                  1 Month
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => quickSchedule(90)}>
                  3 Months
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Remind Days Before</Label>
                <Select
                  value={formData.reminderDays}
                  onValueChange={(value) => setFormData({ ...formData, reminderDays: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="2">2 days</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reminder Method</Label>
                <Select
                  value={formData.reminderType}
                  onValueChange={(value: 'EMAIL' | 'PHONE' | 'BOTH') => setFormData({ ...formData, reminderType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PHONE">Phone</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="BOTH">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(patientPhone || patientEmail) && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p className="font-medium mb-1">Contact Information:</p>
                {patientPhone && <p className="flex items-center gap-2"><Phone className="h-3 w-3" />{patientPhone}</p>}
                {patientEmail && <p className="flex items-center gap-2"><Mail className="h-3 w-3" />{patientEmail}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFollowUp}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
