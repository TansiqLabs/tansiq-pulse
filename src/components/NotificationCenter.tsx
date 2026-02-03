import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  UserPlus,
  AlertTriangle,
  Package,
  CreditCard,
  FileText,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast'

export interface Notification {
  id: string
  type: 'APPOINTMENT' | 'PATIENT' | 'ALERT' | 'INVENTORY' | 'BILLING' | 'SYSTEM'
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

interface NotificationSettings {
  appointments: boolean
  patients: boolean
  alerts: boolean
  inventory: boolean
  billing: boolean
  system: boolean
  sound: boolean
  desktop: boolean
}

export function NotificationCenter() {
  const toast = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    appointments: true,
    patients: true,
    alerts: true,
    inventory: true,
    billing: true,
    system: true,
    sound: true,
    desktop: false,
  })

  useEffect(() => {
    const stored = localStorage.getItem('notifications')
    const storedSettings = localStorage.getItem('notification_settings')
    
    if (stored) {
      setNotifications(JSON.parse(stored))
    } else {
      // Generate sample notifications
      const sampleNotifications: Notification[] = [
        {
          id: '1',
          type: 'APPOINTMENT',
          title: 'Upcoming Appointment',
          message: 'You have an appointment with John Doe in 30 minutes',
          read: false,
          createdAt: new Date().toISOString(),
          priority: 'HIGH',
        },
        {
          id: '2',
          type: 'PATIENT',
          title: 'New Patient Registered',
          message: 'Sarah Johnson has registered as a new patient',
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          priority: 'MEDIUM',
        },
        {
          id: '3',
          type: 'INVENTORY',
          title: 'Low Stock Alert',
          message: 'Surgical gloves are running low (5 boxes remaining)',
          read: true,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          priority: 'HIGH',
        },
        {
          id: '4',
          type: 'BILLING',
          title: 'Payment Received',
          message: 'Payment of $250 received from Mike Wilson',
          read: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          priority: 'LOW',
        },
        {
          id: '5',
          type: 'ALERT',
          title: 'Lab Results Ready',
          message: 'Lab results for patient Emily Davis are ready for review',
          read: false,
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          priority: 'MEDIUM',
        },
        {
          id: '6',
          type: 'SYSTEM',
          title: 'System Update',
          message: 'A new version of the application is available',
          read: true,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          priority: 'LOW',
        },
      ]
      setNotifications(sampleNotifications)
      localStorage.setItem('notifications', JSON.stringify(sampleNotifications))
    }

    if (storedSettings) {
      setSettings(JSON.parse(storedSettings))
    }
  }, [])

  const saveNotifications = (newNotifications: Notification[]) => {
    localStorage.setItem('notifications', JSON.stringify(newNotifications))
    setNotifications(newNotifications)
  }

  const saveSettings = (newSettings: NotificationSettings) => {
    localStorage.setItem('notification_settings', JSON.stringify(newSettings))
    setSettings(newSettings)
  }

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    )
    saveNotifications(updated)
  }

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    saveNotifications(updated)
    toast.success('Done', 'All notifications marked as read')
  }

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id)
    saveNotifications(updated)
  }

  const clearAll = () => {
    saveNotifications([])
    toast.success('Cleared', 'All notifications cleared')
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'APPOINTMENT': return <Calendar className="h-5 w-5 text-blue-500" />
      case 'PATIENT': return <UserPlus className="h-5 w-5 text-green-500" />
      case 'ALERT': return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'INVENTORY': return <Package className="h-5 w-5 text-purple-500" />
      case 'BILLING': return <CreditCard className="h-5 w-5 text-emerald-500" />
      case 'SYSTEM': return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityBadge = (priority?: Notification['priority']) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="destructive" className="text-xs">Urgent</Badge>
      case 'HIGH':
        return <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">High</Badge>
      case 'MEDIUM':
        return <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Medium</Badge>
      default:
        return null
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.read
    return n.type === filter
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`p-4 border-b hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`font-medium text-sm ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                {notification.title}
              </h4>
              {getPriorityBadge(notification.priority)}
              {!notification.read && (
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex gap-2 mt-2">
            {!notification.read && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => markAsRead(notification.id)}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark read
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-red-500 hover:text-red-700"
              onClick={() => deleteNotification(notification.id)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </DropdownMenuItem>
              <DropdownMenuItem onClick={clearAll} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Notification Settings</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { key: 'appointments', label: 'Appointments', icon: Calendar },
                    { key: 'patients', label: 'Patients', icon: UserPlus },
                    { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
                    { key: 'inventory', label: 'Inventory', icon: Package },
                    { key: 'billing', label: 'Billing', icon: CreditCard },
                    { key: 'system', label: 'System', icon: FileText },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor={key}>{label}</Label>
                      </div>
                      <Switch
                        id={key}
                        checked={settings[key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked: boolean) => saveSettings({ ...settings, [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
                <div className="border-t mt-4 pt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sound">Sound notifications</Label>
                      <Switch
                        id="sound"
                        checked={settings.sound}
                        onCheckedChange={(checked: boolean) => saveSettings({ ...settings, sound: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="desktop">Desktop notifications</Label>
                      <Switch
                        id="desktop"
                        checked={settings.desktop}
                        onCheckedChange={(checked: boolean) => saveSettings({ ...settings, desktop: checked })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="flex-wrap h-auto p-1">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread" className="relative">
            Unread
            {unreadCount > 0 && (
              <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="APPOINTMENT">Appointments</TabsTrigger>
          <TabsTrigger value="PATIENT">Patients</TabsTrigger>
          <TabsTrigger value="ALERT">Alerts</TabsTrigger>
          <TabsTrigger value="INVENTORY">Inventory</TabsTrigger>
          <TabsTrigger value="BILLING">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          <Card>
            {filteredNotifications.length === 0 ? (
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No notifications</p>
              </CardContent>
            ) : (
              <ScrollArea className="h-[500px]">
                <AnimatePresence>
                  {filteredNotifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </AnimatePresence>
              </ScrollArea>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Add a notification helper function
export function addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
  const stored = localStorage.getItem('notifications')
  const notifications: Notification[] = stored ? JSON.parse(stored) : []
  
  const newNotification: Notification = {
    ...notification,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
  }
  
  const updated = [newNotification, ...notifications]
  localStorage.setItem('notifications', JSON.stringify(updated))
  
  // Dispatch custom event for real-time updates
  window.dispatchEvent(new CustomEvent('notification-added', { detail: newNotification }))
  
  return newNotification
}
