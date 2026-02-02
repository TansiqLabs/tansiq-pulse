import { useState, useEffect } from 'react'
import { Keyboard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ShortcutCategory {
  name: string
  shortcuts: {
    keys: string[]
    description: string
  }[]
}

const shortcutCategories: ShortcutCategory[] = [
  {
    name: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open global search' },
      { keys: ['⌘', '1'], description: 'Go to Dashboard' },
      { keys: ['⌘', '2'], description: 'Go to Patients' },
      { keys: ['⌘', '3'], description: 'Go to Appointments' },
      { keys: ['⌘', '4'], description: 'Go to Doctors' },
      { keys: ['⌘', '5'], description: 'Go to Queue' },
      { keys: ['⌘', '6'], description: 'Go to Billing' },
    ],
  },
  {
    name: 'Actions',
    shortcuts: [
      { keys: ['⌘', 'N'], description: 'Create new item' },
      { keys: ['⌘', 'S'], description: 'Save current form' },
      { keys: ['Escape'], description: 'Close dialog/modal' },
      { keys: ['⌘', ','], description: 'Open settings' },
    ],
  },
  {
    name: 'General',
    shortcuts: [
      { keys: ['⌘', '?'], description: 'Show keyboard shortcuts' },
      { keys: ['⌘', 'R'], description: 'Reload application' },
      { keys: ['⌘', 'Q'], description: 'Quit application' },
    ],
  },
]

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const formatKey = (key: string) => {
    if (!isMac) {
      return key.replace('⌘', 'Ctrl')
    }
    return key
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {shortcutCategories.map((category) => (
            <div key={category.name}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {category.name}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border">
                            {formatKey(key)}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">{isMac ? '⌘' : 'Ctrl'}</kbd> + <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">?</kbd> anytime to show this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook to register global keyboard shortcuts
export function useKeyboardShortcuts() {
  const [showShortcuts, setShowShortcuts] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey

      // Show keyboard shortcuts: Cmd/Ctrl + ?
      if (modifier && e.key === '?') {
        e.preventDefault()
        setShowShortcuts(true)
        return
      }

      // Navigation shortcuts
      if (modifier && !e.shiftKey) {
        switch (e.key) {
          case '1':
            e.preventDefault()
            window.location.href = '/'
            break
          case '2':
            e.preventDefault()
            window.location.href = '/patients'
            break
          case '3':
            e.preventDefault()
            window.location.href = '/appointments'
            break
          case '4':
            e.preventDefault()
            window.location.href = '/doctors'
            break
          case '5':
            e.preventDefault()
            window.location.href = '/queue'
            break
          case '6':
            e.preventDefault()
            window.location.href = '/billing'
            break
          case ',':
            e.preventDefault()
            window.location.href = '/settings'
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    showShortcuts,
    setShowShortcuts,
  }
}
