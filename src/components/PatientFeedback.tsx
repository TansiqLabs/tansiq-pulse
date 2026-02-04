import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  MessageSquare,
  Plus,
  Search,
  Star,
  ThumbsUp,
  ThumbsDown,
  Filter,
  TrendingUp,
  User,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import { useToast } from '@/components/ui/toast'
import { getInitials } from '@/lib/utils'

interface Feedback {
  id: string
  patientName: string
  patientEmail?: string
  department: string
  doctorName?: string
  visitDate: string
  overallRating: number // 1-5
  categories: {
    waitTime: number
    staffBehavior: number
    cleanliness: number
    treatmentQuality: number
    communication: number
  }
  wouldRecommend: boolean
  comments: string
  response?: string
  respondedAt?: string
  createdAt: string
}

const DEPARTMENTS = [
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Emergency',
  'Outpatient',
  'Inpatient',
  'Surgery',
  'Radiology',
  'Laboratory',
  'Pharmacy',
]

const STORAGE_KEY = 'patient_feedback'

export function PatientFeedback() {
  const toast = useToast()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const [filterRating, setFilterRating] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [responseText, setResponseText] = useState('')

  const [form, setForm] = useState({
    patientName: '',
    patientEmail: '',
    department: '',
    doctorName: '',
    visitDate: format(new Date(), 'yyyy-MM-dd'),
    overallRating: 5,
    waitTime: 5,
    staffBehavior: 5,
    cleanliness: 5,
    treatmentQuality: 5,
    communication: 5,
    wouldRecommend: true,
    comments: '',
  })

  const loadFeedbacks = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setFeedbacks(JSON.parse(stored))
    }
  }, [])

  const saveFeedbacks = (data: Feedback[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setFeedbacks(data)
  }

  useEffect(() => {
    loadFeedbacks()
  }, [loadFeedbacks])

  const resetForm = () => {
    setForm({
      patientName: '',
      patientEmail: '',
      department: '',
      doctorName: '',
      visitDate: format(new Date(), 'yyyy-MM-dd'),
      overallRating: 5,
      waitTime: 5,
      staffBehavior: 5,
      cleanliness: 5,
      treatmentQuality: 5,
      communication: 5,
      wouldRecommend: true,
      comments: '',
    })
  }

  const handleSubmit = () => {
    if (!form.patientName || !form.department) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    const newFeedback: Feedback = {
      id: `FB-${Date.now()}`,
      patientName: form.patientName,
      patientEmail: form.patientEmail,
      department: form.department,
      doctorName: form.doctorName,
      visitDate: form.visitDate,
      overallRating: form.overallRating,
      categories: {
        waitTime: form.waitTime,
        staffBehavior: form.staffBehavior,
        cleanliness: form.cleanliness,
        treatmentQuality: form.treatmentQuality,
        communication: form.communication,
      },
      wouldRecommend: form.wouldRecommend,
      comments: form.comments,
      createdAt: new Date().toISOString(),
    }
    saveFeedbacks([newFeedback, ...feedbacks])
    toast.success('Submitted', 'Feedback recorded successfully')

    setShowAddDialog(false)
    resetForm()
  }

  const handleResponse = () => {
    if (!selectedFeedback || !responseText) return

    const updated = feedbacks.map(f =>
      f.id === selectedFeedback.id
        ? { ...f, response: responseText, respondedAt: new Date().toISOString() }
        : f
    )
    saveFeedbacks(updated)
    toast.success('Responded', 'Response added to feedback')
    setShowResponseDialog(false)
    setSelectedFeedback(null)
    setResponseText('')
  }

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch =
      f.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      f.comments.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment = filterDepartment === 'all' || f.department === filterDepartment
    const matchesRating = filterRating === 'all' || f.overallRating === parseInt(filterRating)
    return matchesSearch && matchesDepartment && matchesRating
  })

  const renderStars = (rating: number, interactive = false, onChange?: (v: number) => void) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`h-4 w-4 ${
                star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  const calculateAverageRating = () => {
    if (feedbacks.length === 0) return 0
    const sum = feedbacks.reduce((acc, f) => acc + f.overallRating, 0)
    return (sum / feedbacks.length).toFixed(1)
  }

  const calculateRecommendPercentage = () => {
    if (feedbacks.length === 0) return 0
    const recommends = feedbacks.filter(f => f.wouldRecommend).length
    return Math.round((recommends / feedbacks.length) * 100)
  }

  const stats = {
    total: feedbacks.length,
    avgRating: calculateAverageRating(),
    recommendPercentage: calculateRecommendPercentage(),
    pending: feedbacks.filter(f => !f.response).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Patient Feedback</h2>
          <p className="text-muted-foreground">
            Collect and manage patient satisfaction surveys
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          New Feedback
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{stats.avgRating}</div>
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Would Recommend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-green-600">{stats.recommendPercentage}%</div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-[150px]">
            <Star className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredFeedbacks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No feedback found</p>
              </CardContent>
            </Card>
          ) : (
            filteredFeedbacks.map((feedback) => (
              <motion.div
                key={feedback.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(feedback.patientName.split(' ')[0], feedback.patientName.split(' ')[1] || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{feedback.patientName}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline">{feedback.department}</Badge>
                              {feedback.doctorName && (
                                <>
                                  <User className="h-3 w-3" />
                                  <span>{feedback.doctorName}</span>
                                </>
                              )}
                              <Calendar className="h-3 w-3 ml-2" />
                              <span>{format(new Date(feedback.visitDate), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {renderStars(feedback.overallRating)}
                          <div className="flex items-center gap-1">
                            {feedback.wouldRecommend ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                Would Recommend
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700">
                                <ThumbsDown className="h-3 w-3 mr-1" />
                                Not Recommended
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Category Ratings */}
                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground mb-1">Wait Time</p>
                          {renderStars(feedback.categories.waitTime)}
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground mb-1">Staff</p>
                          {renderStars(feedback.categories.staffBehavior)}
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground mb-1">Cleanliness</p>
                          {renderStars(feedback.categories.cleanliness)}
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground mb-1">Treatment</p>
                          {renderStars(feedback.categories.treatmentQuality)}
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground mb-1">Communication</p>
                          {renderStars(feedback.categories.communication)}
                        </div>
                      </div>

                      {feedback.comments && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm">{feedback.comments}</p>
                        </div>
                      )}

                      {feedback.response && (
                        <div className="bg-primary/5 rounded-lg p-3 border-l-4 border-primary">
                          <p className="text-xs text-muted-foreground mb-1">Hospital Response</p>
                          <p className="text-sm">{feedback.response}</p>
                          {feedback.respondedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(feedback.respondedAt), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      )}

                      {!feedback.response && (
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedFeedback(feedback)
                              setShowResponseDialog(true)
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Add Response
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Add Feedback Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Patient Feedback</DialogTitle>
            <DialogDescription>
              Record patient satisfaction survey response
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient Name *</Label>
                <Input
                  value={form.patientName}
                  onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  placeholder="Enter patient name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email (optional)</Label>
                <Input
                  type="email"
                  value={form.patientEmail}
                  onChange={(e) => setForm({ ...form, patientEmail: e.target.value })}
                  placeholder="patient@email.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select
                  value={form.department}
                  onValueChange={(v) => setForm({ ...form, department: v })}
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
                <Label>Doctor Name</Label>
                <Input
                  value={form.doctorName}
                  onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                  placeholder="Doctor name (optional)"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Visit Date</Label>
              <Input
                type="date"
                value={form.visitDate}
                onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Overall Rating</Label>
              <div className="flex items-center gap-2">
                {renderStars(form.overallRating, true, (v) => setForm({ ...form, overallRating: v }))}
                <span className="text-sm text-muted-foreground">({form.overallRating}/5)</span>
              </div>
            </div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Category Ratings</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {[
                  { key: 'waitTime', label: 'Wait Time' },
                  { key: 'staffBehavior', label: 'Staff Behavior' },
                  { key: 'cleanliness', label: 'Cleanliness' },
                  { key: 'treatmentQuality', label: 'Treatment Quality' },
                  { key: 'communication', label: 'Communication' },
                ].map(cat => (
                  <div key={cat.key} className="flex items-center justify-between">
                    <Label className="text-sm">{cat.label}</Label>
                    {renderStars(form[cat.key as keyof typeof form] as number, true, (v) =>
                      setForm({ ...form, [cat.key]: v })
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="space-y-2">
              <Label>Would you recommend our hospital?</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant={form.wouldRecommend ? 'default' : 'outline'}
                  onClick={() => setForm({ ...form, wouldRecommend: true })}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Yes
                </Button>
                <Button
                  type="button"
                  variant={!form.wouldRecommend ? 'destructive' : 'outline'}
                  onClick={() => setForm({ ...form, wouldRecommend: false })}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  No
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comments</Label>
              <Textarea
                value={form.comments}
                onChange={(e) => setForm({ ...form, comments: e.target.value })}
                placeholder="Additional comments or suggestions..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Submit Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Response</DialogTitle>
            <DialogDescription>
              Respond to {selectedFeedback?.patientName}'s feedback
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Write your response to the patient's feedback..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>Cancel</Button>
            <Button onClick={handleResponse}>Submit Response</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
