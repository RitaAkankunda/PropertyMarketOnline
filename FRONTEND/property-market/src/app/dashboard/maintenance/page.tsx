"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Home,
  Wrench,
  Clock,
  CheckCircle,
  Plus,
  Search,
  Camera,
  X,
  MapPin,
  User,
  Phone,
  MessageCircle,
  Upload,
  Zap,
  Droplets,
  Wifi,
  DoorOpen,
  Thermometer,
  Shield,
  Star,
  Settings,
  Bell,
} from "lucide-react";

// =============================================
// TYPES
// =============================================
type TicketStatus = "pending" | "assigned" | "in_progress" | "completed" | "rejected";
type TicketPriority = "low" | "medium" | "high" | "urgent";
type IssueCategory = "electrical" | "plumbing" | "hvac" | "security" | "structural" | "appliance" | "internet" | "other";

interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: TicketPriority;
  status: TicketStatus;
  location: string;
  unit: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  assignedProvider?: {
    name: string;
    phone: string;
    rating: number;
    serviceType: string;
  };
  suggestedProviders?: Array<{
    id: string;
    name: string;
    rating: number;
    price: string;
    availability: string;
  }>;
  propertyOwner?: {
    name: string;
    decision: "pending" | "approved" | "rejected";
  };
  timeline?: Array<{
    status: string;
    date: string;
    note?: string;
  }>;
}

// =============================================
// DUMMY DATA
// =============================================
const ISSUE_CATEGORIES: Array<{ id: IssueCategory; label: string; icon: typeof Zap }> = [
  { id: "electrical", label: "Electrical", icon: Zap },
  { id: "plumbing", label: "Plumbing", icon: Droplets },
  { id: "hvac", label: "HVAC/AC", icon: Thermometer },
  { id: "security", label: "Security", icon: Shield },
  { id: "structural", label: "Doors/Windows", icon: DoorOpen },
  { id: "internet", label: "Internet/Cable", icon: Wifi },
  { id: "appliance", label: "Appliances", icon: Settings },
  { id: "other", label: "Other", icon: Wrench },
];

const DUMMY_TICKETS: MaintenanceTicket[] = [
  {
    id: "MT001",
    title: "Electrical outlet not working",
    description: "The power outlet in the living room stopped working yesterday. I've tried resetting the breaker but it didn't help.",
    category: "electrical",
    priority: "high",
    status: "assigned",
    location: "Kampala, Nakawa",
    unit: "Apt 4B",
    images: ["/placeholder-issue-1.jpg"],
    createdAt: "2026-01-02T10:30:00",
    updatedAt: "2026-01-03T09:00:00",
    assignedProvider: {
      name: "ElectroPro Services",
      phone: "+256 772 123 456",
      rating: 4.9,
      serviceType: "Electrician",
    },
    propertyOwner: {
      name: "John Mukasa",
      decision: "approved",
    },
    timeline: [
      { status: "Ticket Created", date: "Jan 2, 10:30 AM" },
      { status: "Owner Notified", date: "Jan 2, 10:35 AM" },
      { status: "Provider Suggested", date: "Jan 2, 11:00 AM" },
      { status: "Owner Approved", date: "Jan 2, 2:00 PM" },
      { status: "Provider Assigned", date: "Jan 3, 9:00 AM", note: "Scheduled for Jan 5" },
    ],
  },
  {
    id: "MT002",
    title: "Leaking kitchen faucet",
    description: "The kitchen faucet has been dripping constantly. Water bill might be affected.",
    category: "plumbing",
    priority: "medium",
    status: "pending",
    location: "Kampala, Makindye",
    unit: "House 12",
    images: [],
    createdAt: "2026-01-03T14:00:00",
    updatedAt: "2026-01-03T14:00:00",
    suggestedProviders: [
      { id: "P1", name: "Master Plumbers Ltd", rating: 4.8, price: "UGX 80,000 - 150,000", availability: "Available today" },
      { id: "P2", name: "Quick Fix Plumbing", rating: 4.6, price: "UGX 70,000 - 120,000", availability: "Available tomorrow" },
      { id: "P3", name: "Pro Pipe Services", rating: 4.5, price: "UGX 90,000 - 160,000", availability: "Available today" },
    ],
    propertyOwner: {
      name: "Sarah Nambi",
      decision: "pending",
    },
  },
  {
    id: "MT003",
    title: "AC not cooling properly",
    description: "The air conditioning unit is running but not cooling the room effectively. It's making unusual sounds.",
    category: "hvac",
    priority: "medium",
    status: "in_progress",
    location: "Entebbe",
    unit: "Suite 201",
    images: [],
    createdAt: "2025-12-30T09:00:00",
    updatedAt: "2026-01-03T11:00:00",
    assignedProvider: {
      name: "CoolAir Technicians",
      phone: "+256 755 789 012",
      rating: 4.7,
      serviceType: "HVAC Specialist",
    },
    propertyOwner: {
      name: "David Okello",
      decision: "approved",
    },
    timeline: [
      { status: "Ticket Created", date: "Dec 30, 9:00 AM" },
      { status: "Owner Approved", date: "Dec 30, 12:00 PM" },
      { status: "Provider Assigned", date: "Dec 31, 10:00 AM" },
      { status: "Work Started", date: "Jan 3, 11:00 AM", note: "Technician on site" },
    ],
  },
  {
    id: "MT004",
    title: "Broken door lock",
    description: "The main entrance door lock is jammed and difficult to open.",
    category: "structural",
    priority: "urgent",
    status: "completed",
    location: "Kampala, Kololo",
    unit: "Apt 7A",
    images: [],
    createdAt: "2025-12-28T16:00:00",
    updatedAt: "2025-12-29T14:00:00",
    assignedProvider: {
      name: "SecureLock Solutions",
      phone: "+256 701 234 567",
      rating: 4.8,
      serviceType: "Locksmith",
    },
    propertyOwner: {
      name: "Grace Apio",
      decision: "approved",
    },
    timeline: [
      { status: "Ticket Created", date: "Dec 28, 4:00 PM" },
      { status: "Marked Urgent", date: "Dec 28, 4:05 PM" },
      { status: "Owner Approved", date: "Dec 28, 4:30 PM" },
      { status: "Provider Assigned", date: "Dec 28, 5:00 PM" },
      { status: "Work Completed", date: "Dec 29, 2:00 PM", note: "New lock installed" },
    ],
  },
];

// =============================================
// COMPONENTS
// =============================================
function StatusBadge({ status }: { status: TicketStatus }) {
  const config = {
    pending: { color: "bg-yellow-100 text-yellow-700", label: "Pending Review" },
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

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const config = {
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

function CategoryIcon({ category }: { category: IssueCategory }) {
  const cat = ISSUE_CATEGORIES.find(c => c.id === category);
  const Icon = cat?.icon || Wrench;
  return (
    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
      <Icon className="w-5 h-5 text-orange-600" />
    </div>
  );
}

// =============================================
// CREATE TICKET MODAL
// =============================================
function CreateTicketModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: Partial<MaintenanceTicket>) => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: "" as IssueCategory | "",
    title: "",
    description: "",
    priority: "medium" as TicketPriority,
    images: [] as string[],
  });

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      category: formData.category as IssueCategory,
      id: `MT${Date.now()}`,
      status: "pending",
      location: "Kampala",
      unit: "My Unit",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-orange-500 text-white p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-orange-100">Step {step} of 3</p>
            <h2 className="font-bold text-lg">Report Maintenance Issue</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-orange-100">
          <div className="h-full bg-orange-500 transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Select Issue Category</h3>
              <div className="grid grid-cols-2 gap-3">
                {ISSUE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      formData.category === cat.id 
                        ? "border-orange-500 bg-orange-50" 
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    <cat.icon className={`w-6 h-6 ${formData.category === cat.id ? "text-orange-600" : "text-gray-400"}`} />
                    <span className={`text-sm font-medium ${formData.category === cat.id ? "text-orange-600" : "text-gray-600"}`}>
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Broken electrical outlet"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="low">Low - Can wait a few days</option>
                  <option value="medium">Medium - Should be fixed soon</option>
                  <option value="high">High - Needs attention today</option>
                  <option value="urgent">Urgent - Safety/Security issue</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Photos (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">Take or upload photos of the issue</p>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload Photos
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-3">Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium capitalize">{formData.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Title</span>
                    <span className="font-medium">{formData.title || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Priority</span>
                    <PriorityBadge priority={formData.priority} />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Your ticket will be sent to the property owner for review. They will assign a service provider to handle the issue.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !formData.category}
              className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Submit Ticket
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================
// TICKET DETAIL MODAL
// =============================================
function TicketDetailModal({ ticket, onClose }: { ticket: MaintenanceTicket; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-orange-500 text-white p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-orange-100">Ticket #{ticket.id}</p>
            <h2 className="font-bold text-lg">{ticket.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[65vh] space-y-4">
          {/* Status & Priority */}
          <div className="flex items-center justify-between">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-600">{ticket.description}</p>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{ticket.location} - {ticket.unit}</span>
          </div>

          {/* Assigned Provider */}
          {ticket.assignedProvider && (
            <div className="bg-green-50 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 mb-3">Assigned Provider</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{ticket.assignedProvider.name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{ticket.assignedProvider.rating}</span>
                    <span>•</span>
                    <span>{ticket.assignedProvider.serviceType}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${ticket.assignedProvider.phone}`} className="p-2 bg-green-500 text-white rounded-lg">
                    <Phone className="w-5 h-5" />
                  </a>
                  <a href={`sms:${ticket.assignedProvider.phone}`} className="p-2 bg-blue-500 text-white rounded-lg">
                    <MessageCircle className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Providers (for pending tickets) */}
          {ticket.suggestedProviders && ticket.status === "pending" && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Suggested Providers</h3>
              <div className="space-y-2">
                {ticket.suggestedProviders.map((provider) => (
                  <div key={provider.id} className="border rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{provider.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{provider.rating}</span>
                        <span>•</span>
                        <span>{provider.price}</span>
                      </div>
                      <p className="text-xs text-green-600">{provider.availability}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Waiting for property owner to select a provider
              </p>
            </div>
          )}

          {/* Timeline */}
          {ticket.timeline && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Timeline</h3>
              <div className="space-y-3">
                {ticket.timeline.map((event, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${index === ticket.timeline!.length - 1 ? "bg-orange-500" : "bg-green-500"}`} />
                      {index < ticket.timeline!.length - 1 && <div className="w-0.5 h-full bg-gray-200" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="font-medium text-sm">{event.status}</p>
                      <p className="text-xs text-gray-500">{event.date}</p>
                      {event.note && <p className="text-xs text-gray-600 mt-1">{event.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <button onClick={onClose} className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// MAIN MAINTENANCE DASHBOARD
// =============================================
export default function MaintenanceDashboard() {
  const [tickets, setTickets] = useState(DUMMY_TICKETS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");

  const filteredTickets = statusFilter === "all" 
    ? tickets 
    : tickets.filter(t => t.status === statusFilter);

  const handleCreateTicket = (data: Partial<MaintenanceTicket>) => {
    setTickets([data as MaintenanceTicket, ...tickets]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modals */}
      {showCreateModal && (
        <CreateTicketModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreateTicket} />
      )}
      {selectedTicket && (
        <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Maintenance Tickets</h1>
              <p className="text-orange-100">Report and track property issues</p>
            </div>
            <button className="p-2 bg-white/20 rounded-lg">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="font-bold text-gray-900">{tickets.filter(t => t.status === "pending").length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Assigned</p>
                <p className="font-bold text-gray-900">{tickets.filter(t => t.status === "assigned").length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">In Progress</p>
                <p className="font-bold text-gray-900">{tickets.filter(t => t.status === "in_progress").length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="font-bold text-gray-900">{tickets.filter(t => t.status === "completed").length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Report Issue Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full py-4 bg-orange-500 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 shadow-lg mb-4"
        >
          <Plus className="w-5 h-5" />
          Report New Issue
        </button>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {[
            { id: "all", label: "All" },
            { id: "pending", label: "Pending" },
            { id: "assigned", label: "Assigned" },
            { id: "in_progress", label: "In Progress" },
            { id: "completed", label: "Completed" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id as TicketStatus | "all")}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                statusFilter === filter.id 
                  ? "bg-orange-500 text-white" 
                  : "bg-white text-gray-600 border"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Ticket List */}
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <CategoryIcon category={ticket.category} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">#{ticket.id}</span>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                  <p className="text-sm text-gray-500 truncate mt-1">{ticket.description}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={ticket.status} />
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {ticket.assignedProvider && (
                <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-gray-600">
                  <Wrench className="w-4 h-4" />
                  <span>{ticket.assignedProvider.name}</span>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 ml-2" />
                  <span>{ticket.assignedProvider.rating}</span>
                </div>
              )}
            </div>
          ))}

          {filteredTickets.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl">
              <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-500 mb-4">You haven&apos;t reported any maintenance issues yet</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Report an Issue
              </button>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">How Maintenance Requests Work</h3>
          <div className="space-y-4">
            {[
              { step: 1, title: "Submit Issue", desc: "Report the problem with photos and details" },
              { step: 2, title: "System Suggests Providers", desc: "We find the best service providers nearby" },
              { step: 3, title: "Owner Assigns Provider", desc: "Property owner reviews and approves" },
              { step: 4, title: "Provider Fixes Issue", desc: "Service provider completes the work" },
              { step: 5, title: "Payment Released", desc: "Payment is released after verification" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-bold text-orange-600">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
        <div className="flex">
          <Link href="/" className="flex-1 flex flex-col items-center py-3 text-gray-500">
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/providers" className="flex-1 flex flex-col items-center py-3 text-gray-500">
            <Search className="w-5 h-5" />
            <span className="text-xs mt-1">Services</span>
          </Link>
          <Link href="/dashboard/maintenance" className="flex-1 flex flex-col items-center py-3 text-orange-500">
            <Wrench className="w-5 h-5" />
            <span className="text-xs mt-1">Maintenance</span>
          </Link>
          <Link href="/dashboard/user" className="flex-1 flex flex-col items-center py-3 text-gray-500">
            <User className="w-5 h-5" />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
