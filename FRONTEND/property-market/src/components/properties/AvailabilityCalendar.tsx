"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  differenceInDays,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Lock, CalendarCheck, Calendar, CreditCard } from "lucide-react";
import { availabilityService, type AvailabilityBlock, type BookedRange } from "@/services/availability.service";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface AvailabilityCalendarProps {
  propertyId: string;
  isOwner?: boolean;
  pricePerNight?: number;
  cleaningFee?: number;
  serviceFee?: number;
  currency?: string;
  onBookingRequest?: (checkIn: Date, checkOut: Date, nights: number, totalPrice: number) => void;
}

type DayStatus = "available" | "blocked" | "booked" | "selected" | "selected-range";

export function AvailabilityCalendar({ 
  propertyId, 
  isOwner = false,
  pricePerNight = 0,
  cleaningFee = 0,
  serviceFee = 0,
  currency = "UGX",
  onBookingRequest,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [blocked, setBlocked] = useState<AvailabilityBlock[]>([]);
  const [booked, setBooked] = useState<BookedRange[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
  const [reason, setReason] = useState("");
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const monthRange = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return { monthStart, monthEnd };
  }, [currentMonth]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const from = format(monthRange.monthStart, "yyyy-MM-dd");
      const to = format(monthRange.monthEnd, "yyyy-MM-dd");
      const response = await availabilityService.getAvailability(propertyId, from, to);
      setBlocked(response.blocked);
      setBooked(response.booked);
    } catch (error) {
      console.error("[AVAILABILITY] Failed to load availability:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [propertyId, monthRange.monthStart, monthRange.monthEnd]);

  const days = useMemo(() => {
    const start = startOfWeek(monthRange.monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthRange.monthEnd, { weekStartsOn: 1 });
    const result: Date[] = [];
    let day = start;
    while (day <= end) {
      result.push(day);
      day = addDays(day, 1);
    }
    return result;
  }, [monthRange]);

  const isDateInRange = (date: Date, start: string, end: string) => {
    const d = format(date, "yyyy-MM-dd");
    return d >= start && d <= end;
  };

  const isDateUnavailable = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    for (const block of blocked) {
      if (dateStr >= block.startDate && dateStr <= block.endDate) {
        return true;
      }
    }
    for (const booking of booked) {
      if (dateStr >= booking.startDate && dateStr <= booking.endDate) {
        return true;
      }
    }
    return false;
  };

  const hasUnavailableDatesInRange = (start: Date, end: Date): boolean => {
    let current = start;
    while (current <= end) {
      if (isDateUnavailable(current)) {
        return true;
      }
      current = addDays(current, 1);
    }
    return false;
  };

  const getDayStatus = (date: Date): DayStatus => {
    // Check if date is in selected range
    if (selectionStart && selectionEnd) {
      const start = format(selectionStart, "yyyy-MM-dd");
      const end = format(selectionEnd, "yyyy-MM-dd");
      if (isDateInRange(date, start, end)) {
        if (isSameDay(date, selectionStart) || isSameDay(date, selectionEnd)) {
          return "selected";
        }
        return "selected-range";
      }
    } else if (selectionStart && isSameDay(date, selectionStart)) {
      return "selected";
    }

    // Check if date is in hover preview range (for guests)
    if (!isOwner && selectionStart && !selectionEnd && hoverDate && isAfter(hoverDate, selectionStart)) {
      const start = format(selectionStart, "yyyy-MM-dd");
      const end = format(hoverDate, "yyyy-MM-dd");
      if (isDateInRange(date, start, end) && !isDateUnavailable(date)) {
        return "selected-range";
      }
    }

    for (const block of blocked) {
      if (isDateInRange(date, block.startDate, block.endDate)) {
        return "blocked";
      }
    }
    for (const booking of booked) {
      if (isDateInRange(date, booking.startDate, booking.endDate)) {
        return "booked";
      }
    }
    return "available";
  };

  const handleDayClick = (date: Date) => {
    if (!isSameMonth(date, monthRange.monthStart)) return;
    
    const isPastDate = isBefore(date, new Date()) && !isSameDay(date, new Date());
    if (isPastDate) return;
    
    // Check if date is unavailable
    if (isDateUnavailable(date)) return;

    // Owner blocking flow
    if (isOwner) {
      if (!selectionStart || (selectionStart && selectionEnd)) {
        setSelectionStart(date);
        setSelectionEnd(null);
        return;
      }

      if (isBefore(date, selectionStart)) {
        setSelectionStart(date);
        setSelectionEnd(null);
        return;
      }

      setSelectionEnd(date);
      return;
    }

    // Guest booking flow
    if (!selectionStart || (selectionStart && selectionEnd)) {
      // Starting new selection
      setSelectionStart(date);
      setSelectionEnd(null);
      return;
    }

    // Completing selection - clicked date must be AFTER check-in (at least 1 night)
    if (isBefore(date, selectionStart) || isSameDay(date, selectionStart)) {
      // Clicked same day or before start - reset to this date as new check-in
      setSelectionStart(date);
      setSelectionEnd(null);
      return;
    }

    // Check if range contains unavailable dates
    if (hasUnavailableDatesInRange(selectionStart, date)) {
      // Reset and start from clicked date
      setSelectionStart(date);
      setSelectionEnd(null);
      return;
    }

    // Valid checkout date selected (at least 1 night after check-in)
    setSelectionEnd(date);
  };

  const handleDayHover = (date: Date) => {
    if (!isOwner && selectionStart && !selectionEnd) {
      setHoverDate(date);
    }
  };

  const selectedNights = selectionStart && selectionEnd 
    ? differenceInDays(selectionEnd, selectionStart) 
    : 0;

  // Price calculations like Airbnb
  const accommodationCost = selectedNights * pricePerNight;
  const calculatedServiceFee = serviceFee > 0 ? serviceFee : Math.round(accommodationCost * 0.12); // 12% service fee if not specified
  const totalPrice = accommodationCost + cleaningFee + calculatedServiceFee;

  const handleBooking = () => {
    if (selectionStart && selectionEnd && onBookingRequest) {
      onBookingRequest(selectionStart, selectionEnd, selectedNights, totalPrice);
    }
  };

  const clearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setReason("");
  };

  const blockSelected = async () => {
    if (!selectionStart) return;
    const start = selectionStart;
    const end = selectionEnd || selectionStart;
    try {
      await availabilityService.blockDates(propertyId, {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
        reason: reason.trim() || undefined,
      });
      clearSelection();
      await fetchAvailability();
    } catch (error) {
      console.error("[AVAILABILITY] Failed to block dates:", error);
    }
  };

  const removeBlock = async (blockId: string) => {
    try {
      await availabilityService.unblockDates(propertyId, blockId);
      await fetchAvailability();
    } catch (error) {
      console.error("[AVAILABILITY] Failed to remove block:", error);
    }
  };

  const previousMonth = () => setCurrentMonth(addDays(monthRange.monthStart, -1));
  const nextMonth = () => setCurrentMonth(addDays(monthRange.monthEnd, 1));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Availability Calendar</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-slate-700">
            {format(monthRange.monthStart, "MMMM yyyy")}
          </span>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-1 font-medium">
            {d}
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-slate-500">Loading availability...</span>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const status = getDayStatus(day);
            const isCurrentMonth = isSameMonth(day, monthRange.monthStart);
            const isPastDate = isBefore(day, new Date()) && !isSameDay(day, new Date());
            const isUnavailable = status === "blocked" || status === "booked";
            const isSelectable = isCurrentMonth && !isPastDate && !isUnavailable;
            
            // Enhanced styling for better visibility
            const baseClasses = "h-10 rounded-md text-sm font-medium transition-all relative";
            const statusClasses = {
              available: isPastDate 
                ? "bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed" 
                : "bg-white hover:bg-green-50 text-slate-900 border border-slate-200 hover:border-green-400 cursor-pointer",
              blocked: "bg-red-100 text-red-800 border-2 border-red-400 line-through cursor-not-allowed",
              booked: "bg-blue-200 text-blue-900 border-2 border-blue-500 font-semibold cursor-not-allowed",
              selected: "bg-green-500 text-white border-2 border-green-600 font-semibold",
              "selected-range": "bg-green-100 text-green-800 border border-green-300",
            }[status];
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => handleDayHover(day)}
                onMouseLeave={() => setHoverDate(null)}
                disabled={!isCurrentMonth || (isPastDate && status === "available")}
                className={`${baseClasses} ${statusClasses} ${
                  !isCurrentMonth ? "opacity-30" : ""
                }`}
                title={
                  status === "booked" ? "Already booked" : 
                  status === "blocked" ? "Not available" : 
                  status === "available" ? (
                    isPastDate ? "Past date" : 
                    !isOwner && selectionStart && !selectionEnd && isSameDay(day, selectionStart) ? "This is your check-in date. Select a later date for check-out." :
                    !isOwner && selectionStart && !selectionEnd ? "Click to select as check-out" :
                    "Click to select"
                  ) : 
                  status === "selected" ? (
                    selectionStart && isSameDay(day, selectionStart) ? "Check-in date" : "Check-out date"
                  ) :
                  "Selected range"
                }
              >
                {format(day, "d")}
                {status === "booked" && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
                )}
                {status === "blocked" && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-slate-700 pt-2 border-t">
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-white border border-slate-200" />
          Available
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-blue-200 border-2 border-blue-500" />
          <span className="font-medium text-blue-800">Booked</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-red-100 border-2 border-red-400" />
          <span className="font-medium text-red-700">Unavailable</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-green-500 border-2 border-green-600" />
          <span className="font-medium text-green-700">Your Selection</span>
        </span>
      </div>

      {/* Guest Booking Panel */}
      {!isOwner && (
        <div className="space-y-3 rounded-lg border-2 border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
            <Calendar className="w-4 h-4" />
            Select Your Dates
          </div>
          
          {!selectionStart && (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                <strong>Step 1:</strong> Click on an available date to select your <strong>check-in</strong> date
              </p>
              <p className="text-xs text-slate-500">
                Minimum stay: 1 night
              </p>
            </div>
          )}
          
          {selectionStart && !selectionEnd && (
            <div className="space-y-2">
              <div className="bg-white rounded-lg p-3 border border-green-300">
                <div className="text-xs text-slate-500 uppercase">Check-in Selected</div>
                <div className="font-semibold text-green-700">{format(selectionStart, "EEE, MMM d, yyyy")}</div>
              </div>
              <p className="text-sm text-slate-600">
                <strong>Step 2:</strong> Now click on a <strong>later date</strong> to select your check-out
              </p>
              <p className="text-xs text-slate-500">
                Check-out must be at least 1 day after check-in
              </p>
            </div>
          )}
          
          {selectionStart && selectionEnd && (
            <div className="space-y-3">
              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="text-xs text-slate-500 uppercase">Check-in</div>
                  <div className="font-semibold text-green-800">
                    {format(selectionStart, "EEE, MMM d")}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="text-xs text-slate-500 uppercase">Check-out</div>
                  <div className="font-semibold text-green-800">
                    {format(selectionEnd, "EEE, MMM d")}
                  </div>
                </div>
              </div>
              
              {/* Price Breakdown - Like Airbnb */}
              {pricePerNight > 0 && (
                <div className="bg-white rounded-lg p-4 border border-green-200 space-y-2">
                  <div className="text-sm font-semibold text-slate-800 border-b pb-2">
                    Price Details
                  </div>
                  
                  {/* Nightly rate */}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 underline decoration-dotted cursor-help" title="Base accommodation cost">
                      {formatCurrency(pricePerNight, currency)} × {selectedNights} night{selectedNights !== 1 ? "s" : ""}
                    </span>
                    <span className="text-slate-800">
                      {formatCurrency(accommodationCost, currency)}
                    </span>
                  </div>
                  
                  {/* Cleaning fee */}
                  {cleaningFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Cleaning fee</span>
                      <span className="text-slate-800">{formatCurrency(cleaningFee, currency)}</span>
                    </div>
                  )}
                  
                  {/* Service fee */}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 underline decoration-dotted cursor-help" title="Platform service fee">
                      Service fee
                    </span>
                    <span className="text-slate-800">{formatCurrency(calculatedServiceFee, currency)}</span>
                  </div>
                  
                  {/* Total */}
                  <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                    <span className="text-slate-900">Total</span>
                    <span className="text-lg text-green-700">{formatCurrency(totalPrice, currency)}</span>
                  </div>
                </div>
              )}

              {/* No price set message */}
              {pricePerNight <= 0 && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-sm text-amber-800">
                  Price not available. Contact the host for pricing.
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3"
                  onClick={handleBooking}
                  disabled={!onBookingRequest || pricePerNight <= 0}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Reserve
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearSelection}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  Clear
                </Button>
              </div>
              
              <p className="text-xs text-center text-slate-500">
                You won't be charged yet
              </p>
            </div>
          )}
        </div>
      )}

      {isOwner && (
        <div className="space-y-3 rounded-lg border bg-slate-50 p-3">
          <div className="text-sm font-medium text-slate-800">
            Block unavailable dates
          </div>
          <div className="text-xs text-slate-600">
            {selectionStart
              ? `Selected: ${format(selectionStart, "MMM d")} ${
                  selectionEnd ? `→ ${format(selectionEnd, "MMM d")}` : ""
                }`
              : "Select a start date, then an end date"}
          </div>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={blockSelected} disabled={!selectionStart || loading}>
              <Lock className="w-4 h-4 mr-1" />
              Block dates
            </Button>
            <Button size="sm" variant="outline" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Owner view: Blocked dates with remove option */}
      {isOwner && blocked.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-800">Blocked dates</div>
          <div className="space-y-2">
            {blocked.map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 text-red-800">
                  <Lock className="w-4 h-4 text-red-500" />
                  <span className="font-medium">
                    {block.startDate} → {block.endDate}
                  </span>
                  {block.reason && (
                    <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">
                      {block.reason}
                    </span>
                  )}
                </div>
                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-800 hover:bg-red-100" onClick={() => removeBlock(block.id)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guest view: Show unavailable dates info */}
      {!isOwner && (blocked.length > 0 || booked.length > 0) && (
        <div className="space-y-3 rounded-lg border bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-800">Availability Summary</div>
          
          {booked.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-blue-700 flex items-center gap-1">
                <CalendarCheck className="w-3 h-3" />
                Booked dates ({booked.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {booked.map((booking, idx) => (
                  <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200">
                    {booking.startDate} → {booking.endDate}
                  </span>
                ))}
              </div>
            </div>
          )}

          {blocked.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-red-700 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Unavailable dates ({blocked.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {blocked.map((block) => (
                  <span key={block.id} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded border border-red-200">
                    {block.startDate} → {block.endDate}
                    {block.reason && <span className="ml-1 opacity-75">({block.reason})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {blocked.length === 0 && booked.length === 0 && (
            <p className="text-sm text-green-700">All dates are currently available!</p>
          )}
        </div>
      )}
    </div>
  );
}
