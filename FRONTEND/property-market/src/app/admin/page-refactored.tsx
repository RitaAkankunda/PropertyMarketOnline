"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Building2,
  BadgeCheck,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Eye,
  Settings,
  BarChart3,
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { useAuthStore } from "@/store";
import { adminService } from "@/services/admin.service";
import { Card } from "@/components/ui";

interface DashboardStats {
  totalUsers: number;
  totalProviders: number;
  pendingVerifications: number;
  totalProperties: number;
  revenue: number;
  activeListings: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: any;
  href: string;
  badge?: number;
  color: string;
}

interface AdminDashboardProps {
  // Add any admin-specific props if needed
}

export default function AdminDashboardPage({}: AdminDashboardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProviders: 0,
    pendingVerifications: 0,
    totalProperties: 0,
    revenue: 0,
    activeListings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }

    if (user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await adminService.getStats();
        setStats(response);
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
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
      icon: Users,
      color: "blue",
    },
    {
      title: "Listers & Managers",
      value: loading ? "..." : stats.totalProviders.toLocaleString(),
      icon: BadgeCheck,
      color: "green",
    },
    {
      title: "Pending Verifications",
      value: loading ? "..." : stats.pendingVerifications.toLocaleString(),
      icon: AlertCircle,
      color: "orange",
    },
    {
      title: "Total Properties",
      value: loading ? "..." : stats.totalProperties.toLocaleString(),
      icon: Building2,
      color: "purple",
    },
  ];

  const quickActions: QuickAction[] = [
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
      title: "Reports",
      description: "Generate and view system reports",
      icon: FileText,
      href: "/admin/reports",
      color: "indigo",
    },
    {
      title: "Settings",
      description: "Configure platform settings",
      icon: Settings,
      href: "/admin/settings",
      color: "gray",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage the platform and oversee operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Additional Admin-Specific Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {/* Add recent activity items */}
              <p className="text-gray-600">Recent user registrations, property listings, etc.</p>
            </div>
          </Card>

          {/* System Health */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
            <div className="space-y-4">
              {/* Add system health metrics */}
              <p className="text-gray-600">Server status, database health, etc.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}