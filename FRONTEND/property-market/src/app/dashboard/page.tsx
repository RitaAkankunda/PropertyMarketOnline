"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  Building2,
  MessageSquare,
  Heart,
  Settings,
  User,
  LogOut,
  Plus,
  Bell,
  Search,
  Eye,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  Clock,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  BarChart3,
  Wallet,
  FileText,
  BadgeCheck,
  AlertCircle,
  Shield,
} from "lucide-react";
import { Button, Card, Badge, Avatar, Input } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import { propertyService, authService, dashboardService } from "@/services";
import { useAuthStore } from "@/store";
import { useRequireRole } from "@/hooks/use-auth";
import type { Property, User as UserType } from "@/types";

// Types for dashboard data
interface DashboardStats {
  totalProperties: number;
  totalViews: number;
  totalMessages: number;
  revenue: number;
  propertyChange: string;
  viewsChange: string;
  messagesChange: string;
  revenueChange: string;
}

interface Activity {
  id: string;
  type: "inquiry" | "view" | "verification" | "message";
  message: string;
  time: string;
  read: boolean;
}

interface Appointment {
  id: string;
  title: string;
  property: string;
  client: string;
  date: string;
  time: string;
}

// Base navigation items (always shown)
const baseNavigation = [
  { name: "Overview", href: "/dashboard", icon: Home, current: true },
  { name: "My Properties", href: "/dashboard/properties", icon: Building2, current: false },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare, badge: 0, current: false },
  { name: "Saved", href: "/dashboard/saved", icon: Heart, current: false },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, current: false },
  { name: "Payments", href: "/dashboard/payments", icon: Wallet, current: false },
  { name: "Documents", href: "/dashboard/documents", icon: FileText, current: false },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, current: false },
];

// Admin navigation item (only shown to admins)
const adminNavigationItem = { 
  name: "Admin Dashboard", 
  href: "/admin", 
  icon: Shield, 
  current: false 
};


// Stats configuration
const statsConfig = [
  {
    name: "Total Properties",
    key: "totalProperties" as const,
    changeKey: "propertyChange" as const,
    icon: Building2,
    color: "blue",
    format: (v: number) => v.toString(),
  },
  {
    name: "Total Views",
    key: "totalViews" as const,
    changeKey: "viewsChange" as const,
    icon: Eye,
    color: "green",
    format: (v: number) => v.toLocaleString(),
  },
  {
    name: "Messages",
    key: "totalMessages" as const,
    changeKey: "messagesChange" as const,
    icon: MessageSquare,
    color: "purple",
    format: (v: number) => v.toString(),
  },
  {
    name: "Revenue",
    key: "revenue" as const,
    changeKey: "revenueChange" as const,
    icon: DollarSign,
    color: "orange",
    format: (v: number) => formatCurrency(v, "UGX"),
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  
  // Protect route: Only LISTER, PROPERTY_MANAGER can access
  const { hasAccess } = useRequireRole(
    ['lister', 'property_manager'],
    '/'
  );
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    totalViews: 0,
    totalMessages: 0,
    revenue: 0,
    propertyChange: "0",
    viewsChange: "0%",
    messagesChange: "0",
    revenueChange: "0%",
  });
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Debug logging - MUST be before any conditional returns
  useEffect(() => {
    console.log('[DASHBOARD] Auth state:', {
      isAuthenticated,
      authLoading,
      userRole: user?.role,
      hasAccess,
      user: user ? { id: user.id, email: user.email, role: user.role } : null,
    });
  }, [isAuthenticated, authLoading, user, hasAccess]);

  // Fetch dashboard data - MUST be before any conditional returns
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch user's properties
        try {
          const propertiesResponse = await propertyService.getMyListings(1, 100); // Get all properties for stats
          console.log("Dashboard - Properties response:", propertiesResponse);
          console.log("Dashboard - Properties data:", propertiesResponse.data);
          const allProperties = propertiesResponse.data || [];
          const recentProps = allProperties.slice(0, 3); // Show only first 3 as recent
          setRecentProperties(recentProps);
          
          // Use total from meta if available, otherwise use array length
          const totalPropertiesCount = propertiesResponse.meta?.total || allProperties.length;
          
          // Calculate stats from properties
          const totalViews = allProperties.reduce((sum, p) => sum + (p.views || 0), 0);
          const totalLeads = allProperties.reduce((sum, p) => sum + (p.leads || 0), 0);
          const revenue = allProperties
            .filter(p => p.status === 'sold' || p.status === 'rented')
            .reduce((sum, p) => sum + (p.price || 0), 0);
          
          setStats({
            totalProperties: totalPropertiesCount,
            totalViews: totalViews,
            totalMessages: totalLeads, // Using leads as messages for now
            revenue: revenue,
            propertyChange: "0",
            viewsChange: "0%",
            messagesChange: "0",
            revenueChange: "0%",
          });
        } catch (error) {
          console.error("Failed to fetch user properties:", error);
          setRecentProperties([]);
        }
        
        // Fetch activities from API
        try {
          const activitiesResponse = await dashboardService.getActivities();
          setRecentActivities(activitiesResponse || []);
        } catch (error) {
          console.error("Failed to fetch activities:", error);
          setRecentActivities([]);
        }
        
        // Fetch appointments from API
        try {
          const appointmentsResponse = await dashboardService.getAppointments();
          setAppointments(appointmentsResponse || []);
        } catch (error) {
          console.error("Failed to fetch appointments:", error);
          setAppointments([]);
        }
        
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if user has access
    if (isAuthenticated && !authLoading && hasAccess) {
      fetchDashboardData();
    }
  }, [isAuthenticated, authLoading, hasAccess]);

  // Refresh when page becomes visible (after navigation back)
  useEffect(() => {
    const handleFocus = () => {
      // Only refresh if user has access
      if (isAuthenticated && hasAccess) {
        propertyService.getMyListings(1, 3)
          .then((response) => {
            console.log("Dashboard focus refresh - Properties:", response.data);
            setRecentProperties(response.data || []);
          })
          .catch((error) => {
            console.error("Failed to refresh on focus:", error);
          });
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isAuthenticated, hasAccess]);

  // Display name from user or fallback
  const displayName = user ? `${user.firstName} ${user.lastName}` : "User";
  const userEmail = user?.email || "user@example.com";
  const userInitials = user 
    ? `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase()
    : "U";

  // NOW we can do conditional returns - all hooks are called above
  // Show loading or redirect if user doesn't have access
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !hasAccess) {
    console.warn('[DASHBOARD] Access denied:', {
      isAuthenticated,
      hasAccess,
      userRole: user?.role,
      allowedRoles: ['lister', 'property_manager', 'admin'],
    });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-2">Access Denied</h2>
          <p className="text-slate-600 text-center mb-6">
            You need to be a property lister, property manager, or admin to access the dashboard.
            {user && (
              <span className="block mt-2 text-sm">
                Your current role: <strong>{user.role}</strong>
              </span>
            )}
          </p>
          <Button onClick={() => router.push('/')} className="w-full">
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r hidden lg:block">
        <div className="flex flex-col h-full">
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
            {baseNavigation.map((item) => (
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
                {item.badge && (
                  <Badge className="ml-auto bg-red-500 text-white text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
            {/* Admin Panel Link - Only visible to admins */}
            {user?.role === "admin" && (
              <Link
                href={adminNavigationItem.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition border-t border-slate-200 mt-2 pt-4",
                  "text-slate-600 hover:bg-slate-50"
                )}
              >
                <adminNavigationItem.icon className="w-5 h-5" />
                {adminNavigationItem.name}
              </Link>
            )}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
                  {user?.isVerified && <BadgeCheck className="w-4 h-4 text-green-500" />}
                </div>
                <p className="text-xs text-slate-500 truncate">{userEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white border-b">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search properties, messages..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const query = (e.target as HTMLInputElement).value;
                      if (query.trim()) {
                        router.push(`/properties?search=${encodeURIComponent(query)}`);
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 ml-4">
              <Button variant="outline" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {stats.totalMessages > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {stats.totalMessages > 9 ? '9+' : stats.totalMessages}
                  </span>
                )}
              </Button>
              <Link
                href="/listings/create"
                className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Listing
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              Welcome back, {displayName.split(" ")[0]}! 👋
            </h1>
            <p className="text-slate-500">
              Here&apos;s what&apos;s happening with your properties today.
            </p>
          </div>


          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsConfig.map((statConfig) => {
              const value = stats[statConfig.key];
              const change = stats[statConfig.changeKey];
              const hasPositiveChange = change && !change.includes('-') && change !== '0' && change !== '0%';
              
              return (
                <Card key={statConfig.name} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        statConfig.color === "blue" && "bg-blue-100",
                        statConfig.color === "green" && "bg-green-100",
                        statConfig.color === "purple" && "bg-purple-100",
                        statConfig.color === "orange" && "bg-orange-100"
                      )}
                    >
                      <statConfig.icon
                        className={cn(
                          "w-6 h-6",
                          statConfig.color === "blue" && "text-blue-600",
                          statConfig.color === "green" && "text-green-600",
                          statConfig.color === "purple" && "text-purple-600",
                          statConfig.color === "orange" && "text-orange-600"
                        )}
                      />
                    </div>
                    {change && change !== '0' && change !== '0%' && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs border bg-opacity-50",
                          hasPositiveChange
                            ? "text-green-600 border-green-200 bg-green-50"
                            : "text-red-600 border-red-200 bg-red-50"
                        )}
                      >
                        {hasPositiveChange ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {change}
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mb-1">
                    {statConfig.format(value)}
                  </p>
                  <p className="text-sm text-slate-500">{statConfig.name}</p>
                  {value === 0 && statConfig.name !== "Revenue" && (
                    <p className="text-xs text-slate-400 mt-2">
                      {statConfig.name === "Total Properties" && "Start by listing your first property"}
                      {statConfig.name === "Total Views" && "Views will appear once you have listings"}
                      {statConfig.name === "Messages" && "Messages from buyers will appear here"}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Properties List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Properties */}
              <Card>
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Recent Properties</h2>
                    <Link
                      href="/dashboard/properties"
                      className="text-sm text-blue-600 hover:underline flex items-center"
                    >
                      View All
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                <div className="divide-y">
                  {recentProperties && recentProperties.length > 0 ? (
                    recentProperties.map((property) => (
                    <div key={property.id} className="p-4 hover:bg-slate-50 transition">
                      <div className="flex gap-4">
                        <div className="w-24 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-200">
                          {property.images && property.images[0] ? (
                            <img
                              src={property.images[0].url}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="w-8 h-8 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-slate-900 truncate">
                                  {property.title}
                                </h3>
                                {property.isVerified && (
                                  <BadgeCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-slate-500">
                                {property.location.district}, {property.location.city}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={property.status === "active" ? "default" : "secondary"}
                                className={cn(
                                  "text-xs",
                                  property.status === "active" && "bg-green-500",
                                  property.status === "pending" && "bg-yellow-500"
                                )}
                              >
                                {property.status}
                              </Badge>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 mt-2">
                            <p className="font-semibold text-blue-600">
                              {formatCurrency(property.price, "UGX")}
                            </p>
                            <span className="flex items-center gap-1 text-sm text-slate-500">
                              <Eye className="w-4 h-4" />
                              {property.views || 0}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-slate-500">
                              <MessageSquare className="w-4 h-4" />
                              0
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                  ) : (
                    <div className="p-8 text-center">
                      <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 mb-4">No properties yet</p>
                      <Link
                        href="/listings/create"
                        className="inline-flex items-center justify-center h-9 px-4 text-sm rounded-lg font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Property
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Activity */}
              <Card>
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
                </div>
                <div className="divide-y">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className={cn(
                        "p-4 hover:bg-slate-50 transition",
                        !activity.read && "bg-blue-50"
                      )}
                    >
                      <div className="flex gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            activity.type === "inquiry" && "bg-blue-100",
                            activity.type === "view" && "bg-green-100",
                            activity.type === "verification" && "bg-purple-100",
                            activity.type === "message" && "bg-orange-100"
                          )}
                        >
                          {activity.type === "inquiry" && (
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                          )}
                          {activity.type === "view" && <Eye className="w-4 h-4 text-green-600" />}
                          {activity.type === "verification" && (
                            <BadgeCheck className="w-4 h-4 text-purple-600" />
                          )}
                          {activity.type === "message" && (
                            <MessageSquare className="w-4 h-4 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-slate-700">{activity.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    </div>
                  ))
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 mb-2">No recent activity</p>
                      <p className="text-xs text-slate-400 mb-4">
                        Your property views, inquiries, and updates will appear here
                      </p>
                      <Link href="/dashboard/properties">
                        <Button variant="outline" size="sm">
                          View Properties
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t">
                  <Button variant="ghost" className="w-full" size="sm">
                    View All Activity
                  </Button>
                </div>
              </Card>

              {/* Upcoming Appointments */}
              <Card>
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-slate-900">Upcoming</h2>
                </div>
                <div className="divide-y">
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => (
                    <div key={appointment.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{appointment.title}</p>
                          <p className="text-xs text-slate-500">{appointment.property}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {appointment.date} at {appointment.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                  ) : (
                    <div className="p-8 text-center">
                      <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 mb-2">No upcoming appointments</p>
                      <p className="text-xs text-slate-400 mb-4">
                        Schedule property viewings and meetings with potential buyers
                      </p>
                      <Button variant="outline" size="sm" onClick={() => {
                        // TODO: Open appointment scheduling modal
                        console.log("Schedule appointment");
                      }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule Now
                      </Button>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t">
                  <Button variant="outline" className="w-full" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Appointment
                  </Button>
                </div>
              </Card>

              {/* Verification Reminder - Only show if user is not verified */}
              {user && !user.isVerified && (
                <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 mb-1">Complete Verification</h3>
                      <p className="text-sm text-slate-600 mb-3">
                        Verify your account to unlock all features and build trust with buyers.
                      </p>
                      <Button 
                        size="sm" 
                        className="bg-yellow-600 hover:bg-yellow-700"
                        onClick={() => router.push('/dashboard/settings')}
                      >
                        Verify Now
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
