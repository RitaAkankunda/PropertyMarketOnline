'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare,
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  ArrowLeft,
  Check,
  CheckCheck,
  Home,
  Building2,
  Heart,
  Settings,
  BarChart3,
  Wallet,
  FileText,
  LogOut,
  Menu,
  X,
  Image as ImageIcon,
  Ban,
  Trash2,
  User as UserIcon,
  Smile,
  ChevronDown,
  History,
  UserCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { messageService } from '@/services';
import { cn } from '@/lib/utils';

// Types matching backend entities
interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

interface PropertyInfo {
  id: string;
  title: string;
  address?: string;
  location?: {
    address: string;
    city: string;
  };
}

interface ConversationFromAPI {
  id: string;
  participantOneId: string;
  participantOne: Participant;
  participantTwoId: string;
  participantTwo: Participant;
  property?: PropertyInfo | null;
  propertyId?: string | null;
  lastMessageContent: string | null;
  lastMessageAt: string | null;
  participantOneUnreadCount: number;
  participantTwoUnreadCount: number;
  isBlocked: boolean;
  blockedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MessageFromAPI {
  id: string;
  conversationId: string;
  senderId: string;
  sender: Participant;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: { url: string; name: string; type: string; size: number }[] | null;
  isRead: boolean;
  readAt?: string | null;
  isDeleted: boolean;
  createdAt: string;
}

// Normalized types for UI
interface NormalizedConversation {
  id: string;
  participant: Participant;
  property: PropertyInfo | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isBlocked: boolean;
}

// Navigation item types
interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
  current?: boolean;
}

interface NavGroup {
  name: string;
  icon?: any;
  items: NavItem[];
  collapsible?: boolean;
}

// Grouped navigation items
const getGroupedNavigation = (): NavGroup[] => [
  {
    name: "Main",
    items: [
      { name: "Overview", href: "/dashboard", icon: Home },
      { name: "My Properties", href: "/dashboard/properties", icon: Building2 },
      { name: "Messages", href: "/dashboard/messages", icon: MessageSquare, current: true },
      { name: "Saved Properties", href: "/dashboard/saved", icon: Heart },
      { name: "Recently Viewed", href: "/dashboard/recently-viewed", icon: History },
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    name: "Account",
    icon: UserCircle,
    collapsible: true,
    items: [
      { name: "Payments", href: "/dashboard/payments", icon: Wallet },
      { name: "Documents", href: "/dashboard/documents", icon: FileText },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export default function DashboardMessagesPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [conversations, setConversations] = useState<NormalizedConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<NormalizedConversation | null>(null);
  const [messages, setMessages] = useState<MessageFromAPI[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize conversation from API to UI format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizeConversation = useCallback((conv: any, currentUserId: string): NormalizedConversation | null => {
    // Backend may return already-transformed data with 'participant' field
    // or raw data with participantOne/participantTwo
    let participant: Participant | undefined;
    let unreadCount = 0;

    if (conv.participant && conv.participant.id) {
      // Already transformed by backend
      participant = conv.participant;
      unreadCount = conv.unreadCount || 0;
    } else if (conv.participantOneId && conv.participantTwoId) {
      // Raw format - need to determine the other participant
      const isParticipantOne = conv.participantOneId === currentUserId;
      participant = isParticipantOne ? conv.participantTwo : conv.participantOne;
      unreadCount = isParticipantOne ? conv.participantOneUnreadCount : conv.participantTwoUnreadCount;
    }

    // Skip conversations with missing participants
    if (!participant || !participant.id) {
      console.warn('Skipping conversation with missing participant:', conv.id);
      return null;
    }

    return {
      id: conv.id,
      participant: {
        id: participant.id,
        firstName: participant.firstName || 'Unknown',
        lastName: participant.lastName || 'User',
        email: participant.email || '',
        avatar: participant.avatar,
      },
      property: conv.property || null,
      lastMessage: conv.lastMessageContent || conv.lastMessage || null,
      lastMessageAt: conv.lastMessageAt || null,
      unreadCount: unreadCount || 0,
      isBlocked: conv.isBlocked || false,
    };
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await messageService.getConversations(1, 50);
      
      // Normalize conversations from API - handle both array and paginated response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conversationsData: any[] = Array.isArray(response) ? response : (response.data || []);
      const normalizedConvs = conversationsData
        .map((conv) => normalizeConversation(conv as ConversationFromAPI, user.id))
        .filter((conv): conv is NormalizedConversation => conv !== null);
      
      setConversations(normalizedConvs);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations. Please try again.');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, normalizeConversation]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      const response = await messageService.getConversation(conversationId, 1, 100);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messagesData: any[] = response.messages || [];
      setMessages(messagesData as MessageFromAPI[]);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages. Please try again.');
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Auth check and initial load
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    loadConversations();
    
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isAuthenticated, router, loadConversations]);

  // Handle URL parameter for conversation selection
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0 && !selectedConversation) {
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        setSelectedConversation(conv);
        loadMessages(conv.id);
        if (window.innerWidth < 1024) {
          setShowConversationList(false);
        }
        // Mark as read
        if (conv.unreadCount > 0) {
          messageService.markAsRead(conv.id).catch(console.error);
          setConversations(prev => 
            prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
          );
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, conversations.length, selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle conversation selection
  const handleSelectConversation = (conversation: NormalizedConversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
    if (isMobileView) {
      setShowConversationList(false);
    }
    // Mark as read
    if (conversation.unreadCount > 0) {
      messageService.markAsRead(conversation.id).catch(console.error);
      setConversations(prev => 
        prev.map(c => c.id === conversation.id ? { ...c, unreadCount: 0 } : c)
      );
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending || !user) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic update
    const tempMessage: MessageFromAPI = {
      id: `temp-${Date.now()}`,
      conversationId: selectedConversation.id,
      senderId: user.id,
      content,
      type: 'text',
      isRead: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      },
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const sentMessage = await messageService.sendMessage({
        conversationId: selectedConversation.id,
        recipientId: selectedConversation.participant.id,
        content,
      });
      
      // Replace temp message with real one
      setMessages(prev => 
        prev.map(m => m.id === tempMessage.id ? { ...sentMessage, sender: tempMessage.sender } as MessageFromAPI : m)
      );
      
      // Update conversation list
      setConversations(prev =>
        prev.map(c =>
          c.id === selectedConversation.id
            ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() }
            : c
        ).sort((a, b) => 
          new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Format time
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Get property address
  const getPropertyAddress = (property: PropertyInfo | null): string => {
    if (!property) return '';
    if (property.address) return property.address;
    if (property.location) {
      return `${property.location.address}, ${property.location.city}`;
    }
    return '';
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const participantName = conv.participant 
      ? `${conv.participant.firstName || ''} ${conv.participant.lastName || ''}` 
      : '';
    return participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.property?.title || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Total unread count
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:translate-x-0 lg:static",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <Link href="/" className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-gray-900">PropertyMarket</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {getGroupedNavigation().map((group) => (
              <div key={group.name} className="mb-2">
                {/* Group with collapsible items */}
                {group.collapsible ? (
                  <>
                    <button
                      onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        {group.icon && <group.icon className="w-5 h-5" />}
                        <span>{group.name}</span>
                      </div>
                      <ChevronDown 
                        className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          accountMenuOpen ? "rotate-180" : ""
                        )} 
                      />
                    </button>
                    {/* Collapsible submenu */}
                    <div className={cn(
                      "overflow-hidden transition-all duration-200",
                      accountMenuOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                    )}>
                      <div className="pl-4 space-y-1 mt-1">
                        {group.items.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                          >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Regular group items */
                  group.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition",
                        item.current
                          ? "bg-blue-50 text-blue-600"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                      {item.name === 'Messages' && totalUnread > 0 && (
                        <span className="ml-auto bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                          {totalUnread}
                        </span>
                      )}
                      {item.badge && item.badge > 0 && (
                        <span className="ml-auto bg-blue-100 text-blue-600 text-xs rounded-full px-2 py-0.5">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))
                )}
              </div>
            ))}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 mr-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          {totalUnread > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-700 text-sm rounded-full px-2.5 py-0.5">
              {totalUnread} unread
            </span>
          )}
        </header>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversation List */}
          <div className={cn(
            "w-full lg:w-96 bg-white border-r border-gray-200 flex flex-col",
            isMobileView && !showConversationList ? "hidden" : "flex"
          )}>
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                  <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-1">No conversations yet</p>
                  <p className="text-sm text-center">
                    Start a conversation by messaging a property owner or service provider
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={cn(
                      "flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100",
                      selectedConversation?.id === conv.id && "bg-blue-50 hover:bg-blue-50"
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {conv.participant?.firstName?.charAt(0) || '?'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conv.participant?.firstName || 'Unknown'} {conv.participant?.lastName || 'User'}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      {conv.property && (
                        <p className="text-xs text-blue-600 truncate mb-1">
                          <Building2 className="inline h-3 w-3 mr-1" />
                          {conv.property.title}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-2 flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={cn(
            "flex-1 flex flex-col bg-gray-50",
            isMobileView && showConversationList ? "hidden" : "flex"
          )}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isMobileView && (
                      <button
                        onClick={() => setShowConversationList(true)}
                        className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
                      >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                      </button>
                    )}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedConversation.participant?.firstName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {selectedConversation.participant?.firstName || 'Unknown'} {selectedConversation.participant?.lastName || 'User'}
                      </h2>
                      {selectedConversation.property && (
                        <p className="text-xs text-gray-500">
                          Re: {selectedConversation.property.title}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                      <Phone className="h-5 w-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                      <Video className="h-5 w-5" />
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {showMenu && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                            <UserIcon className="h-4 w-4" />
                            View Profile
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                            <Ban className="h-4 w-4" />
                            Block User
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600">
                            <Trash2 className="h-4 w-4" />
                            Delete Chat
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <>
                      {/* Property context */}
                      {selectedConversation.property && (
                        <div className="flex justify-center mb-4">
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 max-w-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {selectedConversation.property.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {getPropertyAddress(selectedConversation.property)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* No messages */}
                      {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <MessageSquare className="h-12 w-12 mb-2 text-gray-300" />
                          <p className="text-sm">No messages yet. Start the conversation!</p>
                        </div>
                      )}

                      {/* Message bubbles */}
                      {messages.map((msg) => {
                        const isOwnMessage = msg.senderId === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex",
                              isOwnMessage ? "justify-end" : "justify-start"
                            )}
                          >
                            <div className={cn(
                              "max-w-[75%] rounded-2xl px-4 py-2.5",
                              isOwnMessage
                                ? "bg-blue-600 text-white rounded-br-md"
                                : "bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100"
                            )}>
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              <div className={cn(
                                "flex items-center justify-end gap-1 mt-1",
                                isOwnMessage ? "text-blue-100" : "text-gray-400"
                              )}>
                                <span className="text-xs">
                                  {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {isOwnMessage && (
                                  msg.isRead ? (
                                    <CheckCheck className="h-3.5 w-3.5" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                <div className="bg-white border-t border-gray-200 p-4">
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                      <ImageIcon className="h-5 w-5" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50"
                        disabled={sending}
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <Smile className="h-5 w-5" />
                      </button>
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className={cn(
                        "p-2.5 rounded-full transition-colors",
                        newMessage.trim() && !sending
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* No conversation selected */
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="h-12 w-12 text-gray-300" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Messages</h2>
                <p className="text-center max-w-sm">
                  Select a conversation from the list to start messaging, or contact a property owner to begin a new chat.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
