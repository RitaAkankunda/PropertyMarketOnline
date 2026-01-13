"use client";

import { useEffect, useState } from "react";
import { maintenanceTicketsService, propertyService } from "@/services";
import { useAuthStore } from "@/store/auth.store";
import type { MaintenanceTicket as ApiMaintenanceTicket, TicketCategory, TicketPriority, TicketStatus } from "@/services/maintenance-tickets.service";
import Link from "next/link";
import {
  AlertTriangle,
  Home,
  Wrench,
  Clock,
  CheckCircle,
  Plus,
  Search,
  X,
  MapPin,
  User,
  Phone,
  MessageCircle,
  Zap,
  Droplets,
  Wifi,
  DoorOpen,
  Thermometer,
  Shield,
  Star,
  Settings,
} from "lucide-react";

type IssueCategory = TicketCategory;
type MaintenanceTicket = ApiMaintenanceTicket;

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

function formatTicketForDisplay(ticket: MaintenanceTicket): MaintenanceTicket {
  return ticket;
}

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
    high: { color: "bg-blue-100 text-blue-600", label: "High" },
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
  const cat = ISSUE_CATEGORIES.find((c) => c.id === category);
  const Icon = cat?.icon || Wrench;
  return (
    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
      <Icon className="w-5 h-5 text-blue-600" />
    </div>
  );
}

function CreateTicketModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: Partial<MaintenanceTicket>) => Promise<void> | void;
}) {
  const [formData, setFormData] = useState({
    category: "" as IssueCategory | "",
    title: "",
    description: "",
    priority: "medium" as TicketPriority,
    location: "",
    unit: "",
    images: [] as string[],
  });

  const handleSubmit = async () => {
    await onSubmit({
      ...formData,
      category: formData.category as IssueCategory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "pending",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <p className="text-xs text-gray-500">Report an issue</p>
            <h2 className="font-bold text-lg">New Maintenance Ticket</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Category</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ISSUE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = formData.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`p-3 rounded-lg border flex items-center gap-2 text-sm ${
                      isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Title</label>
            <input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="Brief description"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Details</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded-lg"
              rows={3}
              placeholder="Explain the issue"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Unit</label>
              <input
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="e.g. Apt 4B"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Location</label>
            <input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="Property name or address"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!formData.title || !formData.description || !formData.category}
            className="w-full py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50"
          >
            Submit Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

function TicketDetailModal({ ticket, onClose }: { ticket: MaintenanceTicket; onClose: () => void }) {
  const timeline = (ticket as unknown as { timeline?: Array<{ status: string; date?: string; note?: string }> }).timeline;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-100">Ticket #{ticket.id}</p>
            <h2 className="font-bold text-lg">{ticket.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[70vh] space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{ticket.location}{ticket.unit ? ` - ${ticket.unit}` : ""}</span>
          </div>

          {ticket.assignedProvider && (
            <div className="bg-green-50 rounded-xl p-4 space-y-2">
              <h3 className="font-medium text-gray-900">Assigned Provider</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {ticket.assignedProvider.businessName || `${ticket.assignedProvider.firstName ?? ""} ${ticket.assignedProvider.lastName ?? ""}`.trim() || "Assigned provider"}
                  </p>
                  {ticket.assignedProvider.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="w-4 h-4" />
                      <span>{ticket.assignedProvider.phone}</span>
                    </div>
                  )}
                </div>
                {ticket.assignedProvider.phone && (
                  <div className="flex gap-2">
                    <a href={`tel:${ticket.assignedProvider.phone}`} className="p-2 bg-green-500 text-white rounded-lg">
                      <Phone className="w-5 h-5" />
                    </a>
                    <a href={`sms:${ticket.assignedProvider.phone}`} className="p-2 bg-blue-500 text-white rounded-lg">
                      <MessageCircle className="w-5 h-5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {timeline && timeline.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Timeline</h3>
              <div className="space-y-3">
                {timeline.map((event, index) => (
                  <div key={`${event.status}-${index}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${index === timeline.length - 1 ? "bg-blue-500" : "bg-green-500"}`} />
                      {index < timeline.length - 1 && <div className="w-0.5 h-full bg-gray-200" />}
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

        <div className="border-t p-4">
          <button onClick={onClose} className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MaintenanceDashboard() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProperties, setUserProperties] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!user?.id) return;
      try {
        const response = await propertyService.getMyListings(1, 100);
        const listings = response.data || [];
        if (listings.length > 0) {
          setUserProperties(listings.map((p) => ({ id: p.id, title: p.title })));
        } else {
          setUserProperties([]);
        }
      } catch (err) {
        console.error("Error fetching properties:", err);
        setUserProperties([]);
      }
    };

    fetchProperties();
  }, [user]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const status = statusFilter === "all" ? undefined : statusFilter;
        const response = await maintenanceTicketsService.getTickets({ status }, 1, 100);
        const formatted = response.data.map(formatTicketForDisplay);
        setTickets(formatted);
      } catch (err) {
        console.error("Error fetching tickets:", err);
        setError(err instanceof Error ? err.message : "Failed to load maintenance tickets");
        setTickets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [statusFilter]);

  const filteredTickets = statusFilter === "all" ? tickets : tickets.filter((t) => t.status === statusFilter);

  const handleCreateTicket = async (data: Partial<MaintenanceTicket>) => {
    try {
      const propertyId = userProperties.length > 0 ? userProperties[0].id : "default";
      const propertyName = userProperties.length > 0 ? userProperties[0].title : "My Property";

      const newTicket = await maintenanceTicketsService.create({
        title: data.title || "",
        description: data.description || "",
        category: data.category as IssueCategory,
        priority: data.priority || "medium",
        property: propertyName,
        unit: data.unit || "",
        location: data.location || "",
        images: data.images,
        propertyId,
      });

      const formatted = formatTicketForDisplay(newTicket);
      setTickets([formatted, ...tickets]);
    } catch (err) {
      console.error("Error creating ticket:", err);
      alert(err instanceof Error ? err.message : "Failed to create ticket");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showCreateModal && <CreateTicketModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreateTicket} />}
      {selectedTicket && <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Maintenance Tickets</h1>
              <p className="text-blue-100">Report and track property issues</p>
            </div>
            <button className="p-2 bg-white/20 rounded-lg">
              <Clock className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="font-bold text-gray-900">{tickets.filter((t) => t.status === "pending").length}</p>
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
                <p className="font-bold text-gray-900">{tickets.filter((t) => t.status === "assigned").length}</p>
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
                <p className="font-bold text-gray-900">{tickets.filter((t) => t.status === "in_progress").length}</p>
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
                <p className="font-bold text-gray-900">{tickets.filter((t) => t.status === "completed").length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full py-4 bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 shadow-lg mb-4"
        >
          <Plus className="w-5 h-5" />
          Report New Issue
        </button>

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
                statusFilter === filter.id ? "bg-blue-500 text-white" : "bg-white text-gray-600 border"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tickets...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-red-50 rounded-xl">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => (
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
                    <p className="text-xs text-gray-400 mt-2">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {ticket.assignedProvider && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-gray-600">
                    <Wrench className="w-4 h-4" />
                    <span>{ticket.assignedProvider.businessName || `${ticket.assignedProvider.firstName ?? ""} ${ticket.assignedProvider.lastName ?? ""}`.trim()}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 ml-2" />
                    <span>{ticket.assignedProvider.rating}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-500 mb-4">You haven\'t reported any maintenance issues yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Report an Issue
              </button>
            </div>
          )}
        </div>

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
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
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
          <Link href="/dashboard/maintenance" className="flex-1 flex flex-col items-center py-3 text-blue-600">
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
