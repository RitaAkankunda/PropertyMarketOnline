"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Check, DollarSign, Calendar, User, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui";
import { propertyService } from "@/services";
import { useAuthStore } from "@/store/auth.store";
import { cn, formatCurrency } from "@/lib/utils";
import type { Property } from "@/types";
import { format } from "date-fns";

interface BookingDates {
  checkIn: Date | null;
  checkOut: Date | null;
  nights: number;
  totalPrice: number;
}

interface PropertyPaymentModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  bookingDates?: BookingDates;
}

interface GuestDetails {
  name: string;
  email: string;
  phone: string;
}

export function PropertyPaymentModal({ property, isOpen, onClose, bookingDates }: PropertyPaymentModalProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(1); // 3 steps: guest info, payment, success
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [paymentOption, setPaymentOption] = useState<"full" | "deposit">("full");
  
  // Guest checkout details
  const [guestDetails, setGuestDetails] = useState<GuestDetails>({
    name: "",
    email: "",
    phone: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<GuestDetails>>({});

  // Pre-fill with user data if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setGuestDetails({
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [isAuthenticated, user]);

  // Payment methods
  const paymentMethods = [
    { id: "mtn", name: "MTN Mobile Money", icon: "📱", color: "bg-yellow-500" },
    { id: "airtel", name: "Airtel Money", icon: "💳", color: "bg-red-500" },
    { id: "visa", name: "Visa Card", icon: "💳", color: "bg-blue-600" },
    { id: "paypal", name: "PayPal", icon: "🌐", color: "bg-blue-500" },
  ];

  // Calculate payment amounts
  const isForSale = property.listingType === "sale";
  const isForRent = property.listingType === "rent";
  const isForLease = property.listingType === "lease";
  const isAirbnb = property.propertyType === "airbnb";
  const isHotel = property.propertyType === "hotel";
  const hasBookingDates = bookingDates?.checkIn && bookingDates?.checkOut;

  let totalAmount = 0;
  let depositAmount = 0;
  let description = "";

  if ((isAirbnb || isHotel) && hasBookingDates) {
    // Use the calculated price from calendar
    totalAmount = bookingDates.totalPrice;
    depositAmount = totalAmount * 0.3; // 30% deposit
    description = `${bookingDates.nights} night${bookingDates.nights !== 1 ? 's' : ''} accommodation`;
  } else if (isAirbnb || isHotel) {
    // Fallback if no dates selected
    totalAmount = property.price;
    depositAmount = totalAmount * 0.3;
    description = "Accommodation booking";
  } else if (isForRent || isForLease) {
    totalAmount = property.price; // First month rent
    depositAmount = property.price * 0.5; // 50% deposit
    description = isForRent ? "First month rent + security deposit" : "Lease security deposit";
  } else if (isForSale) {
    // For sales, earnest money (1% of property price)
    totalAmount = property.price * 0.01;
    depositAmount = totalAmount * 0.5;
    description = "Earnest money deposit";
  }

  // Validate guest details
  const validateGuestDetails = (): boolean => {
    const errors: Partial<GuestDetails> = {};
    
    if (!guestDetails.name.trim()) {
      errors.name = "Full name is required";
    }
    
    if (!guestDetails.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestDetails.email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!guestDetails.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (guestDetails.phone.replace(/\D/g, "").length < 9) {
      errors.phone = "Please enter a valid phone number";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate guest details first
    if (!validateGuestDetails()) {
      return;
    }
    
    if (!selectedPaymentMethod) {
      alert("Please select a payment method");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create booking with payment information (works for both guests and logged-in users)
      const bookingData: any = {
        propertyId: property.id,
        type: (isAirbnb || isHotel) ? 'booking' : isForSale ? 'inquiry' : 'booking',
        name: guestDetails.name,
        email: guestDetails.email,
        phone: guestDetails.phone,
        paymentAmount: paymentOption === "full" ? totalAmount : depositAmount,
        paymentMethod: selectedPaymentMethod,
        currency: property.currency || 'UGX',
      };

      // Add check-in/check-out dates for airbnb/hotel bookings
      if ((isAirbnb || isHotel) && hasBookingDates && bookingDates.checkIn && bookingDates.checkOut) {
        bookingData.checkInDate = format(bookingDates.checkIn, 'yyyy-MM-dd');
        bookingData.checkOutDate = format(bookingDates.checkOut, 'yyyy-MM-dd');
        bookingData.guests = 1; // Default to 1, could be made configurable
      }

      await propertyService.createBooking(bookingData);

      // TODO: Process actual payment through payment gateway
      // For now, we'll just create the booking with payment info
      // In production, you'd integrate with MTN MoMo, Airtel Money, or Stripe

      setStep(2); // Success step
    } catch (error: any) {
      console.error("Error processing payment:", error);
      alert(error?.response?.data?.message || "Failed to process payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedPaymentMethod("");
    setPaymentOption("full");
    setFormErrors({});
    // Reset guest details only if not logged in
    if (!isAuthenticated) {
      setGuestDetails({ name: "", email: "", phone: "" });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Complete Payment</h2>
              <p className="text-green-100 text-sm">{property.title}</p>
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
              <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-green-500" : "bg-gray-200"}`} />
              <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-green-500" : "bg-gray-200"}`} />
            </div>
          </div>
        )}

        {/* Step 1: Payment Details */}
        {step === 1 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Payment Summary */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>
              
              {/* Show booking dates for airbnb/hotel */}
              {(isAirbnb || isHotel) && hasBookingDates && bookingDates.checkIn && bookingDates.checkOut && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Calendar className="w-3 h-3" />
                      CHECK-IN
                    </div>
                    <div className="font-semibold text-gray-900">
                      {format(bookingDates.checkIn, "EEE, MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Calendar className="w-3 h-3" />
                      CHECK-OUT
                    </div>
                    <div className="font-semibold text-gray-900">
                      {format(bookingDates.checkOut, "EEE, MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-700 mb-4">{description}</p>
              
              <div className="space-y-2 mb-4 pb-4 border-b border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(totalAmount, property.currency || 'UGX')}
                  </span>
                </div>
                {depositAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Available as deposit:</span>
                    <span className="text-md font-semibold text-green-600">
                      {formatCurrency(depositAmount, property.currency || 'UGX')}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-600">
                <strong>Property:</strong> {property.title}<br />
                <strong>Location:</strong> {property.location?.address || "N/A"}
              </div>
            </div>

            {/* Guest Details Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  <User className="w-4 h-4 inline mr-2" />
                  Your Details
                </label>
                {isAuthenticated && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    Logged in as {user?.email}
                  </span>
                )}
              </div>
              
              {!isAuthenticated && (
                <p className="text-xs text-gray-500 -mt-2">
                  No account needed! Just enter your details below.
                </p>
              )}

              <div className="grid grid-cols-1 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={guestDetails.name}
                      onChange={(e) => {
                        setGuestDetails({ ...guestDetails, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
                      }}
                      placeholder="John Doe"
                      className={cn(
                        "w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500",
                        formErrors.name ? "border-red-300 bg-red-50" : "border-gray-200"
                      )}
                    />
                  </div>
                  {formErrors.name && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={guestDetails.email}
                      onChange={(e) => {
                        setGuestDetails({ ...guestDetails, email: e.target.value });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
                      }}
                      placeholder="john@example.com"
                      className={cn(
                        "w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500",
                        formErrors.email ? "border-red-300 bg-red-50" : "border-gray-200"
                      )}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Confirmation will be sent here</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={guestDetails.phone}
                      onChange={(e) => {
                        setGuestDetails({ ...guestDetails, phone: e.target.value });
                        if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
                      }}
                      placeholder="+256 700 000 000"
                      className={cn(
                        "w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500",
                        formErrors.phone ? "border-red-300 bg-red-50" : "border-gray-200"
                      )}
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Option Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Payment Option
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentOption("full")}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    paymentOption === "full"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-300 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Full Payment</span>
                    {paymentOption === "full" && <Check className="w-5 h-5 text-green-600" />}
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(totalAmount, property.currency || 'UGX')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Pay in full now</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentOption("deposit")}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    paymentOption === "deposit"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-300 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Deposit Only</span>
                    {paymentOption === "deposit" && <Check className="w-5 h-5 text-green-600" />}
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(depositAmount, property.currency || 'UGX')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(isAirbnb || isHotel) ? "30% now" : "50% now"}
                  </p>
                </button>
              </div>

              {paymentOption === "deposit" && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <strong>Remaining:</strong> {formatCurrency(totalAmount - depositAmount, property.currency || 'UGX')} {" "}
                  {(isAirbnb || isHotel) ? "due before check-in" : isForRent ? "due before move-in" : "due at closing"}
                </div>
              )}
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-2" />
                Select Payment Method
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
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-green-300 bg-white"
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-2xl", method.color, "text-white")}>
                      {method.icon}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-gray-900">{method.name}</p>
                      <p className="text-xs text-gray-500">Secure & Fast</p>
                    </div>
                    {selectedPaymentMethod === method.id && (
                      <Check className="w-6 h-6 text-green-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-600">
                🔒 Your payment is secure and encrypted. You will be redirected to complete the payment gateway after confirmation.
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
                    Pay {formatCurrency(paymentOption === "full" ? totalAmount : depositAmount, property.currency || 'UGX')}
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-600 mb-6">
              Your payment of {formatCurrency(paymentOption === "full" ? totalAmount : depositAmount, property.currency || 'UGX')} has been processed successfully.
            </p>

            {/* Show booking dates in success */}
            {(isAirbnb || isHotel) && hasBookingDates && bookingDates?.checkIn && bookingDates?.checkOut && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-left">
                <p className="text-sm font-medium text-blue-900 mb-2">Your Stay:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Check-in:</span>
                    <div className="font-semibold">{format(bookingDates.checkIn, "EEE, MMM d, yyyy")}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Check-out:</span>
                    <div className="font-semibold">{format(bookingDates.checkOut, "EEE, MMM d, yyyy")}</div>
                  </div>
                </div>
                <p className="text-sm text-blue-800 mt-2">{bookingDates.nights} night{bookingDates.nights !== 1 ? 's' : ''}</p>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-green-900 mb-2">
                ✓ Payment Method: {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
              </p>
              {paymentOption === "deposit" && (
                <p className="text-sm text-green-800">
                  Remaining balance: {formatCurrency(totalAmount - depositAmount, property.currency || 'UGX')} {(isAirbnb || isHotel) ? "due before check-in" : isForRent ? "due before move-in" : "due at closing"}
                </p>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-medium text-gray-900 mb-2">What happens next:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✓ Confirmation email sent to <strong>{guestDetails.email}</strong></li>
                <li>✓ Property owner has been notified</li>
                <li>✓ Booking reference: #{Math.random().toString(36).substring(7).toUpperCase()}</li>
                <li>✓ Guest: {guestDetails.name} ({guestDetails.phone})</li>
                {paymentOption === "deposit" && (
                  <li>✓ Balance payment reminder will be sent {(isAirbnb || isHotel) ? "before check-in" : isForRent ? "before move-in" : "at closing"}</li>
                )}
              </ul>
            </div>

            <Button
              onClick={handleClose}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
