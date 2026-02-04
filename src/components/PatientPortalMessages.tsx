import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import {
  MessageCircle,
  Search,
  Send,
  Inbox,
  Archive,
  Star,
  User,
  Clock,
  CheckCheck,
  Plus,
  MoreHorizontal,
  AlertCircle,
  Calendar,
  CreditCard,
  Pill,
  FlaskConical,
  Mail,
  MailOpen,
  Reply,
  Paperclip,
  Smile,
  ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { getInitials, cn } from '@/lib/utils'

interface Message {
  id: string
  sender: string
  senderType: 'PATIENT' | 'STAFF'
  content: string
  timestamp: string
  read: boolean
}

interface Conversation {
  id: string
  patientId: string
  patientName: string
  patientEmail?: string
  subject: string
  category: 'GENERAL' | 'APPOINTMENT' | 'PRESCRIPTION' | 'LAB_RESULTS' | 'BILLING' | 'URGENT'
  status: 'OPEN' | 'REPLIED' | 'RESOLVED' | 'ARCHIVED'
  starred: boolean
  messages: Message[]
  lastMessageAt: string
  createdAt: string
}

const CATEGORIES = [
  { value: 'GENERAL', label: 'General Inquiry', icon: MessageCircle, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  { value: 'APPOINTMENT', label: 'Appointment', icon: Calendar, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'PRESCRIPTION', label: 'Prescription', icon: Pill, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'LAB_RESULTS', label: 'Lab Results', icon: FlaskConical, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'BILLING', label: 'Billing', icon: CreditCard, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'URGENT', label: 'Urgent', icon: AlertCircle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
]

const STATUS_CONFIG = {
  OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  REPLIED: { label: 'Replied', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  RESOLVED: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  ARCHIVED: { label: 'Archived', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
}

const STORAGE_KEY = 'portal_messages'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
}

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
}

export function PatientPortalMessages() {
  const toast = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'starred'>('all')
  const [replyText, setReplyText] = useState('')
  const [showNewDialog, setShowNewDialog] = useState(false)

  const [newMessage, setNewMessage] = useState({
    patientName: '',
    patientEmail: '',
    subject: '',
    category: 'GENERAL' as Conversation['category'],
    content: '',
  })

  const loadConversations = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setConversations(JSON.parse(stored))
    }
  }, [])

  const saveConversations = (data: Conversation[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setConversations(data)
  }

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (selectedConversation) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selectedConversation?.messages.length])

  const handleNewConversation = () => {
    if (!newMessage.patientName || !newMessage.subject || !newMessage.content) {
      toast.error('Error', 'Please fill in all required fields')
      return
    }

    const conversation: Conversation = {
      id: `CONV-${Date.now()}`,
      patientId: `P-${Date.now()}`,
      patientName: newMessage.patientName,
      patientEmail: newMessage.patientEmail,
      subject: newMessage.subject,
      category: newMessage.category,
      status: 'OPEN',
      starred: false,
      messages: [
        {
          id: `MSG-${Date.now()}`,
          sender: newMessage.patientName,
          senderType: 'PATIENT',
          content: newMessage.content,
          timestamp: new Date().toISOString(),
          read: false,
        },
      ],
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    saveConversations([conversation, ...conversations])
    toast.success('Created', 'New conversation started')
    setShowNewDialog(false)
    setNewMessage({
      patientName: '',
      patientEmail: '',
      subject: '',
      category: 'GENERAL',
      content: '',
    })
  }

  const handleReply = () => {
    if (!selectedConversation || !replyText.trim()) return

    const newMsg: Message = {
      id: `MSG-${Date.now()}`,
      sender: 'Staff',
      senderType: 'STAFF',
      content: replyText,
      timestamp: new Date().toISOString(),
      read: true,
    }

    const updated = conversations.map(c => {
      if (c.id === selectedConversation.id) {
        return {
          ...c,
          status: 'REPLIED' as Conversation['status'],
          messages: [...c.messages, newMsg],
          lastMessageAt: new Date().toISOString(),
        }
      }
      return c
    })

    saveConversations(updated)
    setSelectedConversation({
      ...selectedConversation,
      status: 'REPLIED',
      messages: [...selectedConversation.messages, newMsg],
    })
    setReplyText('')
    toast.success('Sent', 'Reply sent successfully')
  }

  const handleStatusChange = (id: string, status: Conversation['status']) => {
    const updated = conversations.map(c =>
      c.id === id ? { ...c, status } : c
    )
    saveConversations(updated)
    if (selectedConversation?.id === id) {
      setSelectedConversation({ ...selectedConversation, status })
    }
    toast.success('Updated', `Conversation marked as ${status.toLowerCase()}`)
  }

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const updated = conversations.map(c =>
      c.id === id ? { ...c, starred: !c.starred } : c
    )
    saveConversations(updated)
    if (selectedConversation?.id === id) {
      setSelectedConversation({ ...selectedConversation, starred: !selectedConversation.starred })
    }
  }

  const handleMarkAsRead = (id: string) => {
    const updated = conversations.map(c => {
      if (c.id === id) {
        return {
          ...c,
          messages: c.messages.map(m => ({ ...m, read: true })),
        }
      }
      return c
    })
    saveConversations(updated)
  }

  const getCategoryInfo = (category: Conversation['category']) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0]
  }

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      const matchesSearch =
        c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus
      const matchesCategory = filterCategory === 'all' || c.category === filterCategory
      
      let matchesTab = true
      if (filterTab === 'unread') {
        matchesTab = c.messages.some(m => !m.read && m.senderType === 'PATIENT')
      } else if (filterTab === 'starred') {
        matchesTab = c.starred
      }
      
      return matchesSearch && matchesStatus && matchesCategory && matchesTab
    })
  }, [conversations, searchQuery, filterStatus, filterCategory, filterTab])

  const stats = useMemo(() => ({
    total: conversations.length,
    open: conversations.filter(c => c.status === 'OPEN').length,
    unread: conversations.filter(c => c.messages.some(m => !m.read && m.senderType === 'PATIENT')).length,
    urgent: conversations.filter(c => c.category === 'URGENT' && c.status !== 'RESOLVED').length,
    starred: conversations.filter(c => c.starred).length,
    responseRate: conversations.length > 0 
      ? Math.round((conversations.filter(c => c.status === 'REPLIED' || c.status === 'RESOLVED').length / conversations.length) * 100)
      : 0,
  }), [conversations])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                Patient Messages
              </h2>
              <p className="text-muted-foreground">
                Manage patient portal communications
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowNewDialog(true)} className="bg-gradient-to-r from-indigo-600 to-indigo-500">
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      {/* Stats Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 grid-cols-2 lg:grid-cols-5"
      >
        {[
          { label: 'Total', value: stats.total, icon: Inbox, color: 'from-blue-500 to-blue-600' },
          { label: 'Open', value: stats.open, icon: Mail, color: 'from-amber-500 to-amber-600', alert: stats.open > 5 },
          { label: 'Unread', value: stats.unread, icon: MailOpen, color: 'from-orange-500 to-orange-600', alert: stats.unread > 0 },
          { label: 'Urgent', value: stats.urgent, icon: AlertCircle, color: 'from-red-500 to-red-600', alert: stats.urgent > 0 },
          { label: 'Response Rate', value: `${stats.responseRate}%`, icon: Reply, color: 'from-emerald-500 to-emerald-600' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Card className={cn(
              "relative overflow-hidden border-0 shadow-md",
              stat.alert && "ring-2 ring-offset-2",
              stat.alert && stat.color.includes('red') && "ring-red-500",
              stat.alert && stat.color.includes('orange') && "ring-orange-500"
            )}>
              <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", stat.color)} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={cn("p-2.5 rounded-xl bg-gradient-to-br text-white", stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Conversations List */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 space-y-4">
              {/* Quick Tabs */}
              <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as typeof filterTab)}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="all" className="text-xs">
                    All
                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{conversations.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="text-xs">
                    Unread
                    {stats.unread > 0 && (
                      <Badge className="ml-1.5 text-[10px] px-1.5 bg-orange-500">{stats.unread}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="starred" className="text-xs">
                    Starred
                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{stats.starred}</Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-0"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="flex-1 bg-muted/50 border-0 h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="REPLIED">Replied</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="flex-1 bg-muted/50 border-0 h-9 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="h-3 w-3" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Conversations */}
          <ScrollArea className="h-[calc(100vh-500px)] min-h-[400px]">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-2 pr-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredConversations.length === 0 ? (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Inbox className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-medium">No messages</p>
                      <p className="text-sm text-muted-foreground">
                        {conversations.length === 0 ? 'Start a new conversation' : 'Try adjusting your filters'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredConversations.map((conversation) => {
                    const hasUnread = conversation.messages.some(m => !m.read && m.senderType === 'PATIENT')
                    const lastMessage = conversation.messages[conversation.messages.length - 1]
                    const categoryInfo = getCategoryInfo(conversation.category)
                    const CategoryIcon = categoryInfo.icon
                    const isSelected = selectedConversation?.id === conversation.id
                    
                    return (
                      <motion.div
                        key={conversation.id}
                        variants={item}
                        layout
                      >
                        <Card
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md border-0 shadow-sm overflow-hidden",
                            isSelected && "ring-2 ring-primary shadow-md",
                            hasUnread && "bg-indigo-50/50 dark:bg-indigo-950/20"
                          )}
                          onClick={() => {
                            setSelectedConversation(conversation)
                            handleMarkAsRead(conversation.id)
                          }}
                        >
                          {/* Urgent indicator */}
                          {conversation.category === 'URGENT' && conversation.status !== 'RESOLVED' && (
                            <div className="h-1 bg-gradient-to-r from-red-500 to-red-400" />
                          )}
                          
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <Avatar className={cn(
                                "h-10 w-10 ring-2 ring-offset-1",
                                hasUnread ? "ring-indigo-400" : "ring-transparent"
                              )}>
                                <AvatarFallback className={cn(
                                  "text-sm font-medium",
                                  hasUnread ? "bg-indigo-100 text-indigo-700" : "bg-muted"
                                )}>
                                  {getInitials(conversation.patientName.split(' ')[0], conversation.patientName.split(' ')[1] || '')}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={cn(
                                      "text-sm truncate",
                                      hasUnread ? "font-bold" : "font-medium"
                                    )}>
                                      {conversation.patientName}
                                    </span>
                                    {hasUnread && (
                                      <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => handleToggleStar(e, conversation.id)}
                                    className="shrink-0"
                                  >
                                    <Star
                                      className={cn(
                                        "h-4 w-4 transition-colors",
                                        conversation.starred 
                                          ? "fill-yellow-400 text-yellow-400" 
                                          : "text-muted-foreground hover:text-yellow-400"
                                      )}
                                    />
                                  </button>
                                </div>
                                
                                <p className={cn(
                                  "text-sm truncate",
                                  hasUnread ? "font-semibold text-foreground" : "text-muted-foreground"
                                )}>
                                  {conversation.subject}
                                </p>
                                
                                <p className="text-xs text-muted-foreground truncate">
                                  {lastMessage?.content.substring(0, 50)}...
                                </p>
                                
                                <div className="flex items-center gap-2 pt-1">
                                  <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", categoryInfo.color)}>
                                    <CategoryIcon className="h-2.5 w-2.5 mr-1" />
                                    {categoryInfo.label}
                                  </Badge>
                                  <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", STATUS_CONFIG[conversation.status].color)}>
                                    {STATUS_CONFIG[conversation.status].label}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground ml-auto">
                                    {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })
                )}
              </AnimatePresence>
            </motion.div>
          </ScrollArea>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-8">
          {selectedConversation ? (
            <Card className="border-0 shadow-md h-[calc(100vh-320px)] min-h-[500px] flex flex-col">
              {/* Header */}
              <CardHeader className="border-b p-4 shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getInitials(selectedConversation.patientName.split(' ')[0], selectedConversation.patientName.split(' ')[1] || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg truncate">{selectedConversation.subject}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5" />
                        <span>{selectedConversation.patientName}</span>
                        {selectedConversation.patientEmail && (
                          <>
                            <span>•</span>
                            <span className="truncate">{selectedConversation.patientEmail}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {(() => {
                          const catInfo = getCategoryInfo(selectedConversation.category)
                          const CatIcon = catInfo.icon
                          return (
                            <Badge variant="secondary" className={cn("text-xs", catInfo.color)}>
                              <CatIcon className="h-3 w-3 mr-1" />
                              {catInfo.label}
                            </Badge>
                          )
                        })()}
                        <Badge variant="secondary" className={cn("text-xs", STATUS_CONFIG[selectedConversation.status].color)}>
                          {STATUS_CONFIG[selectedConversation.status].label}
                        </Badge>
                        <button onClick={(e) => handleToggleStar(e, selectedConversation.id)}>
                          <Star className={cn(
                            "h-4 w-4",
                            selectedConversation.starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                          )} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedConversation.status !== 'RESOLVED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(selectedConversation.id, 'RESOLVED')}
                      >
                        <CheckCheck className="h-4 w-4 mr-1.5" />
                        Resolve
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(selectedConversation.id, 'OPEN')}>
                          Mark as Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(selectedConversation.id, 'REPLIED')}>
                          Mark as Replied
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(selectedConversation.id, 'ARCHIVED')}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedConversation.messages.map((message, idx) => {
                    const isStaff = message.senderType === 'STAFF'
                    const showDate = idx === 0 || 
                      format(new Date(selectedConversation.messages[idx - 1].timestamp), 'yyyy-MM-dd') !==
                      format(new Date(message.timestamp), 'yyyy-MM-dd')
                    
                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="flex items-center gap-4 my-4">
                            <Separator className="flex-1" />
                            <span className="text-xs text-muted-foreground bg-background px-2">
                              {format(new Date(message.timestamp), 'EEEE, MMMM d')}
                            </span>
                            <Separator className="flex-1" />
                          </div>
                        )}
                        
                        <div className={cn("flex gap-3", isStaff && "flex-row-reverse")}>
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={cn(
                              "text-xs",
                              isStaff ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}>
                              {isStaff ? 'S' : getInitials(message.sender.split(' ')[0], message.sender.split(' ')[1] || '')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className={cn("max-w-[75%] space-y-1", isStaff && "items-end")}>
                            <div className={cn(
                              "rounded-2xl px-4 py-2.5",
                              isStaff 
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            )}>
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <div className={cn(
                              "flex items-center gap-1.5 text-[10px]",
                              isStaff ? "justify-end text-muted-foreground" : "text-muted-foreground"
                            )}>
                              <Clock className="h-3 w-3" />
                              {format(new Date(message.timestamp), 'h:mm a')}
                              {isStaff && <CheckCheck className="h-3 w-3 text-primary" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Reply Box */}
              <div className="border-t p-4 shrink-0">
                <div className="flex flex-col gap-3">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={3}
                    className="resize-none bg-muted/50 border-0"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button onClick={handleReply} disabled={!replyText.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="border-0 shadow-md h-[calc(100vh-320px)] min-h-[500px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-lg">No conversation selected</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a conversation from the list to view messages
                </p>
                <Button className="mt-4" variant="outline" onClick={() => setShowNewDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Message Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              New Message
            </DialogTitle>
            <DialogDescription>
              Start a new conversation (simulating patient message)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Patient Name *</Label>
                <Input
                  value={newMessage.patientName}
                  onChange={(e) => setNewMessage({ ...newMessage, patientName: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newMessage.patientEmail}
                  onChange={(e) => setNewMessage({ ...newMessage, patientEmail: e.target.value })}
                  placeholder="patient@email.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                placeholder="Message subject"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newMessage.category}
                onValueChange={(v) => setNewMessage({ ...newMessage, category: v as Conversation['category'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                placeholder="Write your message..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleNewConversation}>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
