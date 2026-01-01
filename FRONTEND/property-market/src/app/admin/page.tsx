"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Building2,
  BadgeCheck,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  UserCheck,
  TrendingDown,
} from "lucide-react";
import { Card } from "@/components/ui";
import { useAuthStore } from "@/store";
import { useRouter } from "next/navigation";
import { adminService } from "@/services/admin.service";

interface DashboardStats {
  totalUsers: number;
  totalProviders: number;
  pendingVerifications: number;
  totalProperties: number;
  revenue: number;
  activeListings: number;
  totalListers: number;
  totalPropertyManagers: number;
  totalBuyers: number;
  totalRenters: number;
}

interface ActivityItem {
  id: string;
  type: "user" | "property" | "verification" | "system";
  message: string;
  time: string;
  status: "success" | "warning" | "info";
  user?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProviders: 0,
    pendingVerifications: 0,
    totalProperties: 0,
    revenue: 0,
    activeListings: 0,
    totalListers: 0,
    totalPropertyManagers: 0,
    totalBuyers: 0,
    totalRenters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Wait for auth to load before checking
    if (authLoading) {
      return;
    }

    // Check if user is authenticated and is admin
    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }

    if (user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    // Fetch real admin stats
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await adminService.getStats();
        setStats({
          totalUsers: response.totalUsers || 0,
          totalProviders: response.totalProviders || 0,
          pendingVerifications: response.pendingVerifications || 0,
          totalProperties: response.totalProperties || 0,
          revenue: response.revenue || 0,
          activeListings: response.activeListings || 0,
          totalListers: response.totalListers || 0,
          totalPropertyManagers: response.totalPropertyManagers || 0,
          totalBuyers: response.totalBuyers || 0,
          totalRenters: response.totalRenters || 0,
        });

        // Clear recent activity since no real data is available yet
        setRecentActivity([]);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        // Keep default values if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, isAuthenticated, authLoading, router]);

  const statCards = [
    {
      title: "Total Users",
      value: loading ? "..." : stats.totalUsers.toLocaleString(),
      change: "",
      icon: Users,
      color: "blue",
      trend: "neutral",
    },
    {
      title: "Property Managers",
      value: loading ? "..." : stats.totalPropertyManagers.toLocaleString(),
      change: "",
      icon: UserCheck,
      color: "green",
      trend: "neutral",
    },
    {
      title: "Total Properties",
      value: loading ? "..." : stats.totalProperties.toLocaleString(),
      change: "",
      icon: Building2,
      color: "purple",
      trend: "neutral",
    },
    {
      title: "Active Listings",
      value: loading ? "..." : stats.activeListings.toLocaleString(),
      change: "",
      icon: Activity,
      color: "teal",
      trend: "neutral",
    },
    {
      title: "Pending Verifications",
      value: loading ? "..." : stats.pendingVerifications.toLocaleString(),
      change: stats.pendingVerifications > 5 ? "High Priority" : "Normal",
      icon: AlertCircle,
      color: stats.pendingVerifications > 5 ? "red" : "orange",
      trend: "neutral",
    },
    {
      title: "Monthly Revenue",
      value: loading ? "..." : `UGX ${stats.revenue.toLocaleString()}`,
      change: "",
      icon: DollarSign,
      color: "emerald",
      trend: "neutral",
    },
  ];

  // Recent activity is now populated from state

  // Show loading while auth is being checked or data is being fetched
  if (authLoading || loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="mt-4 text-slate-700 font-medium">
            {authLoading ? "Checking authentication..." : "Loading admin dashboard..."}
          </p>
          <p className="text-sm text-slate-500 mt-2">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not admin (redirect is happening)
  if (!isAuthenticated || !user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Desktop Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Here's what's happening with your platform today
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                System Online
              </div>
              <div className="text-sm text-slate-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

          {/* Welcome Section */}
          <div className="mb-8">
            <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName}!</h1>
                    <p className="text-blue-100 text-lg mb-4">
                      Here's what's happening with your property marketplace today.
                    </p>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span>System Online</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Last updated: {new Date().toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-2xl font-bold">{loading ? "..." : stats.totalUsers.toLocaleString()}</div>
                        <div className="text-xs text-blue-100">Total Users</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-2xl font-bold">{loading ? "..." : stats.totalProperties.toLocaleString()}</div>
                        <div className="text-xs text-blue-100">Properties</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-32 h-32 bg-white/5 rounded-full"></div>
              <div className="absolute -top-1 -left-1 w-24 h-24 bg-white/5 rounded-full"></div>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              const colorClasses = {
                blue: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-200" },
                green: { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-200" },
                orange: { bg: "bg-orange-500/10", text: "text-orange-600", border: "border-orange-200" },
                purple: { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-200" },
                red: { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-200" },
                emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-200" },
                teal: { bg: "bg-teal-500/10", text: "text-teal-600", border: "border-teal-200" },
              };
              const colors = colorClasses[stat.color as keyof typeof colorClasses];
            
            return (
              <Card key={stat.title} className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${colors.border} bg-gradient-to-br from-white to-slate-50/50`}>
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/20 to-transparent rounded-bl-full"></div>
                <div className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shadow-sm`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    {stat.change && (
                      <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${
                        stat.trend === 'up' ? 'bg-green-100 text-green-700' : 
                        stat.trend === 'down' ? 'bg-red-100 text-red-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {stat.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                        {stat.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                        {stat.change}
                      </div>
                    )}
                  </div>
                  <h3 className="text-3xl font-bold mb-2 text-slate-800">{stat.value}</h3>
                  <p className="text-sm text-slate-600 font-medium">{stat.title}</p>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-8">
          {/* Recent Activity */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-slate-50/50">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-slate-800">Recent Activity</h2>
                </div>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-8 h-8 text-indigo-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Activity Feed Coming Soon</h3>
                      <p className="text-slate-600 mb-4 max-w-md mx-auto">
                        Real-time activity logs will help you monitor user actions, property listings, and system events as they happen.
                      </p>
                      <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>User registrations</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Property listings</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>System events</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    recentActivity.map((activity) => {
                      const statusColors = {
                        success: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
                        warning: { bg: "bg-orange-100", text: "text-orange-700", icon: AlertCircle },
                        info: { bg: "bg-blue-100", text: "text-blue-700", icon: Activity },
                      };
                      const status = statusColors[activity.status];
                      const StatusIcon = status.icon;
                      
                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 rounded-lg p-3 -m-3 transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${status.bg}`}>
                            <StatusIcon className={`w-5 h-5 ${status.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 mb-1 leading-relaxed">
                              {activity.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500">
                                {activity.time}
                              </span>
                              {activity.user && (
                                <span className="text-xs text-slate-600 font-medium">
                                  {activity.user}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </Card>
          </div>
    </div>
  );
}
