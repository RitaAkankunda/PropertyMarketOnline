"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Home,
  Building,
  Wrench,
  DollarSign,
  Bell,
  Settings,
  CheckCircle,
  Star,
  MapPin,
  Phone,
  ChevronRight,
  X,
  AlertTriangle,
  TrendingUp,
  Calendar,
  User,
  CreditCard,
  Shield,
  BarChart3,
} from "lucide-react";

// =============================================
// TYPES
// =============================================
type TicketStatus = "pending" | "assigned" | "in_progress" | "completed" | "rejected";
type TabType = "overview" | "tickets" | "properties" | "payments";

interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: TicketStatus;
  property: string;
  unit: string;
  tenant: string;
  tenantPhone: string;
  createdAt: string;
  suggestedProviders: Array<{
    id: string;
    name: string;
    rating: number;
    price: string;
    availability: string;
    completedJobs: number;
  }>;
  assignedProvider?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
  };
  escrowAmount?: number;
}

interface Property {
  id: string;
  name: string;
  location: string;
  units: number;
  occupancy: number;
  monthlyIncome: number;
  activeTickets: number;
}

// =============================================
// DUMMY DATA
// =============================================
const DUMMY_TICKETS: MaintenanceTicket[] = [
  {
    id: "MT001",
    title: "Electrical outlet not working",
    description: "Power outlet in living room stopped working. Breaker reset didn't help.",
    category: "Electrical",
    priority: "high",
    status: "pending",
    property: "Sunrise Apartments",
    unit: "Apt 4B",
    tenant: "James Okello",
    tenantPhone: "+256 772 111 222",
    createdAt: "2026-01-03T10:30:00",
    suggestedProviders: [
      { id: "P1", name: "ElectroPro Services", rating: 4.9, price: "UGX 100,000 - 180,000", availability: "Today", completedJobs: 156 },
      { id: "P2", name: "QuickFix Electrical", rating: 4.7, price: "UGX 80,000 - 150,000", availability: "Tomorrow", completedJobs: 89 },
      { id: "P3", name: "Power Solutions Ltd", rating: 4.6, price: "UGX 90,000 - 160,000", availability: "Today", completedJobs: 124 },
    ],
  },
  {
    id: "MT002",
    title: "Leaking kitchen faucet",
    description: "Kitchen faucet dripping constantly for 3 days. Water bill concern.",
    category: "Plumbing",
    priority: "medium",
    status: "assigned",
    property: "Kololo Heights",
    unit: "Unit 12",
    tenant: "Grace Nambi",
    tenantPhone: "+256 701 333 444",
    createdAt: "2026-01-02T14:00:00",
    suggestedProviders: [],
    assignedProvider: { id: "P4", name: "Master Plumbers Ltd", phone: "+256 782 345 678", rating: 4.8 },
    escrowAmount: 150000,
  },
  {
    id: "MT003",
    title: "AC unit making noise",
    description: "Air conditioner making loud grinding noise. Not cooling effectively.",
    category: "HVAC",
    priority: "medium",
    status: "in_progress",
    property: "Garden View Estate",
    unit: "House 7",
    tenant: "Peter Waswa",
    tenantPhone: "+256 755 555 666",
    createdAt: "2025-12-30T09:00:00",
    suggestedProviders: [],
    assignedProvider: { id: "P5", name: "CoolAir Technicians", phone: "+256 755 789 012", rating: 4.7 },
    escrowAmount: 280000,
  },
  {
    id: "MT004",
    title: "Broken window latch",
    description: "Bedroom window latch broken. Security concern.",
    category: "Structural",
    priority: "urgent",
    status: "completed",
    property: "Sunrise Apartments",
    unit: "Apt 2A",
    tenant: "Mary Achieng",
    tenantPhone: "+256 782 777 888",
    createdAt: "2025-12-28T16:00:00",
    suggestedProviders: [],
    assignedProvider: { id: "P6", name: "SecureHome Repairs", phone: "+256 701 999 000", rating: 4.9 },
  },
];

const DUMMY_PROPERTIES: Property[] = [
  { id: "PR1", name: "Sunrise Apartments", location: "Kampala, Nakawa", units: 24, occupancy: 92, monthlyIncome: 12800000, activeTickets: 2 },
  { id: "PR2", name: "Kololo Heights", location: "Kampala, Kololo", units: 16, occupancy: 100, monthlyIncome: 19200000, activeTickets: 1 },
  { id: "PR3", name: "Garden View Estate", location: "Entebbe", units: 12, occupancy: 83, monthlyIncome: 7500000, activeTickets: 1 },
];

// =============================================
// COMPONENTS
// =============================================
function StatusBadge({ status }: { status: TicketStatus }) {
  const config = {
    pending: { color: "bg-yellow-100 text-yellow-700", label: "Pending Approval" },
    assigned: { color: "bg-blue-100 text-blue-700", label: "Provider Assigned" },
    in_progress: { color: "bg-purple-100 text-purple-700", label: "In Progress" },
    completed: { color: "bg-green-100 text-green-700", label: "Completed" },
    rejected: { color: "bg-red-100 text-red-700", label: "Rejected" },
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config[status].color}`}>
      {config[status].label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { color: string; label: string }> = {
    low: { color: "bg-gray-100 text-gray-600", label: "Low" },
    medium: { color: "bg-yellow-100 text-yellow-600", label: "Medium" },
    high: { color: "bg-orange-100 text-orange-600", label: "High" },
    urgent: { color: "bg-red-100 text-red-600", label: "Urgent" },
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config[priority].color}`}>
      {priority === "urgent" && <AlertTriangle className="w-3 h-3 mr-1" />}
      {config[priority].label}
    </span>
  );
}

// =============================================
// ASSIGN PROVIDER MODAL
// =============================================
function AssignProviderModal({ 
  ticket, 
  onClose, 
  onAssign 
}: { 
  ticket: MaintenanceTicket; 
  onClose: () => void; 
  onAssign: (ticketId: string, provider: { id: string; name: string; phone: string; rating: number }) => void;
}) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [escrowAmount, setEscrowAmount] = useState("");

  const handleAssign = () => {
    const provider = ticket.suggestedProviders.find(p => p.id === selectedProvider);
    if (provider) {
      onAssign(ticket.id, {
        id: provider.id,
        name: provider.name,
        phone: "+256 700 000 000",
        rating: provider.rating,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-orange-500 text-white p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-orange-100">Ticket #{ticket.id}</p>
            <h2 className="font-bold text-lg">Assign Provider</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
          {/* Ticket Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-2">{ticket.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{ticket.description}</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-white px-2 py-1 rounded">{ticket.property}</span>
              <span className="text-xs bg-white px-2 py-1 rounded">{ticket.unit}</span>
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>

          {/* Tenant Info */}
          <div className="flex items-center gap-3 p-3 border rounded-xl">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{ticket.tenant}</p>
              <p className="text-sm text-gray-500">Tenant</p>
            </div>
            <a href={`tel:${ticket.tenantPhone}`} className="p-2 bg-green-100 rounded-lg">
              <Phone className="w-5 h-5 text-green-600" />
            </a>
          </div>

          {/* Suggested Providers */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Recommended Providers</h3>
            <div className="space-y-3">
              {ticket.suggestedProviders.map((provider) => (
                <div
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedProvider === provider.id
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-orange-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedProvider === provider.id ? "border-orange-500" : "border-gray-300"
                    }`}>
                      {selectedProvider === provider.id && (
                        <div className="w-3 h-3 bg-orange-500 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{provider.name}</p>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{provider.rating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span>{provider.price}</span>
                        <span>•</span>
                        <span className="text-green-600">{provider.availability}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{provider.completedJobs} jobs completed</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Escrow Setup */}
          {selectedProvider && (
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Escrow Payment (Optional)
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Hold funds securely until work is verified complete.
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={escrowAmount}
                  onChange={(e) => setEscrowAmount(e.target.value)}
                  placeholder="Amount (UGX)"
                  className="flex-1 p-3 border border-gray-300 rounded-lg"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                  Fund Escrow
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedProvider}
            className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            Assign Provider
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// RELEASE PAYMENT MODAL
// =============================================
function ReleasePaymentModal({
  ticket,
  onClose,
  onRelease,
}: {
  ticket: MaintenanceTicket;
  onClose: () => void;
  onRelease: (ticketId: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-green-500 text-white p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-green-100">Release Payment</p>
            <h2 className="font-bold text-lg">Verify & Pay</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Job Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-2">{ticket.title}</h3>
            <p className="text-sm text-gray-600">{ticket.assignedProvider?.name}</p>
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <span className="text-gray-500">Escrow Amount</span>
              <span className="font-bold text-green-600">UGX {ticket.escrowAmount?.toLocaleString()}</span>
            </div>
          </div>

          {/* Rate Provider */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Rate the Service</h4>
            <div className="flex gap-2 justify-center mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)}>
                  <Star className={`w-8 h-8 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment (optional)..."
              rows={2}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Confirmation */}
          <div className="bg-yellow-50 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              By releasing payment, you confirm that the work has been completed satisfactorily.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            Not Yet
          </button>
          <button
            onClick={() => { onRelease(ticket.id); onClose(); }}
            className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <CheckCircle className="w-5 h-5 inline mr-2" />
            Release Payment
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// MAIN OWNER DASHBOARD
// =============================================
export default function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [tickets, setTickets] = useState(DUMMY_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<TicketStatus | "all">("all");

  const handleAssignProvider = (ticketId: string, provider: { id: string; name: string; phone: string; rating: number }) => {
    setTickets(tickets.map(t => 
      t.id === ticketId 
        ? { ...t, status: "assigned" as TicketStatus, assignedProvider: provider, escrowAmount: 150000 }
        : t
    ));
  };

  const handleReleasePayment = (ticketId: string) => {
    setTickets(tickets.map(t => 
      t.id === ticketId 
        ? { ...t, status: "completed" as TicketStatus }
        : t
    ));
  };

  const pendingTickets = tickets.filter(t => t.status === "pending").length;
  const inProgressTickets = tickets.filter(t => t.status === "in_progress" || t.status === "assigned").length;
  const totalProperties = DUMMY_PROPERTIES.length;
  const totalIncome = DUMMY_PROPERTIES.reduce((sum, p) => sum + p.monthlyIncome, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modals */}
      {showAssignModal && selectedTicket && (
        <AssignProviderModal
          ticket={selectedTicket}
          onClose={() => { setShowAssignModal(false); setSelectedTicket(null); }}
          onAssign={handleAssignProvider}
        />
      )}
      {showReleaseModal && selectedTicket && (
        <ReleasePaymentModal
          ticket={selectedTicket}
          onClose={() => { setShowReleaseModal(false); setSelectedTicket(null); }}
          onRelease={handleReleasePayment}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Owner Dashboard</h1>
              <p className="text-orange-100">Manage your properties & maintenance</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 bg-white/20 rounded-lg relative">
                <Bell className="w-5 h-5" />
                {pendingTickets > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {pendingTickets}
                  </span>
                )}
              </button>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 -mt-4">
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "tickets", label: "Tickets", icon: Wrench, badge: pendingTickets },
            { id: "properties", label: "Properties", icon: Building },
            { id: "payments", label: "Payments", icon: CreditCard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? "bg-orange-500 text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                  activeTab === tab.id ? "bg-white text-orange-500" : "bg-red-500 text-white"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Properties</p>
                    <p className="text-2xl font-bold text-gray-900">{totalProperties}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Monthly Income</p>
                    <p className="text-2xl font-bold text-gray-900">UGX {(totalIncome / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending Tickets</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingTickets}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">{inProgressTickets}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Tickets */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Recent Maintenance Tickets</h2>
                <button 
                  onClick={() => setActiveTab("tickets")}
                  className="text-sm text-orange-600 flex items-center gap-1"
                >
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y">
                {tickets.slice(0, 3).map((ticket) => (
                  <div key={ticket.id} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{ticket.title}</p>
                      <p className="text-sm text-gray-500">{ticket.property} - {ticket.unit}</p>
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>
                ))}
              </div>
            </div>

            {/* Properties Overview */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b">
                <h2 className="font-bold text-gray-900">Properties Overview</h2>
              </div>
              <div className="divide-y">
                {DUMMY_PROPERTIES.map((property) => (
                  <div key={property.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{property.name}</h3>
                      <span className="text-sm text-orange-600">{property.occupancy}% occupied</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {property.location}
                      </span>
                      <span>{property.units} units</span>
                      {property.activeTickets > 0 && (
                        <span className="text-yellow-600 flex items-center gap-1">
                          <Wrench className="w-4 h-4" /> {property.activeTickets} active tickets
                        </span>
                      )}
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${property.occupancy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TICKETS TAB */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: "all", label: "All" },
                { id: "pending", label: "Pending" },
                { id: "assigned", label: "Assigned" },
                { id: "in_progress", label: "In Progress" },
                { id: "completed", label: "Completed" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setTicketFilter(filter.id as TicketStatus | "all")}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                    ticketFilter === filter.id 
                      ? "bg-orange-500 text-white" 
                      : "bg-white text-gray-600 border"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Ticket Cards */}
            <div className="space-y-3">
              {tickets
                .filter(t => ticketFilter === "all" || t.status === ticketFilter)
                .map((ticket) => (
                  <div key={ticket.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-400">#{ticket.id}</span>
                          <PriorityBadge priority={ticket.priority} />
                        </div>
                        <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{ticket.property} - {ticket.unit}</p>
                      </div>
                      <StatusBadge status={ticket.status} />
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" /> {ticket.tenant}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions based on status */}
                    {ticket.status === "pending" && (
                      <div className="flex gap-2 pt-3 border-t">
                        <button
                          onClick={() => { setSelectedTicket(ticket); setShowAssignModal(true); }}
                          className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
                        >
                          Assign Provider
                        </button>
                        <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">
                          Reject
                        </button>
                      </div>
                    )}

                    {ticket.status === "assigned" && ticket.assignedProvider && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center gap-3 text-sm">
                          <Wrench className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{ticket.assignedProvider.name}</span>
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{ticket.assignedProvider.rating}</span>
                          {ticket.escrowAmount && (
                            <span className="ml-auto text-green-600">
                              Escrow: UGX {ticket.escrowAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {ticket.status === "in_progress" && ticket.assignedProvider && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-sm">
                            <Wrench className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">{ticket.assignedProvider.name}</span>
                            <span className="text-purple-600">Working...</span>
                          </div>
                          <button
                            onClick={() => { setSelectedTicket(ticket); setShowReleaseModal(true); }}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                          >
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            Verify & Pay
                          </button>
                        </div>
                      </div>
                    )}

                    {ticket.status === "completed" && (
                      <div className="pt-3 border-t flex items-center justify-between text-sm">
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Completed & Paid
                        </span>
                        <span className="text-gray-500">
                          {ticket.assignedProvider?.name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* PROPERTIES TAB */}
        {activeTab === "properties" && (
          <div className="space-y-4">
            {DUMMY_PROPERTIES.map((property) => (
              <div key={property.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{property.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {property.location}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      property.occupancy === 100 
                        ? "bg-green-100 text-green-700" 
                        : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {property.occupancy}% Occupied
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center border-t pt-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{property.units}</p>
                      <p className="text-xs text-gray-500">Units</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">UGX {(property.monthlyIncome / 1000000).toFixed(1)}M</p>
                      <p className="text-xs text-gray-500">Monthly Income</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{property.activeTickets}</p>
                      <p className="text-xs text-gray-500">Active Tickets</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">Escrow Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-600">Funds in Escrow</p>
                  <p className="text-2xl font-bold text-blue-700">UGX 430,000</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-green-600">Released This Month</p>
                  <p className="text-2xl font-bold text-green-700">UGX 850,000</p>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b">
                <h2 className="font-bold text-gray-900">Recent Transactions</h2>
              </div>
              <div className="divide-y">
                {[
                  { id: 1, type: "Released", provider: "Master Plumbers Ltd", amount: 150000, date: "Jan 3, 2026", ticket: "MT002" },
                  { id: 2, type: "Escrow", provider: "CoolAir Technicians", amount: 280000, date: "Dec 31, 2025", ticket: "MT003" },
                  { id: 3, type: "Released", provider: "SecureHome Repairs", amount: 95000, date: "Dec 29, 2025", ticket: "MT004" },
                ].map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === "Released" ? "bg-green-100" : "bg-blue-100"
                    }`}>
                      {tx.type === "Released" 
                        ? <CheckCircle className="w-5 h-5 text-green-600" />
                        : <Shield className="w-5 h-5 text-blue-600" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{tx.provider}</p>
                      <p className="text-sm text-gray-500">Ticket #{tx.ticket} • {tx.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.type === "Released" ? "text-green-600" : "text-blue-600"}`}>
                        {tx.type === "Released" ? "-" : ""} UGX {tx.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">{tx.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
        <div className="flex">
          <Link href="/" className="flex-1 flex flex-col items-center py-3 text-gray-500">
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/properties" className="flex-1 flex flex-col items-center py-3 text-gray-500">
            <Building className="w-5 h-5" />
            <span className="text-xs mt-1">Properties</span>
          </Link>
          <Link href="/dashboard/owner" className="flex-1 flex flex-col items-center py-3 text-orange-500">
            <Wrench className="w-5 h-5" />
            <span className="text-xs mt-1">Dashboard</span>
          </Link>
          <Link href="/dashboard/owner" className="flex-1 flex flex-col items-center py-3 text-gray-500">
            <Settings className="w-5 h-5" />
            <span className="text-xs mt-1">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
