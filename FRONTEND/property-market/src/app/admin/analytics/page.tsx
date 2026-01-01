"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, Users, Building2, TrendingUp, DollarSign } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useAuthStore } from "@/store";
import { adminService } from "@/services/admin.service";

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }

    if (user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    loadAnalytics();
  }, [user, isAuthenticated, authLoading, router]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">
            {authLoading ? "Checking authentication..." : "Loading analytics..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-primary" />
                Analytics & Reports
              </h1>
              <p className="text-muted-foreground mt-2">
                Platform statistics and insights
              </p>
            </div>
            <Link href="/admin">
              <Button variant="outline">Back to Admin Dashboard</Button>
            </Link>
          </div>
        </div>

        {stats && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Statistics */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">User Statistics</h3>
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Users</span>
                  <span className="font-semibold">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buyers</span>
                  <span className="font-semibold">{stats.totalBuyers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Renters</span>
                  <span className="font-semibold">{stats.totalRenters}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Listers</span>
                  <span className="font-semibold">{stats.totalListers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property Managers</span>
                  <span className="font-semibold">{stats.totalPropertyManagers}</span>
                </div>
              </div>
            </Card>

            {/* Property Statistics */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Property Statistics</h3>
                <Building2 className="w-6 h-6 text-purple-500" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Properties</span>
                  <span className="font-semibold">{stats.totalProperties}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Listings</span>
                  <span className="font-semibold">{stats.activeListings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Providers</span>
                  <span className="font-semibold">{stats.totalProviders}</span>
                </div>
              </div>
            </Card>

            {/* Revenue Statistics */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Revenue</h3>
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-semibold">
                    UGX {stats.revenue.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  Revenue tracking coming soon
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Coming Soon */}
        <Card className="mt-6 p-6">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
            <p className="text-muted-foreground">
              Detailed charts, trends, and insights coming soon
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

