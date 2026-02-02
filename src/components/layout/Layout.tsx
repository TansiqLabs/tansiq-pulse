import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="ml-64 min-h-screen"
      >
        <div className="p-8">
          {children}
        </div>
      </motion.main>
    </div>
  )
}
