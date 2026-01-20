"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Home,
  Building2,
  MessageSquare,
  Heart,
  Settings,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MoreVertical,
  ChevronLeft,
  Filter,
  History,
  BarChart3,
  Wallet,
  FileText,
  UserCircle,
  Shield,
  X,
} from "lucide-react";
import { Button, Card, Badge, Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { propertyService, dashboardService, messageService } from "@/services";
import { useAuthStore } from "@/store";
import { useRequireRole } from "@/hooks/use-auth";

interface Booking {
  id: string;
  title: string;
  property: string;
  propertyId?: string;
  client: string;
  clientEmail?: string;
  clientPhone?: string;
  date: string;
  time: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  type?: 'incoming' | 'outgoing';
  message?: string;
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
const getGroupedNavigation = (bookingsCount: number = 0, unreadMessagesCount: number = 0): NavGroup[] => [
  {
    name: "Main",
    items: [
      { name: "Overview", href: "/dashboard", icon: Home },
      { name: "My Properties", href: "/dashboard/properties", icon: Building2 },
      { name: "Bookings & Viewings", href: "/dashboard/bookings", icon: Calendar, current: true, badge: bookingsCount > 0 ? bookingsCount : undefined },
      { name: "Messages", href: "/dashboard/messages", icon: MessageSquare, badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined },
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

export default function BookingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasAccess, isLoading: roleLoading } = useRequireRole(["buyer", "renter", "lister", "property_manager", "admin", "service_provider"]);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing' | 'pending' | 'confirmed'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  // Fetch bookings and unread messages count
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || authLoading || roleLoading) return;
      
      try {
        setLoading(true);
        const [bookingsResponse, unreadCount] = await Promise.all([
          dashboardService.getAppointments(),
          messageService.getUnreadCount().catch(() => 0),
        ]);
        setBookings(bookingsResponse || []);
        setUnreadMessagesCount(unreadCount);
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    if (hasAccess) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, roleLoading, hasAccess]);

  // Handle status update
  const handleStatusUpdate = async (bookingId: string, newStatus: 'confirmed' | 'rejected' | 'cancelled') => {
    try {
      setUpdatingId(bookingId);
      await propertyService.updateBookingStatus(bookingId, newStatus);
      
      // Refresh bookings
      const response = await dashboardService.getAppointments();
      setBookings(response || []);
    } catch (error) {
      console.error("Failed to update booking status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    // Incoming Requests: only show pending incoming requests (not yet confirmed/rejected)
    if (filter === 'incoming') return booking.type === 'incoming' && booking.status === 'pending';
    if (filter === 'outgoing') return booking.type === 'outgoing';
    if (filter === 'pending') return booking.status === 'pending';
    if (filter === 'confirmed') return booking.status === 'confirmed';
    return true;
  });

  // Count pending bookings
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  // Get status badge color
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-700">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700">Completed</Badge>;
      case 'rejected':
        return <Badge className="bg-gray-100 text-gray-700">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600">Unknown</Badge>;
    }
  };

  // Loading state
  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r fixed h-full">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">PropertyMarket</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {getGroupedNavigation(pendingCount, unreadMessagesCount).map((group) => (
            <div key={group.name} className="mb-2">
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
                    <svg
                      className={cn("w-4 h-4 transition-transform", accountMenuOpen && "rotate-180")}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {accountMenuOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition",
                            item.current
                              ? "bg-blue-50 text-blue-600"
                              : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
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
                    {item.name}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Bookings & Viewings</h1>
                <p className="text-sm text-slate-500">Manage property viewing requests</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { key: 'all', label: 'All', count: bookings.length },
              { key: 'incoming', label: 'Incoming Requests', count: bookings.filter(b => b.type === 'incoming' && b.status === 'pending').length },
              { key: 'outgoing', label: 'My Viewings', count: bookings.filter(b => b.type === 'outgoing').length },
              { key: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
              { key: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition",
                  filter === tab.key
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 border"
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "ml-2 px-2 py-0.5 rounded-full text-xs",
                    filter === tab.key ? "bg-blue-500 text-white" : "bg-slate-100"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No bookings found</h3>
              <p className="text-slate-500 mb-4">
                {filter === 'all' 
                  ? "You don't have any viewing requests yet"
                  : `No ${filter} bookings found`}
              </p>
              <Link href="/properties">
                <Button>Browse Properties</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Booking Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          booking.type === 'incoming' ? "bg-green-100" : "bg-blue-100"
                        )}>
                          {booking.type === 'incoming' ? (
                            <Eye className="w-5 h-5 text-green-600" />
                          ) : (
                            <Calendar className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{booking.title}</h3>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(booking.status)}
                            <Badge variant="outline" className="text-xs">
                              {booking.type === 'incoming' ? 'Incoming Request' : 'My Viewing'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Property */}
                      {booking.propertyId && (
                        <Link 
                          href={`/properties/${booking.propertyId}`}
                          className="flex items-center gap-2 text-blue-600 hover:underline mb-2"
                        >
                          <Building2 className="w-4 h-4" />
                          {booking.property}
                        </Link>
                      )}

                      {/* Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(booking.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {booking.time}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          {booking.client}
                        </div>
                        {booking.clientEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <a href={`mailto:${booking.clientEmail}`} className="hover:text-blue-600">
                              {booking.clientEmail}
                            </a>
                          </div>
                        )}
                        {booking.clientPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <a href={`tel:${booking.clientPhone}`} className="hover:text-blue-600">
                              {booking.clientPhone}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Message */}
                      {booking.message && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                          <strong>Note:</strong> {booking.message}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {booking.type === 'incoming' && booking.status === 'pending' && (
                      <div className="flex gap-2 lg:flex-col">
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                          disabled={updatingId === booking.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {updatingId === booking.id ? (
                            <span className="animate-spin">⏳</span>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Confirm
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                          disabled={updatingId === booking.id}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    )}

                    {booking.type === 'outgoing' && booking.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                        disabled={updatingId === booking.id}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    )}

                    {booking.status === 'confirmed' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Confirmed</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-white z-50">
            <div className="h-16 flex items-center justify-between px-6 border-b">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900">PropertyMarket</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="p-1">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {getGroupedNavigation(pendingCount, unreadMessagesCount)[0].items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition",
                    item.current
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
