"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  Search,
  Calendar,
  Building,
  TrendingUp,
  TrendingDown,
  Smartphone,
  Loader2,
  Receipt,
  AlertCircle,
  ChevronRight,
  Eye,
  Shield,
  Lock,
  PieChart,
  BarChart3,
  Plus,
  ArrowUpRight,
  Sparkles,
  Home,
  Banknote,
  CreditCard as CardIcon,
} from "lucide-react";
import { Button, Card, Badge, Input } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import { propertyService } from "@/services/property.service";
import { useAuth } from "@/hooks";
import { format, formatDistanceToNow, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface Payment {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage?: string;
  type: "viewing" | "inquiry" | "booking" | "rent" | "deposit" | "service";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: string;
  date: Date;
  description?: string;
}

interface PaymentMethod {
  id: string;
  type: "mtn_momo" | "airtel_money" | "card" | "bank";
  name: string;
  last4?: string;
  isDefault: boolean;
  icon: React.ReactNode;
  color: string;
}

// Payment type tabs
const paymentTypeTabs = [
  { id: "all", label: "All", icon: Receipt },
  { id: "booking", label: "Bookings", icon: Calendar },
  { id: "rent", label: "Rent", icon: Home },
  { id: "deposit", label: "Deposits", icon: Banknote },
  { id: "viewing", label: "Viewings", icon: Eye },
];

export default function PaymentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");

  // Payment methods with better icons
  const paymentMethods: PaymentMethod[] = [
    { 
      id: "1", 
      type: "mtn_momo", 
      name: "MTN Mobile Money", 
      last4: "7890", 
      isDefault: true, 
      icon: <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-black">MTN</div>,
      color: "yellow"
    },
    { 
      id: "2", 
      type: "airtel_money", 
      name: "Airtel Money", 
      last4: "4567", 
      isDefault: false, 
      icon: <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">A</div>,
      color: "red"
    },
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;

    loadPayments();
  }, [isAuthenticated, authLoading]);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const bookings = await propertyService.getMyBookings();
      
      const paymentData: Payment[] = (bookings || []).map((booking: any) => ({
        id: booking.id,
        propertyId: booking.propertyId,
        propertyTitle: booking.property?.title || "Property",
        propertyImage: booking.property?.images?.[0]?.url || booking.property?.images?.[0],
        type: booking.type || "booking",
        amount: booking.paymentAmount || 0,
        currency: booking.currency || "UGX",
        status: booking.paymentStatus || (booking.status === "confirmed" ? "completed" : "pending"),
        paymentMethod: booking.paymentMethod || "MTN Mobile Money",
        date: new Date(booking.createdAt),
        description: booking.type === "viewing" 
          ? "Property Viewing Fee" 
          : booking.type === "booking" 
          ? `Booking: ${booking.checkInDate ? format(new Date(booking.checkInDate), "MMM d") : ""} - ${booking.checkOutDate ? format(new Date(booking.checkOutDate), "MMM d") : ""}`
          : "Property Inquiry",
      }));

      setPayments(paymentData);
    } catch (error) {
      console.error("Failed to load payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalSpent = payments
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);
    
    const pendingAmount = payments
      .filter(p => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    const completedCount = payments.filter(p => p.status === "completed").length;
    const pendingCount = payments.filter(p => p.status === "pending").length;

    // Calculate this month vs last month
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthSpent = payments
      .filter(p => p.status === "completed" && p.date >= thisMonthStart)
      .reduce((sum, p) => sum + p.amount, 0);

    const lastMonthSpent = payments
      .filter(p => p.status === "completed" && p.date >= lastMonthStart && p.date <= lastMonthEnd)
      .reduce((sum, p) => sum + p.amount, 0);

    const monthlyChange = lastMonthSpent > 0 
      ? ((thisMonthSpent - lastMonthSpent) / lastMonthSpent * 100).toFixed(0)
      : thisMonthSpent > 0 ? "100" : "0";

    return {
      totalSpent,
      pendingAmount,
      completedCount,
      pendingCount,
      thisMonthSpent,
      monthlyChange,
    };
  }, [payments]);

  // Calculate spending by type for the chart
  const spendingByType = useMemo(() => {
    const byType: Record<string, number> = {};
    payments.filter(p => p.status === "completed").forEach(p => {
      byType[p.type] = (byType[p.type] || 0) + p.amount;
    });
    return byType;
  }, [payments]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = 
        payment.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
      const matchesType = activeTab === "all" || payment.type === activeTab;
      
      let matchesDate = true;
      if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = payment.date >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDate = payment.date >= monthAgo;
      } else if (dateFilter === "year") {
        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        matchesDate = payment.date >= yearAgo;
      }

      return matchesSearch && matchesStatus && matchesDate && matchesType;
    });
  }, [payments, searchQuery, statusFilter, dateFilter, activeTab]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
            <CheckCircle className="w-3 h-3" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
            <XCircle className="w-3 h-3" />
            Failed
          </Badge>
        );
      case "refunded":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
            <ArrowUpRight className="w-3 h-3" />
            Refunded
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "rent":
        return <Home className="w-4 h-4 text-purple-500" />;
      case "deposit":
        return <Banknote className="w-4 h-4 text-green-500" />;
      case "viewing":
        return <Eye className="w-4 h-4 text-orange-500" />;
      default:
        return <Receipt className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-4 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
              <p className="text-slate-500 mt-1">
                Track your spending and manage payment methods
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                <Shield className="w-4 h-4" />
                <span>Secure Payments</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Spent */}
          <Card className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Spent</p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(stats.totalSpent, "UGX")}
                </p>
                {Number(stats.monthlyChange) !== 0 && (
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    {Number(stats.monthlyChange) > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        <span>+{stats.monthlyChange}% this month</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4" />
                        <span>{stats.monthlyChange}% this month</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
          </Card>

          {/* Pending */}
          <Card className="p-6 bg-white border border-slate-200 hover:border-yellow-300 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {formatCurrency(stats.pendingAmount, "UGX")}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  {stats.pendingCount} transaction{stats.pendingCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          {/* Completed */}
          <Card className="p-6 bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.completedCount}</p>
                <p className="text-sm text-slate-400 mt-2">
                  Successful payments
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* This Month */}
          <Card className="p-6 bg-white border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">This Month</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {formatCurrency(stats.thisMonthSpent, "UGX")}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  {format(new Date(), "MMMM yyyy")}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Type Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {paymentTypeTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <Card className="p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Payment History</h2>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search payments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                </select>
              </div>

              {/* Payment List */}
              {filteredPayments.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Receipt className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Payments Yet</h3>
                  <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                    {payments.length === 0 
                      ? "When you make bookings or payments, they'll appear here for easy tracking."
                      : "No payments match your current filters. Try adjusting your search criteria."}
                  </p>
                  {payments.length === 0 && (
                    <Button 
                      onClick={() => router.push("/properties")}
                      className="gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Browse Properties
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPayments.map((payment, index) => (
                    <div
                      key={payment.id}
                      className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-xl hover:bg-slate-100/80 transition-all duration-200 cursor-pointer group border border-transparent hover:border-slate-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Property Image */}
                      <div className="w-14 h-14 rounded-xl bg-slate-200 overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow transition-shadow">
                        {payment.propertyImage ? (
                          <img
                            src={payment.propertyImage}
                            alt={payment.propertyTitle}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                            <Building className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center">
                            {getTypeIcon(payment.type)}
                          </div>
                          <span className="font-semibold text-slate-900 truncate">
                            {payment.propertyTitle}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 truncate">
                          {payment.description}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {format(payment.date, "MMM d, yyyy")} at {format(payment.date, "h:mm a")}
                        </p>
                      </div>

                      {/* Amount & Status */}
                      <div className="text-right flex-shrink-0">
                        <p className={cn(
                          "font-bold text-lg",
                          payment.status === "completed" ? "text-green-600" : "text-slate-900"
                        )}>
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                        <div className="mt-1">
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>

                      {/* Action */}
                      <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Spending Breakdown */}
            {Object.keys(spendingByType).length > 0 && (
              <Card className="p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Spending Breakdown</h2>
                </div>
                <div className="space-y-3">
                  {Object.entries(spendingByType).map(([type, amount]) => {
                    const total = Object.values(spendingByType).reduce((a, b) => a + b, 0);
                    const percentage = ((amount / total) * 100).toFixed(0);
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(type)}
                            <span className="text-slate-600">{getTypeLabel(type)}</span>
                          </div>
                          <span className="font-medium text-slate-900">{percentage}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              type === "booking" ? "bg-blue-500" :
                              type === "rent" ? "bg-purple-500" :
                              type === "deposit" ? "bg-green-500" :
                              type === "viewing" ? "bg-orange-500" :
                              "bg-slate-500"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Payment Methods */}
            <Card className="p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Payment Methods</h2>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>

              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md",
                      method.isDefault 
                        ? "border-blue-500 bg-blue-50/50" 
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    )}
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{method.name}</p>
                      {method.last4 && (
                        <p className="text-sm text-slate-500">****{method.last4}</p>
                      )}
                    </div>
                    {method.isDefault && (
                      <Badge className="bg-blue-100 text-blue-700 border-0">Default</Badge>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Lock className="w-4 h-4" />
                  <span>Your payment info is encrypted and secure</span>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-3 h-11">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-slate-600" />
                  </div>
                  View All Invoices
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 h-11">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Download className="w-4 h-4 text-slate-600" />
                  </div>
                  Download Statement
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 h-11">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-slate-600" />
                  </div>
                  Report an Issue
                </Button>
              </div>
            </Card>

            {/* Pending Payments Alert */}
            {stats.pendingCount > 0 && (
              <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-900">
                      {stats.pendingCount} Pending Payment{stats.pendingCount > 1 ? "s" : ""}
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      You have {formatCurrency(stats.pendingAmount, "UGX")} awaiting completion.
                    </p>
                    <Button size="sm" className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-yellow-900 font-semibold">
                      Complete Payment
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Help Card */}
            <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Need Help?</h3>
                  <p className="text-sm text-blue-100 mt-1">
                    Our support team is available 24/7 to assist with payment questions.
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="mt-3 bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    Contact Support
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
