"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { Card, Button, Textarea } from "@/components/ui";
import { propertyReviewsService } from "@/services/property-reviews.service";
import { useToastContext } from "@/components/ui/toast-provider";

interface PropertyReviewFormProps {
  propertyId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}

export function PropertyReviewForm({
  propertyId,
  onSubmitted,
  onCancel,
}: PropertyReviewFormProps) {
  const { success, error } = useToastContext();
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [cleanlinessRating, setCleanlinessRating] = useState<number | undefined>(undefined);
  const [locationRating, setLocationRating] = useState<number | undefined>(undefined);
  const [valueRating, setValueRating] = useState<number | undefined>(undefined);
  const [communicationRating, setCommunicationRating] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const renderStarInput = (
    value: number,
    onChange: (value: number) => void,
    label: string,
    currentValue?: number,
  ) => {
    const displayValue = currentValue || 0;
    
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  star <= (hoveredRating || displayValue)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
          {displayValue > 0 && (
            <span className="ml-2 text-sm text-slate-600">{displayValue}/5</span>
          )}
        </div>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating < 1 || rating > 5) {
      error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      await propertyReviewsService.createReview({
        propertyId,
        rating,
        comment: comment.trim() || undefined,
        cleanlinessRating,
        locationRating,
        valueRating,
        communicationRating,
      });
      
      success("Review submitted successfully!");
      onSubmitted();
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      error(err.response?.data?.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900">Write a Review</h3>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Overall Rating *
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
            <span className="ml-3 text-lg font-semibold text-slate-700">{rating}/5</span>
          </div>
        </div>

        {/* Category Ratings (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          {renderStarInput(
            cleanlinessRating || 0,
            setCleanlinessRating,
            "Cleanliness (Optional)",
            cleanlinessRating,
          )}
          {renderStarInput(
            locationRating || 0,
            setLocationRating,
            "Location (Optional)",
            locationRating,
          )}
          {renderStarInput(
            valueRating || 0,
            setValueRating,
            "Value for Money (Optional)",
            valueRating,
          )}
          {renderStarInput(
            communicationRating || 0,
            setCommunicationRating,
            "Communication (Optional)",
            communicationRating,
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Your Review (Optional)
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this property..."
            rows={5}
            className="resize-none"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
