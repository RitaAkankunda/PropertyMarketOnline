"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { Button, Card, Badge, Input } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";
import { propertyService } from "@/services/property.service";
import { useAuth } from "@/hooks";
import { format, formatDistanceToNow } from "date-fns";

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
  icon: string;
}

export default function PaymentsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Mock payment methods
  const paymentMethods: PaymentMethod[] = [
    { id: "1", type: "mtn_momo", name: "MTN Mobile Money", last4: "7890", isDefault: true, icon: "📱" },
    { id: "2", type: "airtel_money", name: "Airtel Money", last4: "4567", isDefault: false, icon: "📱" },
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;

    loadPayments();
  }, [isAuthenticated, authLoading]);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      // Fetch bookings which contain payment information
      const bookings = await propertyService.getMyBookings();
      
      // Transform bookings to payments
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
  const totalSpent = payments
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);
  
  const pendingAmount = payments
    .filter(p => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const completedCount = payments.filter(p => p.status === "completed").length;
  const pendingCount = payments.filter(p => p.status === "pending").length;

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    
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

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700 border-red-200">Failed</Badge>;
      case "refunded":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Calendar className="w-4 h-4" />;
      case "rent":
        return <Building className="w-4 h-4" />;
      case "deposit":
        return <Wallet className="w-4 h-4" />;
      case "viewing":
        return <Eye className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
          <p className="text-muted-foreground mt-2">
            Manage your payment history and methods
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(totalSpent, "UGX")}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(pendingAmount, "UGX")}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment History */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Payment History</h2>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
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
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                </select>
              </div>

              {/* Payment List */}
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Payments Found</h3>
                  <p className="text-muted-foreground">
                    {payments.length === 0 
                      ? "You haven't made any payments yet."
                      : "No payments match your filters."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
                    >
                      {/* Property Image */}
                      <div className="w-14 h-14 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
                        {payment.propertyImage ? (
                          <img
                            src={payment.propertyImage}
                            alt={payment.propertyTitle}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeIcon(payment.type)}
                          <span className="font-medium text-slate-900 truncate">
                            {payment.propertyTitle}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {payment.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(payment.date, "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>

                      {/* Amount & Status */}
                      <div className="text-right flex-shrink-0">
                        <p className={cn(
                          "font-semibold",
                          payment.status === "completed" ? "text-green-600" : "text-slate-900"
                        )}>
                          {formatCurrency(payment.amount, payment.currency)}
                        </p>
                        <div className="mt-1">
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>

                      {/* Action */}
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Methods */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Payment Methods</h2>
                <Button variant="outline" size="sm">
                  Add New
                </Button>
              </div>

              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer",
                      method.isDefault 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-slate-200 hover:border-blue-300"
                    )}
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm">
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{method.name}</p>
                      {method.last4 && (
                        <p className="text-sm text-muted-foreground">
                          ****{method.last4}
                        </p>
                      )}
                    </div>
                    {method.isDefault && (
                      <Badge className="bg-blue-100 text-blue-700">Default</Badge>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Your payment information is securely stored and encrypted.
                </p>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Receipt className="w-4 h-4 mr-3" />
                  View All Invoices
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-3" />
                  Download Statement
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertCircle className="w-4 h-4 mr-3" />
                  Report an Issue
                </Button>
              </div>
            </Card>

            {/* Pending Payments Alert */}
            {pendingCount > 0 && (
              <Card className="p-6 bg-yellow-50 border-yellow-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-900">
                      {pendingCount} Pending Payment{pendingCount > 1 ? "s" : ""}
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      You have {formatCurrency(pendingAmount, "UGX")} in pending payments.
                    </p>
                    <Button size="sm" className="mt-3 bg-yellow-600 hover:bg-yellow-700">
                      Pay Now
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
