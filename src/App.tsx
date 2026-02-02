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
          <Route path="/queue" element={<PageErrorBoundary><Queue /></PageErrorBoundary>} />
          <Route path="/billing" element={<PageErrorBoundary><Billing /></PageErrorBoundary>} />
          <Route path="/reports" element={<PageErrorBoundary><Reports /></PageErrorBoundary>} />
          <Route path="/doctors" element={<PageErrorBoundary><Doctors /></PageErrorBoundary>} />
          <Route path="/services" element={<PageErrorBoundary><Services /></PageErrorBoundary>} />
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
