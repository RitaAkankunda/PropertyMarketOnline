"use client";

import { useState } from "react";
import { X, CreditCard, Check, DollarSign } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Property } from "@/types";

interface PropertyPaymentModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyPaymentModal({ property, isOpen, onClose }: PropertyPaymentModalProps) {
  const [step, setStep] = useState(1); // 2 steps: payment, success
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [paymentOption, setPaymentOption] = useState<"full" | "deposit">("full");

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

  let totalAmount = 0;
  let depositAmount = 0;
  let description = "";

  if (isAirbnb) {
    // For Airbnb, use property.price as base (would be calculated from dates in real scenario)
    totalAmount = property.price;
    depositAmount = totalAmount * 0.3; // 30% deposit
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call to process payment
    await new Promise(resolve => setTimeout(resolve, 2500));

    console.log("Payment processed:", {
      propertyId: property.id,
      propertyType: property.propertyType,
      listingType: property.listingType,
      paymentMethod: selectedPaymentMethod,
      paymentOption,
      amount: paymentOption === "full" ? totalAmount : depositAmount,
    });

    setIsSubmitting(false);
    setStep(2); // Success step
  };

  const handleClose = () => {
    setStep(1);
    setSelectedPaymentMethod("");
    setPaymentOption("full");
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
              <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
              <p className="text-sm text-gray-700 mb-4">{description}</p>
              
              <div className="space-y-2 mb-4 pb-4 border-b border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    UGX {totalAmount.toLocaleString()}
                  </span>
                </div>
                {depositAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Available as deposit:</span>
                    <span className="text-md font-semibold text-green-600">
                      UGX {depositAmount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-600">
                <strong>Property:</strong> {property.title}<br />
                <strong>Location:</strong> {property.location?.address || "N/A"}
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
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-300 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">Deposit Only</span>
                    {paymentOption === "deposit" && <Check className="w-5 h-5 text-green-600" />}
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    UGX {depositAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {isAirbnb ? "30% now" : "50% now"}
                  </p>
                </button>
              </div>

              {paymentOption === "deposit" && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <strong>Remaining:</strong> UGX {(totalAmount - depositAmount).toLocaleString()} {" "}
                  {isAirbnb ? "due before check-in" : isForRent ? "due before move-in" : "due at closing"}
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
                    Pay UGX {(paymentOption === "full" ? totalAmount : depositAmount).toLocaleString()}
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
            <p className="text-gray-600 mb-6">
              Your payment of UGX {(paymentOption === "full" ? totalAmount : depositAmount).toLocaleString()} has been processed successfully.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-green-900 mb-2">
                ✓ Payment Method: {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
              </p>
              {paymentOption === "deposit" && (
                <p className="text-sm text-green-800">
                  Remaining balance: UGX {(totalAmount - depositAmount).toLocaleString()} {isAirbnb ? "due before check-in" : isForRent ? "due before move-in" : "due at closing"}
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-medium text-gray-900 mb-2">What happens next:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✓ Payment receipt sent to your email</li>
                <li>✓ Property owner has been notified</li>
                <li>✓ Transaction reference: #{Math.random().toString(36).substring(7).toUpperCase()}</li>
                {paymentOption === "deposit" && (
                  <li>✓ Balance payment link will be sent {isAirbnb ? "before check-in" : isForRent ? "before move-in" : "at closing"}</li>
                )}
              </ul>
            </div>

            <Button
              onClick={handleClose}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Close & Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
