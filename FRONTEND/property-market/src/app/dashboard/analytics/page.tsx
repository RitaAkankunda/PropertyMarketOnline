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
  Calendar,
  PieChart,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useAuthStore } from "@/store";
import { dashboardService } from "@/services";
import { formatCurrency } from "@/lib/utils";
import type { DashboardAnalytics } from "@/services/dashboard.service";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from "recharts";

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

            {/* Charts Section */}
            {analytics.chartData && (
              <>
                {/* Views & Bookings Over Time */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Activity Over Last 7 Days</h3>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.chartData.last7Days}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="views" 
                          stroke="#8884d8" 
                          fillOpacity={1} 
                          fill="url(#colorViews)" 
                          name="Views"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="bookings" 
                          stroke="#82ca9d" 
                          fillOpacity={1} 
                          fill="url(#colorBookings)" 
                          name="Bookings"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Property Performance & Booking Breakdown */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Top Properties by Views */}
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-semibold">Top Properties by Views</h3>
                    </div>
                    {analytics.chartData.propertyPerformance.length > 0 ? (
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={analytics.chartData.propertyPerformance} 
                            layout="vertical"
                            margin={{ left: 20, right: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 12 }} />
                            <YAxis 
                              dataKey="title" 
                              type="category" 
                              width={100}
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                              }}
                              formatter={(value: number) => [`${value} views`, 'Views']}
                            />
                            <Bar 
                              dataKey="views" 
                              fill="#8b5cf6" 
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        <p>No property data available yet</p>
                      </div>
                    )}
                  </Card>

                  {/* Booking Types Breakdown */}
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <PieChart className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold">Booking Types</h3>
                    </div>
                    {(() => {
                      const pieData = [
                        { name: 'Inquiries', value: analytics.chartData?.bookingsByType.inquiries || 0, color: '#3b82f6' },
                        { name: 'Viewings', value: analytics.chartData?.bookingsByType.viewings || 0, color: '#10b981' },
                        { name: 'Bookings', value: analytics.chartData?.bookingsByType.bookings || 0, color: '#f59e0b' },
                      ].filter(item => item.value > 0);
                      
                      const total = pieData.reduce((sum, item) => sum + item.value, 0);
                      
                      return total > 0 ? (
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: number) => [value, 'Count']}
                              />
                              <Legend />
                            </RechartsPie>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                          <p>No booking data available yet</p>
                        </div>
                      );
                    })()}
                  </Card>
                </div>

                {/* Booking Status Overview */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <MessageSquare className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold">Booking Status Overview</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-yellow-600">
                        {analytics.chartData?.bookingsByStatus.pending || 0}
                      </div>
                      <div className="text-sm text-yellow-700 mt-1">Pending</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {analytics.chartData?.bookingsByStatus.confirmed || 0}
                      </div>
                      <div className="text-sm text-blue-700 mt-1">Confirmed</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {analytics.chartData?.bookingsByStatus.completed || 0}
                      </div>
                      <div className="text-sm text-green-700 mt-1">Completed</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-red-600">
                        {analytics.chartData?.bookingsByStatus.cancelled || 0}
                      </div>
                      <div className="text-sm text-red-700 mt-1">Cancelled</div>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* Actions */}
            <Card className="p-6">
              <div className="flex flex-wrap gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/properties">Manage Properties</Link>
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
