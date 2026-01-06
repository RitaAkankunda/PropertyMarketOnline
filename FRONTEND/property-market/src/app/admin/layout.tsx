"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  Building2,
  BadgeCheck,
  Settings,
  BarChart3,
  FileText,
  DollarSign,
  Shield,
  Home,
  ChevronLeft,
  Menu,
  LogOut,
  Wrench,
  Search,
  Bell,
  HelpCircle,
} from "lucide-react";
import { Button, Avatar } from "@/components/ui";
import { useAuthStore } from "@/store";
import { cn } from "@/lib/utils";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Home,
    description: "Overview and key metrics",
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Manage user accounts",
  },
  {
    title: "Service Providers",
    href: "/admin/providers",
    icon: Wrench,
    description: "Manage service providers",
  },
  {
    title: "Properties",
    href: "/admin/properties",
    icon: Building2,
    description: "Review property listings",
  },
  {
    title: "Verifications",
    href: "/admin/verifications",
    icon: BadgeCheck,
    description: "Provider verifications",
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    description: "Platform analytics",
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: FileText,
    description: "System reports",
  },
  {
    title: "Revenue",
    href: "/admin/revenue",
    icon: DollarSign,
    description: "Revenue tracking",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Platform settings",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      console.log('[ADMIN LAYOUT] User not authenticated, redirecting to login');
      router.push("/auth/login");
      return;
    }

    // Check if user is admin
    if (user.role !== "admin") {
      console.log('[ADMIN LAYOUT] User is not admin. Role:', user.role, 'User:', user);
      router.push("/dashboard");
      return;
    }
  }, [user, isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not admin
  if (!isAuthenticated || !user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-sm border-r border-slate-200/60 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Admin Panel</h2>
                <p className="text-xs text-slate-500">Management Center</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-blue-50 border border-blue-200 text-blue-700 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive
                        ? "text-blue-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-slate-500">{item.description}</div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-200/60">
            <Link href="/profile" onClick={() => setSidebarOpen(false)}>
              <div className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                <Avatar
                  name={user ? `${user.firstName} ${user.lastName}` : "Admin"}
                  size="sm"
                  className="h-10 w-10"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {user ? `${user.firstName} ${user.lastName}` : "Admin"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="hidden md:flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm text-slate-600 placeholder-slate-400 w-64"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="icon">
                <HelpCircle className="w-5 h-5" />
              </Button>
              <Link href="/">
                <Button variant="ghost" size="sm">
                  View Site
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

