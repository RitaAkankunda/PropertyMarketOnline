"use client";

import { useState } from "react";
import { X, Calendar, Users, MessageSquare, Clock, DollarSign, Home, MapPin, Send, CreditCard, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { propertyService } from "@/services";
import { useAuthStore } from "@/store/auth.store";
import type { Property } from "@/types";
import { cn } from "@/lib/utils";

interface PropertyInquiryModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyInquiryModal({ property, isOpen, onClose }: PropertyInquiryModalProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(1); // Now 4 steps: 1) Details, 2) Contact, 3) Payment, 4) Success
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [paymentOption, setPaymentOption] = useState<"full" | "deposit">("full");

  // Form state
  const [formData, setFormData] = useState({
    // Common fields
    name: user ? `${user.firstName} ${user.lastName}` : "",
    email: user?.email || "",
    phone: user?.phone || "",
    message: "",

    // Airbnb/Short-term rental fields
    checkIn: "",
    checkOut: "",
    guests: 1,

    // Long-term rental fields
    moveInDate: "",
    leaseDuration: "",
    occupants: 1,

    // Sale property fields
    viewingDate: "",
    viewingTime: "",
    financingType: "cash",
    offerAmount: "",

    // Commercial fields
    businessType: "",
    spaceRequirements: "",
    leaseTerm: "",

    // Payment fields
    paymentAmount: 0,
    depositAmount: 0,
  });

  // Payment methods
  const paymentMethods = [
    { id: "mtn", name: "MTN Mobile Money", icon: "📱", color: "bg-yellow-500" },
    { id: "airtel", name: "Airtel Money", icon: "💳", color: "bg-red-500" },
    { id: "visa", name: "Visa Card", icon: "💳", color: "bg-blue-600" },
    { id: "paypal", name: "PayPal", icon: "🌐", color: "bg-blue-500" },
  ];

  // Determine form type based on property
  const isAirbnb = property.propertyType === "airbnb";
  const isForSale = property.listingType === "sale";
  const isForRent = property.listingType === "rent";
  const isForLease = property.listingType === "lease";
  const isCommercial = property.propertyType === "commercial" || property.propertyType === "office" || property.propertyType === "warehouse";

  // Determine if payment step is needed - only for Airbnb bookings where user is actually booking a stay
  // Regular inquiries for rentals/sales don't require payment upfront
  const needsPayment = isAirbnb;

  // Calculate estimated cost for short-term rentals
  const calculateStayCost = () => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (nights < 1) return 0;
    // Assuming nightly rate calculation (simplified)
    const nightlyRate = property.price / 30; // Rough monthly to nightly conversion
    return nights * nightlyRate;
  };

  // Calculate payment amounts based on property type
  const calculatePaymentAmounts = () => {
    let totalAmount = 0;
    let depositAmount = 0;
    let description = "";

    if (isAirbnb) {
      totalAmount = calculateStayCost();
      depositAmount = totalAmount * 0.3; // 30% deposit
      description = "Accommodation booking";
    } else if (isForRent || isForLease) {
      totalAmount = property.price; // First month rent
      depositAmount = property.price * 0.5; // 50% deposit (security deposit)
      description = isForRent ? "First month rent + security deposit" : "Lease security deposit";
    } else if (isForSale) {
      totalAmount = property.price * 0.01; // 1% earnest money
      depositAmount = totalAmount * 0.5; // 50% of earnest money
      description = "Earnest money deposit";
    }

    return { totalAmount, depositAmount, description };
  };

  const { totalAmount, depositAmount, description } = calculatePaymentAmounts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 [INQUIRY] handleSubmit called!');
    console.log('🚀 [INQUIRY] needsPayment:', needsPayment);
    console.log('🚀 [INQUIRY] isAirbnb:', isAirbnb);
    console.log('🚀 [INQUIRY] property.propertyType:', property.propertyType);
    setIsSubmitting(true);

    try {
      // Allow guest submissions - they provide their contact info in the form
      const bookingData: any = {
        propertyId: property.id,
        type: isAirbnb ? 'booking' : 'inquiry',
        name: formData.name || `${user?.firstName} ${user?.lastName}`,
        email: formData.email || user?.email || '',
        phone: formData.phone || user?.phone || '',
        message: formData.message,
        currency: 'UGX',
      };

      // Add property-specific fields
      if (isAirbnb) {
        bookingData.checkInDate = formData.checkIn;
        bookingData.checkOutDate = formData.checkOut;
        bookingData.guests = formData.guests;
      } else if (isForRent || isForLease) {
        bookingData.moveInDate = formData.moveInDate;
        bookingData.leaseDuration = formData.leaseDuration;
        bookingData.occupants = formData.occupants;
      } else if (isForSale) {
        bookingData.scheduledDate = formData.viewingDate;
        bookingData.scheduledTime = formData.viewingTime;
        bookingData.offerAmount = formData.offerAmount ? parseFloat(formData.offerAmount) : undefined;
        bookingData.financingType = formData.financingType;
      } else if (isCommercial) {
        bookingData.businessType = formData.businessType;
        bookingData.spaceRequirements = formData.spaceRequirements;
        bookingData.leaseTerm = formData.leaseTerm;
      }

      // Add payment information if needed
      if (needsPayment && selectedPaymentMethod) {
        bookingData.paymentAmount = paymentOption === "full" ? totalAmount : depositAmount;
        bookingData.paymentMethod = selectedPaymentMethod;
      }

      console.log('[INQUIRY MODAL] Submitting booking data:', bookingData);
      const result = await propertyService.createBooking(bookingData);
      console.log('[INQUIRY MODAL] Booking created successfully:', result);

      setIsSubmitting(false);
      setStep(needsPayment ? 4 : 3); // Success step (4 if payment, 3 if no payment)
    } catch (error: any) {
      console.error("[INQUIRY MODAL] Error submitting inquiry:", error);
      console.error("[INQUIRY MODAL] Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      alert(error?.response?.data?.message || error?.message || "Failed to submit inquiry. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      name: "",
      email: "",
      phone: "",
      message: "",
      checkIn: "",
      checkOut: "",
      guests: 1,
      moveInDate: "",
      leaseDuration: "",
      occupants: 1,
      viewingDate: "",
      viewingTime: "",
      financingType: "cash",
      offerAmount: "",
      businessType: "",
      spaceRequirements: "",
      leaseTerm: "",
      paymentAmount: 0,
      depositAmount: 0,
    });
    setSelectedPaymentMethod("");
    setPaymentOption("full");
    onClose();
  };

  if (!isOpen) return null;

  // Get modal title based on context
  const getModalTitle = () => {
    if (isAirbnb) return "Book Your Stay";
    if (isForSale) return "Schedule Viewing";
    if (isCommercial && (isForRent || isForLease)) return "Request Commercial Space";
    if (isForRent) return "Apply for Rental";
    if (isForLease) return "Lease Inquiry";
    return "Property Inquiry";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">{getModalTitle()}</h2>
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
        {step < (needsPayment ? 4 : 3) && (
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2 mb-6">
              <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-blue-500" : "bg-gray-200"}`} />
              <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-blue-500" : "bg-gray-200"}`} />
              {needsPayment && <div className={`flex-1 h-2 rounded-full ${step >= 3 ? "bg-blue-500" : "bg-gray-200"}`} />}
            </div>
          </div>
        )}

        {/* Step 1: Property-specific details */}
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="p-6 space-y-6">
            {/* Airbnb/Short-term rental fields */}
            {isAirbnb && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.checkIn}
                      onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      required
                      min={formData.checkIn || new Date().toISOString().split('T')[0]}
                      value={formData.checkOut}
                      onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Number of Guests
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={property.features?.bedrooms ? property.features.bedrooms * 2 : 10}
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {formData.checkIn && formData.checkOut && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Estimated Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        UGX {calculateStayCost().toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {Math.ceil((new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Long-term rental fields */}
            {isForRent && !isAirbnb && !isCommercial && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Desired Move-in Date
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.moveInDate}
                      onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Lease Duration
                    </label>
                    <select
                      required
                      value={formData.leaseDuration}
                      onChange={(e) => setFormData({ ...formData, leaseDuration: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select duration</option>
                      <option value="6-months">6 Months</option>
                      <option value="1-year">1 Year</option>
                      <option value="2-years">2 Years</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Number of Occupants
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="20"
                    value={formData.occupants}
                    onChange={(e) => setFormData({ ...formData, occupants: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}

            {/* Sale property fields */}
            {isForSale && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Preferred Viewing Date
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
                    <select
                      required
                      value={formData.viewingTime}
                      onChange={(e) => setFormData({ ...formData, viewingTime: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select time</option>
                      <option value="morning">Morning (9AM - 12PM)</option>
                      <option value="afternoon">Afternoon (12PM - 4PM)</option>
                      <option value="evening">Evening (4PM - 6PM)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Financing Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, financingType: "cash" })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.financingType === "cash"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <p className="font-medium">Cash Purchase</p>
                      <p className="text-sm text-gray-600">Full payment</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, financingType: "mortgage" })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.financingType === "mortgage"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <p className="font-medium">Mortgage/Loan</p>
                      <p className="text-sm text-gray-600">Bank financing</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Offer Amount (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter your offer amount"
                    value={formData.offerAmount}
                    onChange={(e) => setFormData({ ...formData, offerAmount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}

            {/* Commercial lease fields */}
            {isCommercial && (isForRent || isForLease) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Home className="w-4 h-4 inline mr-2" />
                    Business Type
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Restaurant, Retail Store, Office"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Space Requirements
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your space needs (sq ft, special requirements, etc.)"
                    value={formData.spaceRequirements}
                    onChange={(e) => setFormData({ ...formData, spaceRequirements: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Lease Term
                  </label>
                  <select
                    required
                    value={formData.leaseTerm}
                    onChange={(e) => setFormData({ ...formData, leaseTerm: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select term</option>
                    <option value="1-year">1 Year</option>
                    <option value="2-years">2 Years</option>
                    <option value="3-years">3 Years</option>
                    <option value="5-years">5 Years</option>
                    <option value="negotiable">Negotiable</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Continue
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Contact information */}
        {step === 2 && (
          <form onSubmit={(e) => {
            console.log('🔥 [FORM SUBMIT] Step 2 form submitted!');
            console.log('🔥 [FORM SUBMIT] needsPayment:', needsPayment);
            console.log('🔥 [FORM SUBMIT] property.propertyType:', property.propertyType);
            console.log('🔥 [FORM SUBMIT] property.listingType:', property.listingType);
            if (needsPayment) {
              console.log('🔥 [FORM SUBMIT] Going to payment step (step 3)');
              e.preventDefault();
              setStep(3);
            } else {
              console.log('🔥 [FORM SUBMIT] Calling handleSubmit for inquiry...');
              handleSubmit(e);
            }
          }} className="p-6 space-y-6">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Additional Message (Optional)
              </label>
              <textarea
                rows={4}
                placeholder="Any questions or special requests?"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> The property owner will receive your inquiry and contact you within 24-48 hours.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                {needsPayment ? (
                  <>
                    Continue to Payment
                    <span className="ml-2">→</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Inquiry
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Payment (if needed) */}
        {needsPayment && step === 3 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Payment Details</h3>
              <p className="text-sm text-gray-700">{description}</p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="text-lg font-bold text-gray-900">
                    UGX {totalAmount.toLocaleString()}
                  </span>
                </div>
                {depositAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Deposit (30-50%):</span>
                    <span className="text-md font-semibold text-blue-600">
                      UGX {depositAmount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment option selector */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Option
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentOption("full")}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    paymentOption === "full"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Full Payment</span>
                    {paymentOption === "full" && <Check className="w-5 h-5 text-blue-600" />}
                  </div>
                  <p className="text-lg font-bold text-blue-600">
                    UGX {totalAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Pay in full now</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentOption("deposit")}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    paymentOption === "deposit"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Deposit</span>
                    {paymentOption === "deposit" && <Check className="w-5 h-5 text-blue-600" />}
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    UGX {depositAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pay {isAirbnb ? "30%" : "50%"} now
                  </p>
                </button>
              </div>
              {paymentOption === "deposit" && (
                <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <strong>Remaining:</strong> UGX {(totalAmount - depositAmount).toLocaleString()} {" "}
                  {isAirbnb ? "due before check-in" : "due before move-in"}
                </p>
              )}
            </div>

            {/* Payment method selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-2" />
                Payment Method
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                      selectedPaymentMethod === method.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 bg-white"
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-2xl", method.color, "text-white")}>
                      {method.icon}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-gray-900">{method.name}</p>
                      <p className="text-xs text-gray-500">Fast & Secure</p>
                    </div>
                    {selectedPaymentMethod === method.id && (
                      <Check className="w-6 h-6 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-600">
                🔒 Your payment is secure and encrypted. You will be redirected to complete the payment after confirmation.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={!selectedPaymentMethod || isSubmitting}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Confirm & Pay UGX {(paymentOption === "full" ? totalAmount : depositAmount).toLocaleString()}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step 4: Success message (or Step 3 if no payment) */}
        {((needsPayment && step === 4) || (!needsPayment && step === 3)) && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Inquiry Sent Successfully!</h3>
            <p className="text-gray-600 mb-6">
              {needsPayment 
                ? `Payment of UGX ${(paymentOption === "full" ? totalAmount : depositAmount).toLocaleString()} confirmed! The owner has been notified.`
                : "Thank you for your interest in this property. The owner has been notified and will contact you soon."
              }
            </p>
            {needsPayment && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-medium text-green-900 mb-2">
                  ✓ Payment Method: {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
                </p>
                <p className="text-sm text-green-800">
                  {paymentOption === "deposit" 
                    ? `Remaining balance: UGX ${(totalAmount - depositAmount).toLocaleString()} ${isAirbnb ? "due before check-in" : "due before move-in"}`
                    : "Full payment completed"
                  }
                </p>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-medium text-gray-900 mb-2">What happens next?</p>
              <ul className="text-sm text-gray-700 space-y-1">
                {needsPayment ? (
                  <>
                    <li>✓ Payment receipt sent to your email</li>
                    <li>✓ {isAirbnb ? "Booking confirmed - check your dashboard" : "Owner finalizes your application"}</li>
                    <li>✓ You'll receive confirmation within 24 hours</li>
                    {paymentOption === "deposit" && <li>✓ Remainder payment link will be sent closer to {isAirbnb ? "check-in" : "move-in"}</li>}
                  </>
                ) : (
                  <>
                    <li>✓ Owner reviews your inquiry</li>
                    <li>✓ You'll receive a response within 24-48 hours</li>
                    <li>✓ Check your email and phone for updates</li>
                  </>
                )}
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
                      Create a free account to message property owners directly, track your inquiries, and save your favorite properties.
                    </p>
                    <a
                      href={`/auth/register?email=${encodeURIComponent(formData.email)}&name=${encodeURIComponent(formData.name)}`}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Create Free Account
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )}

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
