import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, X, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'

interface PatientPhotoProps {
  patientId: number
  firstName: string
  lastName: string
  currentPhoto?: string
  onPhotoChange?: (photoData: string | null) => void
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
  xl: 'h-32 w-32',
}

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-xl',
  xl: 'text-2xl',
}

// Helper function to get initials from first and last name
function getPatientInitials(firstName: string, lastName: string): string {
  const first = firstName?.charAt(0) || ''
  const last = lastName?.charAt(0) || ''
  return `${first}${last}`.toUpperCase() || '?'
}

export function PatientPhoto({
  patientId,
  firstName,
  lastName,
  currentPhoto,
  onPhotoChange,
  size = 'md',
}: PatientPhotoProps) {
  const fullName = `${firstName} ${lastName}`
  const [photo, setPhoto] = useState<string | null>(currentPhoto || null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid File', 'Please select an image file (JPG, PNG, GIF)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', 'Please select an image smaller than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [toast])

  const handleUpload = async () => {
    if (!previewUrl) return

    setUploading(true)
    try {
      // Resize and compress the image before saving
      const resizedImage = await resizeImage(previewUrl, 200, 200)
      
      // Save to localStorage (in a real app, this would upload to a server)
      localStorage.setItem(`patient_photo_${patientId}`, resizedImage)
      
      setPhoto(resizedImage)
      onPhotoChange?.(resizedImage)
      setIsDialogOpen(false)
      setPreviewUrl(null)
      toast.success('Photo Updated', 'Patient photo has been saved.')
    } catch (error) {
      console.error('Failed to upload photo:', error)
      toast.error('Upload Failed', 'Failed to save photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    localStorage.removeItem(`patient_photo_${patientId}`)
    setPhoto(null)
    onPhotoChange?.(null)
    setIsDialogOpen(false)
    toast.success('Photo Removed', 'Patient photo has been removed.')
  }

  const openDialog = () => {
    setPreviewUrl(null)
    setIsDialogOpen(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Load photo from localStorage on mount
  useState(() => {
    const savedPhoto = localStorage.getItem(`patient_photo_${patientId}`)
    if (savedPhoto) {
      setPhoto(savedPhoto)
    }
  })

  return (
    <>
      <div className="relative group cursor-pointer" onClick={openDialog}>
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={photo || undefined} alt={fullName} />
          <AvatarFallback className={textSizeClasses[size]}>
            {firstName || lastName ? getPatientInitials(firstName, lastName) : <User className="h-1/2 w-1/2" />}
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-1/3 w-1/3 text-white" />
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Patient Photo</DialogTitle>
            <DialogDescription>
              Upload or change the photo for {fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            <AnimatePresence mode="wait">
              {previewUrl ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative"
                >
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-40 w-40 rounded-full object-cover border-4 border-primary/20"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                    onClick={() => setPreviewUrl(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center"
                >
                  <Avatar className="h-40 w-40 mb-4">
                    <AvatarImage src={photo || undefined} alt={fullName} />
                    <AvatarFallback className="text-4xl">
                      {firstName || lastName ? getPatientInitials(firstName, lastName) : <User className="h-20 w-20" />}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Image
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            {photo && !previewUrl && (
              <Button variant="destructive" onClick={handleRemove}>
                Remove Photo
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            {previewUrl && (
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Photo'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Utility function to resize image
async function resizeImage(
  dataUrl: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Draw circular mask
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      ctx.drawImage(img, 0, 0, width, height)

      // Convert to JPEG for smaller file size
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}
