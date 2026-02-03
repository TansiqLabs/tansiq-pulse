import { motion } from 'framer-motion'
import { Moon, Sun, Keyboard } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { GlobalSearch } from '@/components/GlobalSearch'
import { AppointmentReminders } from '@/components/AppointmentReminders'
import { useTheme } from '@/components/ui/theme-provider'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between h-16 px-8">
            <GlobalSearch />
            <div className="flex items-center gap-2">
              <AppointmentReminders />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => {
                      const event = new KeyboardEvent('keydown', {
                        key: '?',
                        metaKey: isMac,
                        ctrlKey: !isMac,
                      })
                      window.dispatchEvent(event)
                    }}
                  >
                    <Keyboard className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Keyboard Shortcuts ({isMac ? '⌘' : 'Ctrl'}+?)</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="rounded-full"
                  >
                    {resolvedTheme === 'dark' ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle theme</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1"
        >
          <div className="p-8">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  )
}
