"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, Repeat, Star, X, Phone, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { providerService } from "@/services/provider.service";
import { JobStatusTimeline } from "@/components/jobs/JobStatusTimeline";

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
  description?: string;
  amount?: number;
  currency?: string;
  providerPhone?: string;
  completedAt?: string;
  rating?: number;
  review?: string;
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
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [jobs, setJobs] = useState<any[]>([]); // Store original job data
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Redirect service providers to their dashboard (they manage jobs there, not bookings)
  useEffect(() => {
    if (user?.role === 'service_provider') {
      router.replace('/dashboard/provider');
    }
  }, [user, router]);

  useEffect(() => {
    // Only fetch bookings if user is not a service provider
    if (user?.role !== 'service_provider' && user?.id) {
      console.log('[BOOKINGS] User authenticated, fetching bookings...', { userId: user.id, email: user.email });
      fetchBookings();
    } else if (!user) {
      console.log('[BOOKINGS] User not authenticated yet');
    }
  }, [user]);

  // Refresh bookings when page becomes visible or focused (e.g., after returning from creating a job)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.role !== 'service_provider') {
        console.log('[BOOKINGS] Page became visible, refreshing...');
        fetchBookings();
      }
    };

    const handleFocus = () => {
      if (user?.role !== 'service_provider') {
        console.log('[BOOKINGS] Page focused, refreshing...');
        fetchBookings();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('[BOOKINGS] Fetching user jobs for user:', user?.id, user?.email);
      const response = await providerService.getMyJobs(undefined, 1, 100);
      console.log('[BOOKINGS] Received response:', {
        total: response.meta?.total || 0,
        dataCount: response.data?.length || 0,
        data: response.data,
      });
      
      // Map jobs to bookings format with proper data extraction
      const mappedBookings: Booking[] = (response.data || []).map((job: any) => {
        console.log('[BOOKINGS] Processing job:', job.id, job);
        
        // Extract provider name properly
        // Note: Job.provider is a User entity (not Provider entity), so it has firstName and lastName directly
        let providerName = "Not Assigned";
        if (job.providerId) {
          if (job.provider) {
            // Provider is a User entity, so it has firstName and lastName directly
            const firstName = job.provider.firstName || '';
            const lastName = job.provider.lastName || '';
            providerName = `${firstName} ${lastName}`.trim() || "Provider";
          } else {
            providerName = "Provider";
          }
        }
        
        // Extract location properly
        let location = "Location not specified";
        if (job.location) {
          if (typeof job.location === 'string') {
            location = job.location;
          } else if (job.location.address) {
            location = job.location.address;
            if (job.location.city && job.location.city !== job.location.address) {
              location += `, ${job.location.city}`;
            }
          } else if (job.location.city) {
            location = job.location.city;
          }
        }
        
        // Format service type - use title if available, otherwise format serviceType
        let serviceType = "Service";
        if (job.title) {
          serviceType = job.title;
        } else if (job.serviceType) {
          // Format service type: "electrician" -> "Electrician", "appliance_repair" -> "Appliance Repair"
          serviceType = job.serviceType
            .split('_')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
        
        return {
          id: job.id,
          serviceType: serviceType,
          providerName: providerName,
          scheduledDate: job.scheduledDate || job.createdAt,
          scheduledTime: job.scheduledTime || "Not specified",
          location: location,
          status: job.status || "pending",
          isRecurring: false, // Not supported yet in backend
          frequency: undefined,
          nextOccurrence: undefined,
        };
      });

      console.log('[BOOKINGS] Mapped bookings:', mappedBookings);
      setBookings(mappedBookings);
      setJobs(response.data || []); // Store original job data for detail modal
      
      if (mappedBookings.length === 0) {
        console.warn('[BOOKINGS] No bookings found. Check if jobs exist in database for this user.');
      }
    } catch (error: any) {
      console.error("Failed to fetch bookings:", error);
      console.error("Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      setBookings([]); // Set empty array on error to show "no bookings" message
    } finally {
      setLoading(false);
    }
  };

  // Don't render if user is a service provider (they'll be redirected)
  if (user?.role === 'service_provider') {
    return null;
  }

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000); // Auto-hide after 5 seconds
  };

  const handleRateJob = async (jobId: string, rating: number, review: string) => {
    try {
      await providerService.rateJob(jobId, rating, review);
      showToast('success', 'Review submitted successfully!');
      setShowReviewModal(false);
      setSelectedBooking(null);
      fetchBookings(); // Refresh to show the rating
    } catch (error) {
      console.error("Error submitting review:", error);
      showToast('error', error instanceof Error ? error.message : "Failed to submit review");
    }
  };

  const handleCancelBooking = async (bookingId: string, reason?: string) => {
    try {
      await providerService.cancelJob(bookingId, reason || "Cancelled by client");
      showToast('success', 'Booking cancelled successfully');
      setShowCancelModal(false);
      setBookingToCancel(null);
      fetchBookings();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      showToast('error', error instanceof Error ? error.message : "Failed to cancel booking");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && bookingToCancel && (
        <CancelBookingModal
          booking={bookingToCancel}
          onConfirm={(reason) => handleCancelBooking(bookingToCancel.id, reason)}
          onCancel={() => {
            setShowCancelModal(false);
            setBookingToCancel(null);
          }}
        />
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && !showReviewModal && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onCancel={async (id: string) => {
            setBookingToCancel(selectedBooking);
            setShowCancelModal(true);
            setSelectedBooking(null);
          }}
          onReview={() => setShowReviewModal(true)}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && selectedBooking && (
        <ReviewModal
          booking={selectedBooking}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedBooking(null);
          }}
          onSubmit={(rating, review) => handleRateJob(selectedBooking.id, rating, review)}
        />
      )}

      {/* Cancel Booking Confirmation Modal */}
      {showCancelModal && bookingToCancel && (
        <CancelBookingModal
          booking={bookingToCancel}
          onCancel={() => {
            setShowCancelModal(false);
            setBookingToCancel(null);
          }}
          onConfirm={(reason) => handleCancelBooking(bookingToCancel.id, reason)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
            <p className="text-gray-600">Manage your service appointments and bookings</p>
          </div>
          <button
            onClick={() => fetchBookings()}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
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
                          {booking.serviceType || "Service"}
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
                        <span>{booking.providerName || "Provider"}</span>
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
                            â€¢ Next: {new Date(booking.nextOccurrence).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                    <button 
                      onClick={() => setSelectedBooking(booking)}
                      className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      View Details
                    </button>
                    {booking.status === "pending" && (
                      <button 
                        onClick={() => {
                          setBookingToCancel(booking);
                          setShowCancelModal(true);
                        }}
                        className="flex-1 py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
                      >
                        Cancel Booking
                      </button>
                    )}
                    {booking.status === "completed" && !booking.rating && (
                      <button 
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowReviewModal(true);
                        }}
                        className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
                      >
                        Leave Review
                      </button>
                    )}
                    {booking.status === "completed" && booking.rating && (
                      <div className="flex-1 py-2 px-4 bg-gray-100 text-gray-600 rounded-lg font-medium text-center flex items-center justify-center gap-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        Rated {booking.rating}/5
                      </div>
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

// =============================================
// BOOKING DETAIL MODAL
// =============================================
function BookingDetailModal({
  booking,
  onClose,
  onCancel,
  onReview,
}: {
  booking: Booking;
  onClose: () => void;
  onCancel: (id: string) => void;
  onReview: () => void;
}) {
  const StatusIcon = statusConfig[booking.status].icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-500 text-white p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-100">Booking #{booking.id.substring(0, 8)}</p>
            <h2 className="font-bold text-lg">{booking.serviceType}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Status</span>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusConfig[booking.status].color}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{statusConfig[booking.status].label}</span>
            </div>
          </div>

          {/* Provider Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Service Provider</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{booking.providerName || "Not Assigned"}</p>
                {booking.providerPhone && booking.providerPhone !== "N/A" && (
                  <p className="text-sm text-gray-500">{booking.providerPhone}</p>
                )}
              </div>
              {booking.providerPhone && booking.providerPhone !== "N/A" && (
                <a href={`tel:${booking.providerPhone}`} className="p-2 bg-green-500 text-white rounded-lg">
                  <Phone className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Schedule</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{new Date(booking.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{booking.scheduledTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{booking.location}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {booking.description && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-600">{booking.description}</p>
            </div>
          )}

          {/* Amount */}
          {booking.amount && booking.amount > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
              <span className="text-gray-700">Amount</span>
              <span className="text-xl font-bold text-blue-600">{booking.currency || 'UGX'} {booking.amount.toLocaleString()}</span>
            </div>
          )}

          {/* Status Timeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <JobStatusTimeline
              status={booking.status}
              createdAt={booking.scheduledDate}
              completedAt={booking.completedAt}
            />
          </div>

          {/* Existing Rating */}
          {booking.rating && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Your Rating</h3>
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${star <= (booking.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
                <span className="text-sm text-gray-600 ml-2">{booking.rating}/5</span>
              </div>
              {booking.review && (
                <p className="text-sm text-gray-600">{booking.review}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 space-y-2">
          {booking.status === "pending" && (
            <button
              onClick={() => {
                onClose();
                onCancel(booking.id);
              }}
              className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Cancel Booking
            </button>
          )}
          {booking.status === "completed" && !booking.rating && (
            <button
              onClick={onReview}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Star className="w-5 h-5 inline mr-2" />
              Leave Review
            </button>
          )}
          <button onClick={onClose} className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// REVIEW MODAL
// =============================================
function ReviewModal({
  booking,
  onClose,
  onSubmit,
}: {
  booking: Booking;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => void | Promise<void>;
}) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      return; // Inline error will show below
    }
    setIsSubmitting(true);
    try {
      await onSubmit(rating, review);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Rate Your Experience</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Service: {booking.serviceType}</p>
          <p className="text-sm text-gray-600">Provider: {booking.providerName}</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Rating</label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    star <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 hover:text-yellow-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review (Optional)
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
        {rating === 0 && (
          <p className="text-sm text-red-600 mt-2 text-center">Please select a rating</p>
        )}
      </div>
    </div>
  );
}

// =============================================
// TOAST NOTIFICATION COMPONENT
// =============================================
function ToastNotification({
  type,
  message,
  onClose,
}: {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
}) {
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-500',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-500',
    },
    info: {
      icon: AlertCircle,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500',
    },
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type];

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right">
      <div className={`${bgColor} ${borderColor} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${textColor}`}>{message}</p>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${textColor} hover:opacity-70 transition-opacity`}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// CANCEL BOOKING CONFIRMATION MODAL
// =============================================
function CancelBookingModal({
  booking,
  onConfirm,
  onCancel,
}: {
  booking: Booking;
  onConfirm: (reason?: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const handleConfirm = async () => {
    setIsCancelling(true);
    try {
      await onConfirm(reason);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Cancel Booking</h2>
            <p className="text-sm text-gray-600 mt-1">Are you sure you want to cancel this booking?</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">{booking.serviceType}</p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
            <span className="text-gray-400">•</span>
            <Clock className="w-4 h-4" />
            <span>{booking.scheduledTime}</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for cancellation (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Let us know why you're cancelling..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
          >
            Keep Booking
          </button>
          <button
            onClick={handleConfirm}
            disabled={isCancelling}
            className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCancelling ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cancelling...
              </>
            ) : (
              'Cancel Booking'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

