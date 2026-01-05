"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  BadgeCheck,
  AlertCircle,
  TrendingUp,
  Settings,
  BarChart3,
  FileText,
  Shield,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { useAuthStore } from "@/store";
import { useRouter } from "next/navigation";
import { adminService } from "@/services";
import type { AdminStats } from "@/services/admin.service";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to fetch admin stats:", err);
      setError(err.message || "Failed to load statistics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    
    // Fetch stats on mount
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, [user, router]);

  if (!user || user.role !== "admin") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error || "Something went wrong"}</p>
          <Button onClick={fetchStats}>Try Again</Button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      change: "",
      icon: Users,
      color: "blue",
    },
    {
      title: "Service Providers",
      value: stats.totalProviders.toLocaleString(),
      change: "",
      icon: BadgeCheck,
      color: "green",
    },
    {
      title: "Pending Verifications",
      value: stats.pendingVerifications.toLocaleString(),
      change: "",
      icon: AlertCircle,
      color: "orange",
    },
    {
      title: "Total Properties",
      value: stats.totalProperties.toLocaleString(),
      change: "",
      icon: Building2,
      color: "purple",
    },
  ];

  const quickActions = [
    {
      title: "Verify Providers",
      description: "Review pending provider verifications",
      icon: BadgeCheck,
      href: "/admin/verifications",
      badge: stats.pendingVerifications,
      color: "orange",
    },
    {
      title: "Manage Users",
      description: "View and manage user accounts",
      icon: Users,
      href: "/admin/users",
      color: "blue",
    },
    {
      title: "Properties",
      description: "Review and manage property listings",
      icon: Building2,
      href: "/admin/properties",
      color: "purple",
    },
    {
      title: "Analytics",
      description: "View platform analytics and reports",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "green",
    },
    {
      title: "Settings",
      description: "Configure platform settings",
      icon: Settings,
      href: "/admin/settings",
      color: "slate",
    },
    {
      title: "Reports",
      description: "View flagged content and reports",
      icon: FileText,
      href: "/admin/reports",
      color: "red",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "verification",
      message: "New provider verification request from John's Electrical",
      time: "5 minutes ago",
      status: "pending",
    },
    {
      id: 2,
      type: "property",
      message: "New property listing in Kampala",
      time: "15 minutes ago",
      status: "active",
    },
    {
      id: 3,
      type: "user",
      message: "New user registration",
      time: "1 hour ago",
      status: "active",
    },
    {
      id: 4,
      type: "verification",
      message: "Provider verification approved for Smith Plumbing",
      time: "2 hours ago",
      status: "approved",
    },
  ];

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage and monitor your platform
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={fetchStats}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
              green: { bg: "bg-green-500/10", text: "text-green-500" },
              orange: { bg: "bg-orange-500/10", text: "text-orange-500" },
              purple: { bg: "bg-purple-500/10", text: "text-purple-500" },
            };
            const colors = colorClasses[stat.color as keyof typeof colorClasses];
            
            return (
              <Card key={stat.title}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    {stat.change && (
                      <span className="text-sm font-medium text-green-500">
                        {stat.change}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    const colorClasses = {
                      blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
                      green: { bg: "bg-green-500/10", text: "text-green-500" },
                      orange: { bg: "bg-orange-500/10", text: "text-orange-500" },
                      purple: { bg: "bg-purple-500/10", text: "text-purple-500" },
                      slate: { bg: "bg-slate-500/10", text: "text-slate-500" },
                      red: { bg: "bg-red-500/10", text: "text-red-500" },
                    };
                    const colors = colorClasses[action.color as keyof typeof colorClasses];
                    
                    return (
                      <Link key={action.title} href={action.href}>
                        <div className="p-4 border rounded-lg hover:border-primary hover:bg-slate-50 transition-colors cursor-pointer relative">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-5 h-5 ${colors.text}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1 flex items-center gap-2">
                                {action.title}
                                {action.badge && action.badge > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {action.badge}
                                  </Badge>
                                )}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {action.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="mt-6">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 pb-4 border-b last:border-0"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === "verification"
                            ? "bg-orange-100"
                            : activity.type === "property"
                            ? "bg-purple-100"
                            : "bg-blue-100"
                        }`}
                      >
                        {activity.type === "verification" && (
                          <BadgeCheck className="w-5 h-5 text-orange-500" />
                        )}
                        {activity.type === "property" && (
                          <Building2 className="w-5 h-5 text-purple-500" />
                        )}
                        {activity.type === "user" && (
                          <Users className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">
                          {activity.message}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {activity.time}
                          </span>
                          <Badge
                            variant={
                              activity.status === "pending"
                                ? "secondary"
                                : activity.status === "approved"
                                ? "default"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Platform Health */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Platform Health</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        Active Users
                      </span>
                      <span className="text-sm font-medium">87%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-green-500 h-2 w-[87%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        Verified Providers
                      </span>
                      <span className="text-sm font-medium">72%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-500 h-2 w-[72%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        System Uptime
                      </span>
                      <span className="text-sm font-medium">99.9%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-green-500 h-2 w-[99.9%]" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Revenue Overview */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      This Month
                    </p>
                    <p className="text-2xl font-bold">
                      UGX {stats.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 font-medium">+18.2%</span>
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Pending Tasks */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Pending Tasks</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">Verifications</span>
                    </div>
                    <Badge variant="destructive">{stats.pendingVerifications}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Reports</span>
                    </div>
                    <Badge variant="secondary">5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Flagged Content</span>
                    </div>
                    <Badge variant="secondary">3</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
