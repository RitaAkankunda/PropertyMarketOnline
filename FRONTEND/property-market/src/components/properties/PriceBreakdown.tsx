"use client";

import { Card } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { Calculator, Info } from "lucide-react";
import type { Property } from "@/types";

interface PriceBreakdownProps {
  property: Property;
  className?: string;
}

interface BreakdownItem {
  label: string;
  amount: number;
  description?: string;
}

export function PriceBreakdown({ property, className = "" }: PriceBreakdownProps) {
  // Calculate breakdown from property data
  const getBreakdown = (): BreakdownItem[] => {
    const items: BreakdownItem[] = [];
    const currency = property.currency || "UGX";

    // Base price (use basePrice if available, otherwise use main price)
    const basePrice = (property as any).basePrice ?? property.price;
    items.push({
      label: "Base Price",
      amount: basePrice,
      description: "Base property price",
    });

    // Service fee
    const serviceFee = (property as any).serviceFee || 0;
    if (serviceFee > 0) {
      items.push({
        label: "Service Fee",
        amount: serviceFee,
        description: "Platform service fee",
      });
    }

    // Tax
    const tax = (property as any).tax || 0;
    if (tax > 0) {
      items.push({
        label: "Tax",
        amount: tax,
        description: "Applicable taxes",
      });
    }

    // Other fees (cleaning fee, security deposit, etc.)
    const cleaningFee = (property as any).cleaningFee || 0;
    const securityDeposit = (property as any).securityDeposit || 0;
    const serviceCharge = (property as any).serviceCharge || 0;
    const otherFees = (property as any).otherFees || 0;

    if (cleaningFee > 0) {
      items.push({
        label: "Cleaning Fee",
        amount: cleaningFee,
        description: "One-time cleaning fee",
      });
    }

    if (securityDeposit > 0) {
      items.push({
        label: "Security Deposit",
        amount: securityDeposit,
        description: "Refundable security deposit",
      });
    }

    if (serviceCharge > 0) {
      items.push({
        label: "Service Charge",
        amount: serviceCharge,
        description: "Monthly service charge",
      });
    }

    if (otherFees > 0) {
      items.push({
        label: "Other Fees",
        amount: otherFees,
        description: "Additional fees",
      });
    }

    // Try to parse priceBreakdown JSON if available
    if ((property as any).priceBreakdown) {
      try {
        const breakdown = JSON.parse((property as any).priceBreakdown);
        if (Array.isArray(breakdown)) {
          breakdown.forEach((item: any) => {
            if (item.label && item.amount) {
              items.push({
                label: item.label,
                amount: item.amount,
                description: item.description,
              });
            }
          });
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    return items;
  };

  const breakdown = getBreakdown();
  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
  
  // Calculate if there's a meaningful breakdown (more than just base price)
  const hasBreakdown = breakdown.length > 1 || 
    (breakdown.length === 1 && breakdown[0].amount !== property.price);

  // Don't show if there's only base price matching the main price (no breakdown needed)
  if (!hasBreakdown) {
    return null;
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-slate-900">Price Breakdown</h3>
      </div>

      <div className="space-y-3 mb-4">
        {breakdown.map((item, index) => (
          <div key={index} className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-700 font-medium">{item.label}</span>
                {item.description && (
                  <div className="group relative">
                    <Info className="w-4 h-4 text-slate-400 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {item.description}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <span className="text-slate-900 font-medium">
              {formatCurrency(item.amount, property.currency || "UGX")}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t-2 border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">Total</span>
          <span className="text-xl font-bold text-blue-600">
            {formatCurrency(total, property.currency || "UGX")}
          </span>
        </div>
      </div>

      {property.negotiable && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Note:</span> Price is negotiable. Contact the owner to discuss.
          </p>
        </div>
      )}
    </Card>
  );
}
