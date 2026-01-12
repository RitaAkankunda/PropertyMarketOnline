"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Home, Search, Plus, User, Menu, X, MessageSquare, Bell, Building2, Wrench, LogIn, MapPin, Truck, ChevronDown, Briefcase, Wallet, Settings, Calendar } from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth } from "@/hooks";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { notificationsService } from "@/services";
import type { Notification as ApiNotification } from "@/services/notifications.service";

const mainNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/category/buy", label: "Buy", icon: Home },
  { href: "/category/rent", label: "Rent", icon: Building2 },
  { href: "/category/lease", label: "Lease", icon: MapPin },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/providers", label: "Service Providers", icon: Wrench },
];

const listerNavLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/listings/create", label: "List Property", icon: Plus },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

const userNavLinks = [
  { href: "/dashboard/user", label: "My Requests", icon: Home },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

const adminNavLinks = [
  { href: "/admin", label: "Admin Dashboard", icon: Home },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

const providerNavLinks = [
  { href: "/dashboard/provider", label: "Provider Dashboard", icon: Briefcase },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  // Check if user is a service provider
  const isServiceProvider = user?.role === 'service_provider' || user?.role === 'property_manager';
  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  // Check if user is a lister (can list properties)
  const isLister = user?.role === 'lister' || user?.role === 'property_manager';
  
  // Get role badge info - only show for special roles (admin, provider, lister)
  // Regular users don't need a badge
  const getRoleBadge = () => {
    if (isAdmin) {
      return { label: 'Admin', color: 'bg-purple-100 text-purple-700 border-purple-200' };
    }
    if (isServiceProvider) {
      return { label: 'Provider', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
    if (isLister) {
      return { label: 'Lister', color: 'bg-green-100 text-green-700 border-green-200' };
    }
    // Regular users (buyers, renters, or anyone who just signed up) - no badge
    return null;
  };
  
  const roleBadge = getRoleBadge();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      const response = await notificationsService.getNotifications({
        limit: 50,
        offset: 0,
      });
      
      // Filter notifications based on user role
      if (isServiceProvider) {
        // Service providers only see job-related notifications
        const jobRelatedTypes = [
          'job_created',
          'job_accepted',
          'job_rejected',
          'job_started',
          'job_completed',
          'job_cancelled',
          'job_status_updated',
          'maintenance_ticket_created',
          'maintenance_ticket_assigned',
          'maintenance_ticket_status_updated',
          'maintenance_ticket_job_linked',
        ];
        setNotifications((response.notifications || []).filter((n: ApiNotification) => 
          jobRelatedTypes.includes(n.type)
        ));
      } else {
        // Other users see all their notifications
        setNotifications(response.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    }
  }, [isAuthenticated, user, isServiceProvider]);

  // Fetch notifications on mount and when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.id, fetchNotifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
      }
    }

    if (profileMenuOpen || showNotificationDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [profileMenuOpen, showNotificationDropdown]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary hidden sm:inline-block">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname === link.href && "bg-accent text-accent-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
              {isAuthenticated && (
                isAdmin ? (
                  adminNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        pathname === link.href && "bg-accent text-accent-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))
                ) : isServiceProvider ? (
                  // Show only provider links for service providers
                  providerNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        pathname === link.href && "bg-accent text-accent-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))
                ) : isLister ? (
                  // Show lister links only for listers
                  listerNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        pathname === link.href && "bg-accent text-accent-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))
                ) : (
                  // Show simple user links for regular users (no "List Property", no role badge)
                  userNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        pathname === link.href && "bg-accent text-accent-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))
                )
              )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Role Badge - Only show for listers, providers, and admins */}
                {roleBadge && (
                  <div className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium border",
                    roleBadge.color
                  )}>
                    {roleBadge.label}
                  </div>
                )}
                
                {/* Hide bookings icon for service providers - they manage jobs in their dashboard */}
                {!isServiceProvider && (
                  <Link
                    href="/bookings"
                    className="inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="My Bookings"
                  >
                    <Calendar className="h-5 w-5" />
                  </Link>
                )}
                <div className="relative" ref={notificationMenuRef}>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const newState = !showNotificationDropdown;
                      setShowNotificationDropdown(newState);
                      if (newState) {
                        await fetchNotifications();
                      }
                    }}
                    className="inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors relative"
                  >
                    <Bell className="h-5 w-5" />
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                        {notifications.filter(n => !n.isRead).length > 9 ? '9+' : notifications.filter(n => !n.isRead).length}
                      </span>
                    )}
                  </button>
                  
                  {/* Notification Dropdown */}
                  {showNotificationDropdown && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowNotificationDropdown(false)}
                      />
                      
                      {/* Dropdown Panel */}
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200 max-h-96 overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            <p className="text-sm text-gray-500">
                              {notifications.filter(n => !n.isRead).length} unread
                            </p>
                          </div>
                          <button
                            onClick={() => setShowNotificationDropdown(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {/* Notifications List */}
                        <div className="overflow-y-auto flex-1">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                              <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                              <p>No notifications</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {notifications.map((notification) => (
                                <div
                                  key={notification.id}
                                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                    !notification.isRead ? 'bg-blue-50' : ''
                                  }`}
                                  onClick={async () => {
                                    // Mark as read
                                    if (!notification.isRead) {
                                      try {
                                        await notificationsService.markAsRead(notification.id);
                                        setNotifications(prev =>
                                          prev.map(n =>
                                            n.id === notification.id ? { ...n, isRead: true } : n
                                          )
                                        );
                                      } catch (err) {
                                        console.error('Error marking notification as read:', err);
                                      }
                                    }
                                    
                                    // Navigate based on notification type
                                    setShowNotificationDropdown(false);
                                    
                                    if (notification.data?.jobId) {
                                      // For service providers, navigate to provider dashboard with job
                                      if (isServiceProvider) {
                                        router.push(`/dashboard/provider?jobId=${notification.data.jobId}`);
                                      } else {
                                        router.push(`/bookings`);
                                      }
                                    } else if (notification.data?.bookingId) {
                                      router.push(`/bookings`);
                                    } else if (notification.data?.propertyId) {
                                      router.push(`/properties/${notification.data.propertyId}`);
                                    } else {
                                      router.push('/notifications');
                                    }
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                      !notification.isRead ? 'bg-blue-500' : 'bg-transparent'
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                      <p className={`font-medium text-sm ${
                                        !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                                      }`}>
                                        {notification.title}
                                      </p>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-2">
                                        {new Date(notification.createdAt).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Footer */}
                        {notifications.length > 0 && (
                          <div className="p-3 border-t border-gray-200">
                            <button
                              onClick={async () => {
                                try {
                                  await notificationsService.markAllAsRead();
                                  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                                } catch (err) {
                                  console.error('Error marking all as read:', err);
                                }
                              }}
                              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Mark all as read
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <Link
                  href="/messages"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>
                <div className="relative" ref={profileMenuRef}>
                  <button 
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {/* Profile Picture Circle */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.firstName || "User"} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{user?.firstName}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", profileMenuOpen && "rotate-180")} />
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 py-2 bg-background rounded-lg shadow-lg border z-50">
                      {isAdmin ? (
                        <>
                          <Link
                            href="/admin"
                            onClick={() => setProfileMenuOpen(false)}
                            className="block px-4 py-2 text-sm hover:bg-accent flex items-center gap-2"
                          >
                            <Home className="h-4 w-4" />
                            Admin Dashboard
                          </Link>
                          <hr className="my-2" />
                          <Link
                            href="/profile"
                            onClick={() => setProfileMenuOpen(false)}
                            className="block px-4 py-2 text-sm hover:bg-accent"
                          >
                            Profile
                          </Link>
                          <Link
                            href="/settings"
                            onClick={() => setProfileMenuOpen(false)}
                            className="block px-4 py-2 text-sm hover:bg-accent"
                          >
                            Settings
                          </Link>
                        </>
                      ) : isServiceProvider ? (
                        <>
                          <Link
                            href="/dashboard/provider"
                            onClick={() => setProfileMenuOpen(false)}
                            className="block px-4 py-2 text-sm hover:bg-accent flex items-center gap-2"
                          >
                            <Briefcase className="h-4 w-4" />
                            Provider Dashboard
                          </Link>
                          <Link
                            href="/dashboard/provider?tab=profile"
                            onClick={() => setProfileMenuOpen(false)}
                            className="block px-4 py-2 text-sm hover:bg-accent flex items-center gap-2"
                          >
                            <User className="h-4 w-4" />
                            My Provider Profile
                          </Link>
                          <Link
                            href="/dashboard/provider?tab=earnings"
                            onClick={() => setProfileMenuOpen(false)}
                            className="block px-4 py-2 text-sm hover:bg-accent flex items-center gap-2"
                          >
                            <Wallet className="h-4 w-4" />
                            Earnings
                          </Link>
                          <hr className="my-2" />
                          <Link
                            href="/profile"
                            onClick={() => setProfileMenuOpen(false)}
                            className="block px-4 py-2 text-sm hover:bg-accent"
                          >
                            Account Profile
                          </Link>
                          <Link
                            href="/settings"
                            onClick={() => setProfileMenuOpen(false)}
                            className="block px-4 py-2 text-sm hover:bg-accent flex items-center gap-2"
                          >
                            <Settings className="h-4 w-4" />
                            Settings
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/profile"
                            onClick={() => setProfileMenuOpen(false)}
                            className="block px-4 py-2 text-sm hover:bg-accent"
                          >
                            Profile
                          </Link>
                          <Link
                            href="/settings"
                            onClick={() => setProfileMenuOpen(false)}
                            className="block px-4 py-2 text-sm hover:bg-accent"
                          >
                            Settings
                          </Link>
                        </>
                      )}
                      <hr className="my-2" />
                      <button
                        onClick={() => {
                          logout();
                          setProfileMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-accent"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-2">
              {mainNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-accent",
                    pathname === link.href && "bg-accent"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              ))}
              {isAuthenticated && (
                isAdmin ? (
                  adminNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-accent",
                        pathname === link.href && "bg-accent"
                      )}
                    >
                      <link.icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  ))
                ) : isServiceProvider ? (
                  // Show only provider links for service providers
                  providerNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-accent",
                        pathname === link.href && "bg-accent"
                      )}
                    >
                      <link.icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  ))
                ) : isLister ? (
                  // Show lister links only for listers
                  listerNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-accent",
                        pathname === link.href && "bg-accent"
                      )}
                    >
                      <link.icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  ))
                ) : (
                  // Show simple user links for regular users (no "List Property")
                  userNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-accent",
                        pathname === link.href && "bg-accent"
                      )}
                    >
                      <link.icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  ))
                )
              )}
              <hr className="my-2" />
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-accent"
                  >
                    {/* Profile Picture Circle */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium overflow-hidden flex-shrink-0">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.firstName || "User"} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                      )}
                    </div>
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-accent w-full"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium hover:bg-accent"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Login</span>
                  </Link>
                  <div className="px-4 py-2">
                    <Link
                      href="/auth/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center w-full h-10 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                    >
                      Get Started
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
