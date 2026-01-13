"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, CheckCircle, User, Calendar } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { propertyReviewsService, type PropertyReview, type ReviewStatistics } from "@/services/property-reviews.service";
import { useAuthStore } from "@/store";
import { PropertyReviewForm } from "./PropertyReviewForm";
import { formatDistanceToNow } from "date-fns";

interface PropertyReviewsProps {
  propertyId: string;
  propertyOwnerId?: string;
}

export function PropertyReviews({ propertyId, propertyOwnerId }: PropertyReviewsProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [reviews, setReviews] = useState<PropertyReview[]>([]);
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [propertyId, page]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const response = await propertyReviewsService.getPropertyReviews(propertyId, page, 10);
      setReviews(response.data);
      setStatistics(response.statistics || null);
      setTotalPages(response.meta.totalPages);
      
      // Check if current user has reviewed
      if (isAuthenticated && user) {
        const userReview = response.data.find(r => r.reviewerId === user.id);
        setHasReviewed(!!userReview);
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    loadReviews();
  };

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };
    
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading reviews...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Section */}
      {statistics && (
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Rating */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="text-4xl font-bold text-slate-900">
                  {statistics.averageRating.toFixed(1)}
                </span>
                <div className="flex flex-col">
                  {renderStars(statistics.averageRating, "lg")}
                  <span className="text-sm text-slate-600 mt-1">
                    {statistics.totalReviews} {statistics.totalReviews === 1 ? "review" : "reviews"}
                  </span>
                </div>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="md:col-span-2">
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = statistics.ratingBreakdown[rating as keyof typeof statistics.ratingBreakdown];
                  const percentage = statistics.totalReviews > 0 
                    ? (count / statistics.totalReviews) * 100 
                    : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 w-8">{rating}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 w-12 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Category Averages */}
          {statistics.categoryAverages && (
            <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(statistics.categoryAverages).map(([category, rating]) => (
                <div key={category} className="text-center">
                  <p className="text-xs text-slate-500 mb-1 capitalize">{category}</p>
                  <div className="flex items-center justify-center gap-1">
                    {renderStars(rating, "sm")}
                    <span className="text-sm font-medium text-slate-700">
                      {rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Write Review Button */}
      {isAuthenticated && !hasReviewed && (
        <div className="flex justify-end">
          <Button onClick={() => setShowReviewForm(true)}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Write a Review
          </Button>
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <PropertyReviewForm
          propertyId={propertyId}
          onSubmitted={handleReviewSubmitted}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No reviews yet</p>
            <p className="text-sm text-gray-400">
              Be the first to review this property!
            </p>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Reviewer Avatar */}
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    {review.reviewer?.avatar ? (
                      <img
                        src={review.reviewer.avatar}
                        alt={review.reviewer.firstName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-blue-600" />
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-slate-900">
                        {review.reviewer?.firstName} {review.reviewer?.lastName}
                      </h4>
                      {review.isVerified && (
                        <CheckCircle className="w-4 h-4 text-blue-600" title="Verified booking" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-slate-600">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    {review.comment && (
                      <p className="text-slate-700 mb-3">{review.comment}</p>
                    )}

                    {/* Category Ratings */}
                    {(review.cleanlinessRating || review.locationRating || review.valueRating || review.communicationRating) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t">
                        {review.cleanlinessRating && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Cleanliness</p>
                            {renderStars(review.cleanlinessRating, "sm")}
                          </div>
                        )}
                        {review.locationRating && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Location</p>
                            {renderStars(review.locationRating, "sm")}
                          </div>
                        )}
                        {review.valueRating && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Value</p>
                            {renderStars(review.valueRating, "sm")}
                          </div>
                        )}
                        {review.communicationRating && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Communication</p>
                            {renderStars(review.communicationRating, "sm")}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Owner Response */}
                    {review.ownerResponse && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-blue-900">Property Owner</span>
                          <span className="text-xs text-blue-600">
                            {review.respondedAt && formatDistanceToNow(new Date(review.respondedAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-blue-800 text-sm">{review.ownerResponse}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
