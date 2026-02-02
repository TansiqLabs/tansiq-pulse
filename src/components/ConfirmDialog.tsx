import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  variant?: ConfirmVariant
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

const variantConfig: Record<ConfirmVariant, {
  icon: React.ComponentType<{ className?: string }>
  iconClass: string
  confirmClass: string
}> = {
  danger: {
    icon: XCircle,
    iconClass: 'text-destructive',
    confirmClass: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-orange-500',
    confirmClass: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    confirmClass: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  success: {
    icon: CheckCircle,
    iconClass: 'text-green-500',
    confirmClass: 'bg-green-500 hover:bg-green-600 text-white',
  },
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = 'danger',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)
  const config = variantConfig[variant]
  const Icon = config.icon

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error('Confirm action failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full bg-muted`}>
              <Icon className={`h-6 w-6 ${config.iconClass}`} />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button 
            className={config.confirmClass} 
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easily creating confirm dialogs
interface UseConfirmOptions {
  title: string
  description: string
  variant?: ConfirmVariant
  confirmText?: string
  cancelText?: string
}

export function useConfirm() {
  const [dialogState, setDialogState] = useState<{
    open: boolean
    options: UseConfirmOptions | null
    resolve: ((value: boolean) => void) | null
  }>({
    open: false,
    options: null,
    resolve: null,
  })

  const confirm = (options: UseConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        options,
        resolve,
      })
    })
  }

  const handleConfirm = () => {
    dialogState.resolve?.(true)
    setDialogState({ open: false, options: null, resolve: null })
  }

  const handleCancel = () => {
    dialogState.resolve?.(false)
    setDialogState({ open: false, options: null, resolve: null })
  }

  const ConfirmDialogComponent = () => {
    if (!dialogState.options) return null
    
    return (
      <ConfirmDialog
        open={dialogState.open}
        onOpenChange={(open) => {
          if (!open) handleCancel()
        }}
        title={dialogState.options.title}
        description={dialogState.options.description}
        variant={dialogState.options.variant}
        confirmText={dialogState.options.confirmText}
        cancelText={dialogState.options.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    )
  }

  return { confirm, ConfirmDialog: ConfirmDialogComponent }
}
