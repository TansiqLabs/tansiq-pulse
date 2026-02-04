import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  FileText,
  Search,
  Download,
  Trash2,
  Eye,
  Upload,
  FolderOpen,
  File,
  FileImage,
  FileSpreadsheet,
  Filter,
  MoreVertical,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'

interface Document {
  id: string
  name: string
  type: 'PDF' | 'IMAGE' | 'SPREADSHEET' | 'TEXT' | 'OTHER'
  category: string
  size: number
  uploadedBy: string
  uploadedAt: string
  patientId?: number
  patientName?: string
  description?: string
  tags: string[]
}

const CATEGORIES = [
  'Medical Records',
  'Lab Reports',
  'X-Ray/Imaging',
  'Prescriptions',
  'Insurance Documents',
  'Consent Forms',
  'Referral Letters',
  'Discharge Summaries',
  'Bills & Invoices',
  'Staff Documents',
  'Policies',
  'Other',
]

export function DocumentManager() {
  const toast = useToast()
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: '',
    description: '',
    patientName: '',
    tags: '',
  })

  const loadDocuments = useCallback(() => {
    const stored = localStorage.getItem('hospital_documents')
    if (stored) {
      setDocuments(JSON.parse(stored))
    } else {
      // Sample documents
      const sampleDocs: Document[] = [
        {
          id: '1',
          name: 'Patient_001_MRI_Report.pdf',
          type: 'PDF',
          category: 'X-Ray/Imaging',
          size: 2456000,
          uploadedBy: 'Dr. Smith',
          uploadedAt: new Date().toISOString(),
          patientName: 'John Doe',
          description: 'MRI scan of lumbar spine',
          tags: ['MRI', 'spine', 'imaging'],
        },
        {
          id: '2',
          name: 'Lab_Results_Blood_Work.pdf',
          type: 'PDF',
          category: 'Lab Reports',
          size: 156000,
          uploadedBy: 'Lab Tech',
          uploadedAt: new Date(Date.now() - 86400000).toISOString(),
          patientName: 'Jane Smith',
          description: 'Complete blood count results',
          tags: ['lab', 'blood', 'CBC'],
        },
        {
          id: '3',
          name: 'Insurance_Claim_Form.pdf',
          type: 'PDF',
          category: 'Insurance Documents',
          size: 89000,
          uploadedBy: 'Admin',
          uploadedAt: new Date(Date.now() - 172800000).toISOString(),
          description: 'Insurance claim submission form',
          tags: ['insurance', 'claim'],
        },
      ]
      setDocuments(sampleDocs)
      localStorage.setItem('hospital_documents', JSON.stringify(sampleDocs))
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const saveDocuments = (newDocs: Document[]) => {
    localStorage.setItem('hospital_documents', JSON.stringify(newDocs))
    setDocuments(newDocs)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (type: Document['type']) => {
    switch (type) {
      case 'PDF': return <FileText className="h-8 w-8 text-red-500" />
      case 'IMAGE': return <FileImage className="h-8 w-8 text-blue-500" />
      case 'SPREADSHEET': return <FileSpreadsheet className="h-8 w-8 text-green-500" />
      default: return <File className="h-8 w-8 text-gray-500" />
    }
  }

  const handleUpload = () => {
    if (!uploadForm.name || !uploadForm.category) {
      toast.error('Error', 'Please fill in document name and category')
      return
    }

    const newDoc: Document = {
      id: crypto.randomUUID(),
      name: uploadForm.name,
      type: uploadForm.name.toLowerCase().endsWith('.pdf') ? 'PDF' :
            uploadForm.name.match(/\.(jpg|jpeg|png|gif)$/i) ? 'IMAGE' :
            uploadForm.name.match(/\.(xlsx|xls|csv)$/i) ? 'SPREADSHEET' : 'OTHER',
      category: uploadForm.category,
      size: Math.floor(Math.random() * 5000000) + 10000,
      uploadedBy: 'Current User',
      uploadedAt: new Date().toISOString(),
      patientName: uploadForm.patientName || undefined,
      description: uploadForm.description || undefined,
      tags: uploadForm.tags ? uploadForm.tags.split(',').map(t => t.trim()) : [],
    }

    saveDocuments([newDoc, ...documents])
    toast.success('Uploaded', 'Document uploaded successfully')
    setShowUploadDialog(false)
    setUploadForm({ name: '', category: '', description: '', patientName: '', tags: '' })
  }

  const handleDelete = (id: string) => {
    const updated = documents.filter(d => d.id !== id)
    saveDocuments(updated)
    toast.success('Deleted', 'Document removed')
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const stats = {
    total: documents.length,
    totalSize: documents.reduce((sum, d) => sum + d.size, 0),
    byCategory: CATEGORIES.reduce((acc, cat) => {
      acc[cat] = documents.filter(d => d.category === cat).length
      return acc
    }, {} as Record<string, number>),
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.values(stats.byCategory).filter(v => v > 0).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Documents Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {filteredDocuments.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getFileIcon(doc.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                        <p className="text-xs text-muted-foreground">{formatFileSize(doc.size)}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedDocument(doc)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 space-y-2">
                    <Badge variant="outline" className="text-xs">
                      {doc.category}
                    </Badge>
                    {doc.patientName && (
                      <p className="text-xs text-muted-foreground">
                        Patient: {doc.patientName}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                    </p>
                    {doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No documents found</p>
            <Button variant="link" onClick={() => setShowUploadDialog(true)}>
              Upload your first document
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Add a new document to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Document Name *</Label>
              <Input
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                placeholder="e.g., Patient_Report.pdf"
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={uploadForm.category}
                onValueChange={(value) => setUploadForm({ ...uploadForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Patient Name (optional)</Label>
              <Input
                value={uploadForm.patientName}
                onChange={(e) => setUploadForm({ ...uploadForm, patientName: e.target.value })}
                placeholder="Link to a patient"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder="Brief description..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={uploadForm.tags}
                onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                placeholder="e.g., urgent, lab, report"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                {getFileIcon(selectedDocument.type)}
                <div>
                  <h4 className="font-medium">{selectedDocument.name}</h4>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedDocument.size)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedDocument.category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedDocument.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Uploaded By</p>
                  <p className="font-medium">{selectedDocument.uploadedBy}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Upload Date</p>
                  <p className="font-medium">{format(new Date(selectedDocument.uploadedAt), 'MMM d, yyyy')}</p>
                </div>
              </div>
              {selectedDocument.patientName && (
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-medium">{selectedDocument.patientName}</p>
                </div>
              )}
              {selectedDocument.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p>{selectedDocument.description}</p>
                </div>
              )}
              {selectedDocument.tags.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedDocument.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDocument(null)}>
              Close
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
