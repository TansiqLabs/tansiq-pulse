import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  Clock,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'

interface MedicalNote {
  id: string
  patientId: number
  type: 'consultation' | 'diagnosis' | 'prescription' | 'lab_result' | 'follow_up' | 'general'
  title: string
  content: string
  doctorName?: string
  createdAt: string
  updatedAt: string
}

interface MedicalNotesProps {
  patientId: number
  patientName: string
}

const noteTypes = [
  { value: 'consultation', label: 'Consultation', color: 'bg-blue-100 text-blue-700' },
  { value: 'diagnosis', label: 'Diagnosis', color: 'bg-red-100 text-red-700' },
  { value: 'prescription', label: 'Prescription', color: 'bg-green-100 text-green-700' },
  { value: 'lab_result', label: 'Lab Result', color: 'bg-purple-100 text-purple-700' },
  { value: 'follow_up', label: 'Follow-up', color: 'bg-orange-100 text-orange-700' },
  { value: 'general', label: 'General Note', color: 'bg-gray-100 text-gray-700' },
]

export function MedicalNotes({ patientId, patientName }: MedicalNotesProps) {
  const [notes, setNotes] = useState<MedicalNote[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<MedicalNote | null>(null)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  // Form state
  const [noteType, setNoteType] = useState<string>('consultation')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [doctorName, setDoctorName] = useState('')

  useEffect(() => {
    loadNotes()
  }, [patientId])

  const loadNotes = async () => {
    setLoading(true)
    // In a real app, this would call the API
    // For now, we'll use localStorage as a simple store
    try {
      const storedNotes = localStorage.getItem(`medical_notes_${patientId}`)
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes))
      }
    } catch (error) {
      console.error('Failed to load notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveNotes = (updatedNotes: MedicalNote[]) => {
    localStorage.setItem(`medical_notes_${patientId}`, JSON.stringify(updatedNotes))
    setNotes(updatedNotes)
  }

  const openCreateDialog = () => {
    setEditingNote(null)
    setNoteType('consultation')
    setTitle('')
    setContent('')
    setDoctorName('')
    setIsDialogOpen(true)
  }

  const openEditDialog = (note: MedicalNote) => {
    setEditingNote(note)
    setNoteType(note.type)
    setTitle(note.title)
    setContent(note.content)
    setDoctorName(note.doctorName || '')
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    setSaving(true)
    const now = new Date().toISOString()

    if (editingNote) {
      const updatedNotes = notes.map(note =>
        note.id === editingNote.id
          ? { ...note, type: noteType as MedicalNote['type'], title, content, doctorName, updatedAt: now }
          : note
      )
      saveNotes(updatedNotes)
      toast.success('Note Updated', 'Medical note has been updated.')
    } else {
      const newNote: MedicalNote = {
        id: Math.random().toString(36).substring(7),
        patientId,
        type: noteType as MedicalNote['type'],
        title,
        content,
        doctorName,
        createdAt: now,
        updatedAt: now,
      }
      saveNotes([newNote, ...notes])
      toast.success('Note Added', 'Medical note has been added.')
    }

    setIsDialogOpen(false)
    setSaving(false)
  }

  const handleDelete = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId)
    saveNotes(updatedNotes)
    toast.success('Note Deleted', 'Medical note has been removed.')
  }

  const getTypeConfig = (type: string) => {
    return noteTypes.find(t => t.value === type) || noteTypes[5]
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Medical Notes
            </CardTitle>
            <CardDescription>
              Clinical notes and records for {patientName}
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No medical notes yet</p>
            <p className="text-sm">Click "Add Note" to create the first note</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {notes.map((note) => {
                const typeConfig = getTypeConfig(note.type)
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                        <h4 className="font-medium">{note.title}</h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(note)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(note.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {note.doctorName && (
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" />
                          Dr. {note.doctorName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? 'Edit Medical Note' : 'Add Medical Note'}
            </DialogTitle>
            <DialogDescription>
              {editingNote ? 'Update the medical note details' : 'Create a new medical note for this patient'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Note Type</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {noteTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief title for this note"
              />
            </div>

            <div className="space-y-2">
              <Label>Doctor Name</Label>
              <Input
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Attending doctor's name"
              />
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Detailed notes, observations, or instructions..."
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingNote ? 'Update Note' : 'Add Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
