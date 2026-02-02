import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ExternalLink,
  Heart,
  Github,
  Globe,
  Mail,
  Shield,
  Cpu,
  Database,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

interface AboutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const appVersion = '1.0.0'
  const buildDate = 'February 2026'
  
  const openLink = (url: string) => {
    window.electronAPI?.shell?.openExternal(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">About Tansiq Pulse</DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-4">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto"
          >
            <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">TP</span>
            </div>
          </motion.div>

          {/* App Name & Version */}
          <div>
            <h2 className="text-2xl font-bold">Tansiq Pulse</h2>
            <p className="text-muted-foreground">Hospital Management System</p>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>Version {appVersion}</span>
            <span>•</span>
            <span>Build {buildDate}</span>
          </div>

          <Separator />

          {/* Description */}
          <p className="text-sm text-muted-foreground px-4">
            A modern, offline-first hospital management system designed for 
            simplicity, reliability, and data privacy. All your data stays 
            securely on your device.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 py-2">
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Shield className="h-5 w-5" />
              <span className="text-xs">Secure</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Database className="h-5 w-5" />
              <span className="text-xs">Offline</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Cpu className="h-5 w-5" />
              <span className="text-xs">Fast</span>
            </div>
          </div>

          <Separator />

          {/* Links */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => openLink('https://tansiqlabs.com')}
            >
              <Globe className="mr-2 h-4 w-4" />
              Visit Tansiq Labs
              <ExternalLink className="ml-auto h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => openLink('https://github.com/TansiqLabs/tansiq-pulse')}
            >
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
              <ExternalLink className="ml-auto h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => openLink('mailto:support@tansiqlabs.com')}
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
              <ExternalLink className="ml-auto h-4 w-4" />
            </Button>
          </div>

          <Separator />

          {/* Copyright */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p className="flex items-center justify-center gap-1">
              Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> by
            </p>
            <p className="font-semibold">Tansiq Labs</p>
            <p className="text-xs">© 2026 Tansiq Labs. All rights reserved.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Compact About Card for Settings page
export function AboutCard() {
  const [showDialog, setShowDialog] = useState(false)
  const appVersion = '1.0.0'

  const openLink = (url: string) => {
    window.electronAPI?.shell?.openExternal(url)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Branding */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
            <span className="text-2xl font-bold text-white">TP</span>
          </div>
          <div>
            <h3 className="text-xl font-bold">Tansiq Pulse</h3>
            <p className="text-sm text-muted-foreground">Version {appVersion}</p>
            <p className="text-xs text-muted-foreground">Build: February 2026</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          Tansiq Pulse is a modern, offline-first hospital management system 
          designed for simplicity and reliability. All data is stored locally 
          on your device, ensuring complete privacy and data ownership.
        </p>

        {/* Links */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openLink('https://tansiqlabs.com')}
          >
            <Globe className="mr-2 h-4 w-4" />
            Website
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openLink('https://github.com/TansiqLabs/tansiq-pulse')}
          >
            <Github className="mr-2 h-4 w-4" />
            GitHub
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDialog(true)}
          >
            More Info
          </Button>
        </div>

        {/* Copyright */}
        <p className="text-xs text-muted-foreground">
          © 2026 Tansiq Labs. All rights reserved.
        </p>
      </div>

      <AboutDialog open={showDialog} onOpenChange={setShowDialog} />
    </>
  )
}
