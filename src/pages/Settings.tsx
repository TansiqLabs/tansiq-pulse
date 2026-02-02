import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Settings as SettingsIcon,
  Building2,
  DollarSign,
  Save,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { DataBackup } from '@/components/DataBackup'

const settingsSchema = z.object({
  hospital_name: z.string().min(1, 'Hospital name is required'),
  hospital_address: z.string().optional(),
  hospital_phone: z.string().optional(),
  hospital_email: z.string().email().optional().or(z.literal('')),
  tax_rate: z.number().min(0).max(1),
  currency: z.string().min(1),
  currency_symbol: z.string().min(1),
  default_consultation_minutes: z.number().min(5).max(120),
})

type SettingsForm = z.infer<typeof settingsSchema>

export function Settings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const settings = await window.electronAPI.settings.get()
      reset({
        hospital_name: settings.hospital_name || '',
        hospital_address: settings.hospital_address || '',
        hospital_phone: settings.hospital_phone || '',
        hospital_email: settings.hospital_email || '',
        tax_rate: settings.tax_rate || 0.05,
        currency: settings.currency || 'USD',
        currency_symbol: settings.currency_symbol || '$',
        default_consultation_minutes: settings.default_consultation_minutes || 15,
      })
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: SettingsForm) => {
    setSaving(true)
    setSaved(false)
    try {
      for (const [key, value] of Object.entries(data)) {
        await window.electronAPI.settings.update(key, value)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          Settings
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground"
        >
          Manage your hospital configuration
        </motion.p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Hospital Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Hospital Information
              </CardTitle>
              <CardDescription>
                Basic information about your hospital
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hospital_name">Hospital Name *</Label>
                <Input id="hospital_name" {...register('hospital_name')} />
                {errors.hospital_name && (
                  <p className="text-sm text-destructive">{errors.hospital_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospital_address">Address</Label>
                <Input id="hospital_address" {...register('hospital_address')} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hospital_phone">Phone</Label>
                  <Input id="hospital_phone" {...register('hospital_phone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospital_email">Email</Label>
                  <Input id="hospital_email" type="email" {...register('hospital_email')} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Billing Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Billing Settings
              </CardTitle>
              <CardDescription>
                Configure billing and tax settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" {...register('currency')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency_symbol">Currency Symbol</Label>
                  <Input id="currency_symbol" {...register('currency_symbol')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    {...register('tax_rate', {
                      valueAsNumber: true,
                      setValueAs: (v) => parseFloat(v) / 100,
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter as percentage (e.g., 5 for 5%)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Appointment Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Appointment Settings
              </CardTitle>
              <CardDescription>
                Configure default appointment settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="default_consultation_minutes">
                  Default Consultation Duration (minutes)
                </Label>
                <Input
                  id="default_consultation_minutes"
                  type="number"
                  min={5}
                  max={120}
                  {...register('default_consultation_minutes', { valueAsNumber: true })}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-4"
        >
          <Button type="submit" disabled={saving || !isDirty}>
            {saving ? (
              'Saving...'
            ) : saved ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-green-600"
            >
              Settings saved successfully!
            </motion.span>
          )}
        </motion.div>
      </form>

      {/* About Section */}
      <Separator />
      
      {/* Data Backup Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardContent className="pt-6">
            <DataBackup />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>About Tansiq Pulse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Version:</strong> 1.0.0
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Build:</strong> February 2026
            </p>
            <p className="text-sm text-muted-foreground">
              Tansiq Pulse is an offline hospital management system designed for 
              simplicity and reliability. All data is stored locally on your device.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              © 2026 TansiqLabs. All rights reserved.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
