"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, Repeat } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { providerService } from "@/services/provider.service";

interface Booking {
  id: string;
  serviceType: string;
  providerName: string;
  scheduledDate: string;
  scheduledTime: string;
  location: string;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  isRecurring: boolean;
  frequency?: "weekly" | "bi-weekly" | "monthly";
  nextOccurrence?: string;
}

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  accepted: { label: "Accepted", icon: CheckCircle, color: "text-green-600 bg-green-50 border-green-200" },
  in_progress: { label: "In Progress", icon: AlertCircle, color: "text-blue-600 bg-blue-50 border-blue-200" },
  completed: { label: "Completed", icon: CheckCircle, color: "text-gray-600 bg-gray-50 border-gray-200" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-600 bg-red-50 border-red-200" },
};

export default function BookingsPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call to fetch user's bookings
      const jobs = await providerService.getMyJobs();
      
      const mappedBookings: Booking[] = jobs.map((job: any) => ({
        id: job.id,
        serviceType: job.serviceType,
        providerName: job.provider?.businessName || "Provider",
        scheduledDate: job.scheduledDate,
        scheduledTime: job.scheduledTime,
        location: job.location?.address || "Location not specified",
        status: job.status,
        isRecurring: false, // TODO: Add recurring flag from backend
        frequency: undefined,
        nextOccurrence: undefined,
      }));

      setBookings(mappedBookings);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "upcoming") {
      return ["pending", "accepted", "in_progress"].includes(booking.status);
    }
    if (filter === "completed") {
      return ["completed", "cancelled"].includes(booking.status);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Manage your service appointments and bookings</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-1 mb-6 inline-flex">
          {[
            { value: "all", label: "All Bookings" },
            { value: "upcoming", label: "Upcoming" },
            { value: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as any)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                filter === tab.value
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              {filter === "upcoming" 
                ? "You don't have any upcoming appointments"
                : filter === "completed"
                ? "You haven't completed any bookings yet"
                : "You haven't made any bookings yet"}
            </p>
            <a
              href="/providers"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
            >
              Browse Services
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const StatusIcon = statusConfig[booking.status].icon;
              
              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {booking.serviceType.charAt(0).toUpperCase() + booking.serviceType.slice(1)} Service
                        </h3>
                        {booking.isRecurring && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            <Repeat className="w-3 h-3" />
                            Recurring
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <User className="w-4 h-4" />
                        <span>{booking.providerName}</span>
                      </div>
                    </div>

                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusConfig[booking.status].color}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">{statusConfig[booking.status].label}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(booking.scheduledDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Time</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{booking.scheduledTime}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Location</p>
                        <p className="text-sm font-medium text-gray-900">{booking.location}</p>
                      </div>
                    </div>
                  </div>

                  {booking.isRecurring && booking.frequency && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Repeat className="w-4 h-4" />
                        <span>Repeats {booking.frequency}</span>
                        {booking.nextOccurrence && (
                          <span className="text-gray-400">
                            • Next: {new Date(booking.nextOccurrence).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                    <button className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                      View Details
                    </button>
                    {booking.status === "pending" && (
                      <button className="flex-1 py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors">
                        Cancel Booking
                      </button>
                    )}
                    {booking.status === "completed" && (
                      <button className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors">
                        Leave Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
