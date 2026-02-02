import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  ArrowDownCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface UpdateInfo {
  version: string
  releaseDate: string
  releaseNotes?: string
}

interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

type UpdateStatus = 
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export function AutoUpdater() {
  const [status, setStatus] = useState<UpdateStatus>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [progress, setProgress] = useState<UpdateProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    // Listen for update events from main process
    const handleUpdateAvailable = (_event: any, info: UpdateInfo) => {
      setUpdateInfo(info)
      setStatus('available')
      setShowNotification(true)
    }

    const handleUpdateNotAvailable = () => {
      setStatus('not-available')
    }

    const handleDownloadProgress = (_event: any, progressInfo: UpdateProgress) => {
      setProgress(progressInfo)
      setStatus('downloading')
    }

    const handleUpdateDownloaded = (_event: any, info: UpdateInfo) => {
      setUpdateInfo(info)
      setStatus('downloaded')
      setShowDialog(true)
    }

    const handleUpdateError = (_event: any, errorMessage: string) => {
      setError(errorMessage)
      setStatus('error')
    }

    // Register listeners if electronAPI has updater methods
    if (window.electronAPI?.updater) {
      window.electronAPI.updater.onUpdateAvailable(handleUpdateAvailable)
      window.electronAPI.updater.onUpdateNotAvailable(handleUpdateNotAvailable)
      window.electronAPI.updater.onDownloadProgress(handleDownloadProgress)
      window.electronAPI.updater.onUpdateDownloaded(handleUpdateDownloaded)
      window.electronAPI.updater.onUpdateError(handleUpdateError)
    }

    return () => {
      // Cleanup listeners if needed
    }
  }, [])

  const checkForUpdates = async () => {
    if (!window.electronAPI?.updater) {
      setError('Auto-update not available in development mode')
      setStatus('error')
      return
    }
    
    setStatus('checking')
    setError(null)
    try {
      await window.electronAPI.updater.checkForUpdates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check for updates')
      setStatus('error')
    }
  }

  const downloadUpdate = async () => {
    if (!window.electronAPI?.updater) return
    setStatus('downloading')
    try {
      await window.electronAPI.updater.downloadUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download update')
      setStatus('error')
    }
  }

  const installUpdate = () => {
    if (!window.electronAPI?.updater) return
    window.electronAPI.updater.installUpdate()
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <>
      {/* Update Status Card */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Software Updates</h4>
            <p className="text-sm text-muted-foreground">
              {status === 'idle' && 'Check for available updates'}
              {status === 'checking' && 'Checking for updates...'}
              {status === 'not-available' && 'You are running the latest version'}
              {status === 'available' && `Version ${updateInfo?.version} is available`}
              {status === 'downloading' && `Downloading update... ${progress?.percent.toFixed(0)}%`}
              {status === 'downloaded' && 'Update downloaded and ready to install'}
              {status === 'error' && error}
            </p>
          </div>
          <div className="flex gap-2">
            {(status === 'idle' || status === 'not-available' || status === 'error') && (
              <Button
                variant="outline"
                size="sm"
                onClick={checkForUpdates}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Check for Updates
              </Button>
            )}
            {status === 'checking' && (
              <Button
                variant="outline"
                size="sm"
                disabled
              >
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </Button>
            )}
            {status === 'available' && (
              <Button size="sm" onClick={downloadUpdate}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
            {status === 'downloaded' && (
              <Button size="sm" onClick={() => setShowDialog(true)}>
                <ArrowDownCircle className="mr-2 h-4 w-4" />
                Install Now
              </Button>
            )}
          </div>
        </div>

        {/* Download Progress */}
        {status === 'downloading' && progress && (
          <div className="space-y-2">
            <Progress value={progress.percent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatBytes(progress.transferred)} / {formatBytes(progress.total)}</span>
              <span>{formatBytes(progress.bytesPerSecond)}/s</span>
            </div>
          </div>
        )}

        {/* Status Icon */}
        <div className="flex items-center gap-2 text-sm">
          {status === 'not-available' && (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Up to date</span>
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-destructive">Update check failed</span>
            </>
          )}
        </div>
      </div>

      {/* Update Notification Toast */}
      <AnimatePresence>
        {showNotification && status === 'available' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div className="bg-background border rounded-lg shadow-lg p-4 max-w-sm">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Update Available</p>
                  <p className="text-sm text-muted-foreground">
                    Version {updateInfo?.version} is ready to download.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => { downloadUpdate(); setShowNotification(false) }}>
                      Download
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowNotification(false)}>
                      Later
                    </Button>
                  </div>
                </div>
                <button onClick={() => setShowNotification(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install Update Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Ready to Install</DialogTitle>
            <DialogDescription>
              Version {updateInfo?.version} has been downloaded and is ready to install.
              The application will restart to complete the update.
            </DialogDescription>
          </DialogHeader>
          {updateInfo?.releaseNotes && (
            <div className="bg-muted rounded-lg p-4 text-sm max-h-40 overflow-y-auto">
              <p className="font-medium mb-2">What's New:</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{updateInfo.releaseNotes}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Later
            </Button>
            <Button onClick={installUpdate}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Restart and Install
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
