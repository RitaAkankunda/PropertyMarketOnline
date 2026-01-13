"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  Eye,
  MessageSquare,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useAuthStore } from "@/store";
import { dashboardService } from "@/services";
import { formatCurrency } from "@/lib/utils";
import type { DashboardAnalytics } from "@/services/dashboard.service";

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }

    loadAnalytics();
  }, [user, isAuthenticated, authLoading, router]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
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

  if (!isAuthenticated || !user) {
    return null;
  }

  const formatChange = (change: string) => {
    const num = parseFloat(change.replace('%', ''));
    if (num === 0) return { value: '0%', isPositive: null };
    const isPositive = num > 0;
    return {
      value: `${isPositive ? '+' : ''}${change}`,
      isPositive,
    };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
              <h1 className="text-3xl font-bold flex items-center gap-2 mt-4">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                Analytics & Insights
              </h1>
              <p className="text-muted-foreground mt-2">
                Track your property performance and engagement metrics
              </p>
            </div>
            <Button onClick={loadAnalytics} variant="outline" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Card className="p-6 mb-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-600">
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
            <Button onClick={loadAnalytics} className="mt-4" variant="outline" size="sm">
              Try Again
            </Button>
          </Card>
        )}

        {analytics && (
          <div className="space-y-6">
            {/* Main Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Properties */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Properties</p>
                    <h3 className="text-3xl font-bold">{analytics.totalProperties}</h3>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {(() => {
                    const change = formatChange(analytics.propertyChange);
                    return (
                      <>
                        {change.isPositive !== null && (
                          change.isPositive ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )
                        )}
                        <span className={change.isPositive === null ? 'text-muted-foreground' : change.isPositive ? 'text-green-600' : 'text-red-600'}>
                          {change.value} from last month
                        </span>
                      </>
                    );
                  })()}
                </div>
              </Card>

              {/* Total Views */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Views</p>
                    <h3 className="text-3xl font-bold">{analytics.totalViews.toLocaleString()}</h3>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {(() => {
                    const change = formatChange(analytics.viewsChange);
                    return (
                      <>
                        {change.isPositive !== null && (
                          change.isPositive ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )
                        )}
                        <span className={change.isPositive === null ? 'text-muted-foreground' : change.isPositive ? 'text-green-600' : 'text-red-600'}>
                          {change.value} from last month
                        </span>
                      </>
                    );
                  })()}
                </div>
              </Card>

              {/* Total Messages */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Messages</p>
                    <h3 className="text-3xl font-bold">{analytics.totalMessages.toLocaleString()}</h3>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {(() => {
                    const change = formatChange(analytics.messagesChange);
                    return (
                      <>
                        {change.isPositive !== null && (
                          change.isPositive ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )
                        )}
                        <span className={change.isPositive === null ? 'text-muted-foreground' : change.isPositive ? 'text-green-600' : 'text-red-600'}>
                          {change.value} from last month
                        </span>
                      </>
                    );
                  })()}
                </div>
              </Card>

              {/* Revenue */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-bold">
                      {formatCurrency(analytics.revenue, 'UGX')}
                    </h3>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {(() => {
                    const change = formatChange(analytics.revenueChange);
                    return (
                      <>
                        {change.isPositive !== null && (
                          change.isPositive ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )
                        )}
                        <span className={change.isPositive === null ? 'text-muted-foreground' : change.isPositive ? 'text-green-600' : 'text-red-600'}>
                          {change.value} from last month
                        </span>
                      </>
                    );
                  })()}
                </div>
              </Card>
            </div>

            {/* Additional Insights */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average Views per Property</span>
                    <span className="font-semibold">
                      {analytics.totalProperties > 0
                        ? Math.round(analytics.totalViews / analytics.totalProperties)
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Message Conversion Rate</span>
                    <span className="font-semibold">
                      {analytics.totalViews > 0
                        ? ((analytics.totalMessages / analytics.totalViews) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average Revenue per Property</span>
                    <span className="font-semibold">
                      {analytics.totalProperties > 0
                        ? formatCurrency(analytics.revenue / analytics.totalProperties, 'UGX')
                        : formatCurrency(0, 'UGX')}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Insights</h3>
                <div className="space-y-3">
                  {analytics.totalProperties === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Start by listing your first property to see analytics data.
                    </p>
                  )}
                  {analytics.totalProperties > 0 && analytics.totalViews === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Your properties haven't received any views yet. Consider optimizing your listings with better photos and descriptions.
                    </p>
                  )}
                  {analytics.totalViews > 0 && analytics.totalMessages === 0 && (
                    <p className="text-sm text-muted-foreground">
                      You're getting views but no messages. Try adding a call-to-action or making your contact information more prominent.
                    </p>
                  )}
                  {analytics.totalMessages > 0 && analytics.revenue === 0 && (
                    <p className="text-sm text-muted-foreground">
                      You're receiving inquiries! Focus on converting messages into completed bookings.
                    </p>
                  )}
                  {analytics.revenue > 0 && (
                    <p className="text-sm text-green-600 font-medium">
                      Great job! You're generating revenue from your properties.
                    </p>
                  )}
                </div>
              </Card>
            </div>

            {/* Coming Soon Section */}
            <Card className="p-6">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground mb-4">
                  Detailed charts, trends over time, and property-specific insights coming soon
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">Back to Dashboard</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/properties">Manage Properties</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
