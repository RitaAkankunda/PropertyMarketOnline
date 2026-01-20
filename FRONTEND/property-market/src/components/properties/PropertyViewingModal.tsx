"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, Clock, MessageSquare, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { propertyService } from "@/services";
import type { Property } from "@/types";

interface PropertyViewingModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyViewingModal({ property, isOpen, onClose }: PropertyViewingModalProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [step, setStep] = useState(1); // 2 steps: details, success
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : "",
    email: user?.email || "",
    phone: user?.phone || "",
    viewingDate: "",
    viewingTime: "",
    notes: "",
  });

  // Restore form data after login/registration
  useEffect(() => {
    if (isAuthenticated && !authLoading && isOpen) {
      const savedViewing = sessionStorage.getItem('pendingPropertyViewing');
      if (savedViewing) {
        try {
          const viewingState = JSON.parse(savedViewing);
          if (viewingState.propertyId === property.id) {
            setFormData(viewingState.formData || {
              name: user ? `${user.firstName} ${user.lastName}` : "",
              email: user?.email || "",
              phone: user?.phone || "",
              viewingDate: viewingState.formData?.viewingDate || "",
              viewingTime: viewingState.formData?.viewingTime || "",
              notes: viewingState.formData?.notes || "",
            });
            console.log('[PROPERTY VIEWING] Form data restored after login for property:', property.title);
            sessionStorage.removeItem('pendingPropertyViewing');
          }
        } catch (err) {
          console.error('[PROPERTY VIEWING] Failed to restore form data:', err);
        }
      }
    }
  }, [isAuthenticated, authLoading, isOpen, property.id, property.title, user]);

  // Update form data when user changes
  useEffect(() => {
    if (user && isAuthenticated) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || `${user.firstName} ${user.lastName}`,
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user, isAuthenticated]);

  const handleLoginClick = () => {
    // Save form data before redirecting
    const viewingState = {
      propertyId: property.id,
      formData: {
        ...formData,
        name: formData.name || "",
        email: formData.email || "",
        phone: formData.phone || "",
        viewingDate: formData.viewingDate,
        viewingTime: formData.viewingTime,
        notes: formData.notes,
      },
    };
    sessionStorage.setItem('pendingPropertyViewing', JSON.stringify(viewingState));
    
    // Redirect to login with return URL
    const returnUrl = `/properties/${property.id}?restoreViewing=true`;
    router.push(`/auth/login?return=${encodeURIComponent(returnUrl)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Allow booking without authentication - use form data or user data
      const bookingData = {
        propertyId: property.id,
        type: 'viewing' as const,
        name: formData.name || (user ? `${user.firstName} ${user.lastName}` : ''),
        email: formData.email || user?.email || '',
        phone: formData.phone || user?.phone || '',
        message: formData.notes,
        scheduledDate: formData.viewingDate,
        scheduledTime: formData.viewingTime,
      };

      console.log('[PROPERTY VIEWING] Submitting booking to backend:', bookingData);
      const result = await propertyService.createBooking(bookingData);
      console.log('[PROPERTY VIEWING] ✅ Backend response received:', {
        id: result.id,
        type: result.type,
        status: result.status,
        propertyId: result.propertyId,
        createdAt: result.createdAt,
      });

      // Clear any saved viewing data
      sessionStorage.removeItem('pendingPropertyViewing');
      setStep(2); // Success step
    } catch (error: any) {
      console.error("Error scheduling viewing:", error);
      console.error("Error response:", error?.response);
      console.error("Error data:", error?.response?.data);
      
      // Extract error message from various possible formats
      let errorMessage = "Failed to schedule viewing. Please try again.";
      if (error?.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.join(', ');
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      name: "",
      email: "",
      phone: "",
      viewingDate: "",
      viewingTime: "",
      notes: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Schedule Your Viewing</h2>
              <p className="text-blue-100 text-sm">{property.title}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        {step < 2 && (
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2 mb-6">
              <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-blue-500" : "bg-gray-200"}`} />
              <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-blue-500" : "bg-gray-200"}`} />
            </div>
          </div>
        )}

        {/* Step 1: Viewing Details */}
        {step === 1 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Optional: Show info banner if not authenticated (but allow submission) */}
            {!authLoading && !isAuthenticated && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800 mb-1">Guest Booking</p>
                    <p className="text-sm text-blue-700 mb-3">
                      You can schedule a viewing without an account. Or <Link href={`/auth/login?return=${encodeURIComponent(`/properties/${property.id}`)}`} className="underline font-medium">login</Link> to track your bookings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Show error message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+256 700 000 000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Preferred Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.viewingDate}
                  onChange={(e) => setFormData({ ...formData, viewingDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Preferred Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.viewingTime}
                  onChange={(e) => setFormData({ ...formData, viewingTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Additional Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Any special requests or questions about the viewing?"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                <strong>Next steps:</strong> The property owner will confirm your viewing appointment and send you directions. Expect a response within 2-4 hours.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Viewing
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Success */}
        {step === 2 && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Viewing Scheduled!</h3>
            <p className="text-gray-600 mb-6">
              Your viewing request has been sent to the property owner. They will contact you at <strong>{formData.email}</strong> or <strong>{formData.phone}</strong> to confirm.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-green-800 mb-2">📅 Your Viewing Details:</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li><strong>Property:</strong> {property.title}</li>
                <li><strong>Date:</strong> {new Date(formData.viewingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
                <li><strong>Time:</strong> {formData.viewingTime}</li>
                <li><strong>Contact:</strong> {formData.name} ({formData.phone})</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-medium text-gray-900 mb-2">What happens next:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✓ Property owner receives your viewing request</li>
                <li>✓ They will confirm via email or phone within 24 hours</li>
                <li>✓ You'll receive directions and parking info</li>
                <li>✓ Arrive 5 minutes early for your viewing</li>
              </ul>
            </div>
            
            {/* Prompt for guests to create account */}
            {!isAuthenticated && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">💬 Want to chat with the owner?</p>
                    <p className="text-sm text-gray-600 mb-3">
                      Create a free account to message property owners directly, track your viewings, and get instant updates on your booking.
                    </p>
                    <Link
                      href={`/auth/register?email=${encodeURIComponent(formData.email)}&name=${encodeURIComponent(formData.name)}`}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Create Free Account
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            <Button
              onClick={handleClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
