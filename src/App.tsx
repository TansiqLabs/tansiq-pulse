import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout'
import {
  Dashboard,
  Patients,
  Appointments,
  Billing,
  Doctors,
  Settings,
  Reports,
  Queue,
} from '@/pages'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default App
