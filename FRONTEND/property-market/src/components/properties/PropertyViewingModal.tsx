"use client";

import { useState } from "react";
import { X, Calendar, Clock, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui";
import type { Property } from "@/types";

interface PropertyViewingModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyViewingModal({ property, isOpen, onClose }: PropertyViewingModalProps) {
  const [step, setStep] = useState(1); // 2 steps: details, success
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    viewingDate: "",
    viewingTime: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("Viewing appointment submitted:", {
      propertyId: property.id,
      propertyType: property.propertyType,
      listingType: property.listingType,
      formData,
    });

    setIsSubmitting(false);
    setStep(2); // Success step
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Appointment Scheduled!</h3>
            <p className="text-gray-600 mb-6">
              Your viewing appointment has been scheduled. The property owner will contact you to confirm the details.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-medium text-gray-900 mb-2">What to expect:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✓ Confirmation email with property details</li>
                <li>✓ Owner contact information</li>
                <li>✓ Directions and parking instructions</li>
                <li>✓ Contact owner 30 minutes before viewing</li>
              </ul>
            </div>
            <Button
              onClick={handleClose}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
