import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { ErrorBoundary, PageErrorBoundary } from '@/components/ErrorBoundary'
import { KeyboardShortcutsDialog, useKeyboardShortcuts } from '@/components/KeyboardShortcuts'
import {
  Dashboard,
  Patients,
  Appointments,
  Billing,
  Doctors,
  Settings,
  Reports,
  Queue,
  Services,
  PatientProfile,
  Schedule,
  Expenses,
  Analytics,
  Staff,
  Inventory,
  Beds,
  Notifications,
  Shifts,
  Documents,
  Waitlist,
  Claims,
} from '@/pages'

function AppContent() {
  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts()

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<PageErrorBoundary><Dashboard /></PageErrorBoundary>} />
          <Route path="/patients" element={<PageErrorBoundary><Patients /></PageErrorBoundary>} />
          <Route path="/patients/:id" element={<PageErrorBoundary><PatientProfile /></PageErrorBoundary>} />
          <Route path="/appointments" element={<PageErrorBoundary><Appointments /></PageErrorBoundary>} />
          <Route path="/schedule" element={<PageErrorBoundary><Schedule /></PageErrorBoundary>} />
          <Route path="/queue" element={<PageErrorBoundary><Queue /></PageErrorBoundary>} />
          <Route path="/billing" element={<PageErrorBoundary><Billing /></PageErrorBoundary>} />
          <Route path="/expenses" element={<PageErrorBoundary><Expenses /></PageErrorBoundary>} />
          <Route path="/reports" element={<PageErrorBoundary><Reports /></PageErrorBoundary>} />
          <Route path="/analytics" element={<PageErrorBoundary><Analytics /></PageErrorBoundary>} />
          <Route path="/doctors" element={<PageErrorBoundary><Doctors /></PageErrorBoundary>} />
          <Route path="/staff" element={<PageErrorBoundary><Staff /></PageErrorBoundary>} />
          <Route path="/shifts" element={<PageErrorBoundary><Shifts /></PageErrorBoundary>} />
          <Route path="/services" element={<PageErrorBoundary><Services /></PageErrorBoundary>} />
          <Route path="/inventory" element={<PageErrorBoundary><Inventory /></PageErrorBoundary>} />
          <Route path="/beds" element={<PageErrorBoundary><Beds /></PageErrorBoundary>} />
          <Route path="/notifications" element={<PageErrorBoundary><Notifications /></PageErrorBoundary>} />
          <Route path="/documents" element={<PageErrorBoundary><Documents /></PageErrorBoundary>} />
          <Route path="/waitlist" element={<PageErrorBoundary><Waitlist /></PageErrorBoundary>} />
          <Route path="/claims" element={<PageErrorBoundary><Claims /></PageErrorBoundary>} />
          <Route path="/settings" element={<PageErrorBoundary><Settings /></PageErrorBoundary>} />
        </Routes>
      </Layout>
      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}

export default App
