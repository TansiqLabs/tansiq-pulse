import { useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  Download,
  Upload,
  Database,
  FileJson,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'

interface BackupData {
  version: string
  createdAt: string
  data: {
    patients: any[]
    doctors: any[]
    appointments: any[]
    services: any[]
    invoices: any[]
    settings: any[]
  }
}

export function DataBackup() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showConfirmImport, setShowConfirmImport] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleExport = async () => {
    setExporting(true)
    setProgress(0)
    setResult(null)

    try {
      setProgress(10)
      const [patients, doctors, appointments, services, invoices, settings] = await Promise.all([
        window.electronAPI.patients.getAll(),
        window.electronAPI.doctors.getAll(),
        window.electronAPI.appointments.getAll(),
        window.electronAPI.services.getAll(),
        window.electronAPI.invoices.getAll(),
        window.electronAPI.settings.getAll(),
      ])

      setProgress(50)

      const backup: BackupData = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        data: {
          patients,
          doctors,
          appointments,
          services,
          invoices,
          settings,
        },
      }

      setProgress(80)

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tansiq-pulse-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`
      link.click()
      URL.revokeObjectURL(url)

      setProgress(100)
      setResult({ success: true, message: 'Backup exported successfully!' })
    } catch (error) {
      console.error('Export failed:', error)
      setResult({ success: false, message: 'Failed to export backup. Please try again.' })
    } finally {
      setExporting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setShowConfirmImport(true)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    setShowConfirmImport(false)
    setImporting(true)
    setProgress(0)
    setResult(null)

    try {
      const text = await selectedFile.text()
      const backup: BackupData = JSON.parse(text)

      setProgress(20)

      // Validate backup structure
      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup file format')
      }

      setProgress(40)

      // Note: In a real implementation, you would have an import API
      // For now, we'll just validate the file
      const counts = {
        patients: backup.data.patients?.length || 0,
        doctors: backup.data.doctors?.length || 0,
        appointments: backup.data.appointments?.length || 0,
        services: backup.data.services?.length || 0,
        invoices: backup.data.invoices?.length || 0,
      }

      setProgress(100)
      setResult({
        success: true,
        message: `Backup validated! Contains: ${counts.patients} patients, ${counts.doctors} doctors, ${counts.appointments} appointments, ${counts.services} services, ${counts.invoices} invoices.`,
      })
    } catch (error) {
      console.error('Import failed:', error)
      setResult({ success: false, message: 'Failed to import backup. Invalid file format.' })
    } finally {
      setImporting(false)
      setSelectedFile(null)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-semibold mb-2">Data Backup & Restore</h2>
        <p className="text-sm text-muted-foreground">
          Export your data for backup or import from a previous backup
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Download className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Export Backup</CardTitle>
                  <CardDescription>Download all your data as JSON</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Database className="h-5 w-5 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Includes all data:</p>
                  <p className="text-muted-foreground">
                    Patients, Doctors, Appointments, Services, Invoices, Settings
                  </p>
                </div>
              </div>

              {exporting && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-xs text-muted-foreground text-center">
                    Exporting... {progress}%
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleExport}
                disabled={exporting || importing}
              >
                <Download className="mr-2 h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export Backup'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Import Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Upload className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Import Backup</CardTitle>
                  <CardDescription>Restore from a backup file</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Caution</p>
                  <p className="text-amber-700">
                    Importing will validate the backup file structure
                  </p>
                </div>
              </div>

              {importing && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-xs text-muted-foreground text-center">
                    Validating... {progress}%
                  </p>
                </div>
              )}

              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  disabled={exporting || importing}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={exporting || importing}
                  asChild
                >
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {importing ? 'Validating...' : 'Select Backup File'}
                  </span>
                </Button>
              </label>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Result Message */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={result.success ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
            <CardContent className="flex items-start gap-3 pt-6">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <p className={`text-sm ${result.success ? 'text-emerald-800' : 'text-red-800'}`}>
                {result.message}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Confirm Import Dialog */}
      <Dialog open={showConfirmImport} onOpenChange={setShowConfirmImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Import</DialogTitle>
            <DialogDescription>
              Are you sure you want to validate this backup file?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <FileJson className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">{selectedFile?.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedFile && (selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmImport(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport}>
              Validate & Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
