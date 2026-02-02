import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  User,
  Calendar,
  FileText,
  Stethoscope,
  X,
  Command,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import type { Patient, Appointment, Invoice, Doctor } from '@/types'

interface SearchResult {
  type: 'patient' | 'appointment' | 'invoice' | 'doctor'
  id: number
  title: string
  subtitle: string
  href: string
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [open])

  // Search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true)
      try {
        const [patients, appointments, invoices, doctors] = await Promise.all([
          window.electronAPI.patients.getAll(),
          window.electronAPI.appointments.getAll(),
          window.electronAPI.invoices.getAll(),
          window.electronAPI.doctors.getAll(),
        ])

        const searchResults: SearchResult[] = []
        const lowerQuery = query.toLowerCase()

        // Search patients
        patients
          .filter((p: Patient) =>
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(lowerQuery) ||
            p.mrn.toLowerCase().includes(lowerQuery) ||
            p.phone.includes(query)
          )
          .slice(0, 3)
          .forEach((p: Patient) => {
            searchResults.push({
              type: 'patient',
              id: p.id,
              title: `${p.firstName} ${p.lastName}`,
              subtitle: `MRN: ${p.mrn} • ${p.phone}`,
              href: `/patients/${p.id}`,
            })
          })

        // Search doctors
        doctors
          .filter((d: Doctor) =>
            `${d.firstName} ${d.lastName}`.toLowerCase().includes(lowerQuery) ||
            d.specialization.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 2)
          .forEach((d: Doctor) => {
            searchResults.push({
              type: 'doctor',
              id: d.id,
              title: `Dr. ${d.firstName} ${d.lastName}`,
              subtitle: d.specialization,
              href: '/doctors',
            })
          })

        // Search appointments
        appointments
          .filter((a: any) =>
            a.appointmentNo.toLowerCase().includes(lowerQuery) ||
            a.patient?.firstName.toLowerCase().includes(lowerQuery) ||
            a.patient?.lastName.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 2)
          .forEach((a: any) => {
            searchResults.push({
              type: 'appointment',
              id: a.id,
              title: `Appointment ${a.appointmentNo}`,
              subtitle: `${a.patient?.firstName} ${a.patient?.lastName} • ${a.scheduledTime}`,
              href: '/appointments',
            })
          })

        // Search invoices
        invoices
          .filter((i: Invoice) =>
            i.invoiceNumber.toLowerCase().includes(lowerQuery) ||
            i.patient?.firstName?.toLowerCase().includes(lowerQuery) ||
            i.patient?.lastName?.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 2)
          .forEach((i: Invoice) => {
            searchResults.push({
              type: 'invoice',
              id: i.id,
              title: i.invoiceNumber,
              subtitle: `${i.patient?.firstName} ${i.patient?.lastName} • $${i.totalAmount.toFixed(2)}`,
              href: '/billing',
            })
          })

        setResults(searchResults)
        setSelectedIndex(0)
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : i))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => (i > 0 ? i - 1 : i))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      navigate(results[selectedIndex].href)
      setOpen(false)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'patient':
        return <User className="h-4 w-4 text-blue-500" />
      case 'appointment':
        return <Calendar className="h-4 w-4 text-emerald-500" />
      case 'invoice':
        return <FileText className="h-4 w-4 text-amber-500" />
      case 'doctor':
        return <Stethoscope className="h-4 w-4 text-violet-500" />
    }
  }

  return (
    <>
      {/* Search Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg border transition-colors w-full max-w-sm"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-lg overflow-hidden">
          <div className="flex items-center border-b px-4">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search patients, appointments, invoices..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {loading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No results found for "{query}"</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="py-2">
                <AnimatePresence>
                  {results.map((result, index) => (
                    <motion.button
                      key={`${result.type}-${result.id}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        navigate(result.href)
                        setOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors ${
                        selectedIndex === index ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-muted">
                        {getIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {result.type}
                      </span>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {!query && (
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">Start typing to search...</p>
                <p className="text-xs mt-2">
                  Search for patients, doctors, appointments, or invoices
                </p>
              </div>
            )}
          </div>

          <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded border bg-muted">↑↓</kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded border bg-muted">Enter</kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded border bg-muted">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
