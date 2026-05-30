import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar, MapPin, Users } from 'lucide-react';
import { useVendorReviews } from '@/hooks/useVendorReviews';
import { format } from 'date-fns';
import { parseLocalDate } from '@/utils/dateHelpers';
import { Skeleton } from '@/components/ui/skeleton';
import { formatEventType } from '@/utils/notificationHelpers';

interface VendorReviewHistoryProps {
  vendorId: string;
}

export function VendorReviewHistory({ vendorId }: VendorReviewHistoryProps) {
  const { data: reviews, isLoading } = useVendorReviews(vendorId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No reviews yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review History</CardTitle>
        <CardDescription>{reviews.length} total reviews</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.map((review: any) => {
          const event = review.assignment?.event;
          const reviewer = review.reviewer;
          
          return (
            <div key={review.id} className="border rounded-lg p-4 space-y-3">
              {/* Event Details */}
              {event && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{event.couple_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{format(parseLocalDate(event.event_date), 'MMM d, yyyy')}</span>
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{event.venue}</span>
                    </div>
                  )}
                  <Badge variant="secondary">{formatEventType(event.event_type)}</Badge>
                </div>
              )}

              {/* Rating */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold">{review.rating}.0</span>
                </div>
                {review.would_hire_again ? (
                  <Badge className="bg-green-500">Would Rehire</Badge>
                ) : (
                  <Badge variant="destructive">Would Not Rehire</Badge>
                )}
              </div>

              {/* Category Ratings */}
              {(review.professionalism_rating || review.punctuality_rating || 
                review.communication_rating || review.quality_rating) && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {review.professionalism_rating && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Professionalism:</span>
                      <span className="font-medium">{review.professionalism_rating}/5</span>
                    </div>
                  )}
                  {review.punctuality_rating && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Punctuality:</span>
                      <span className="font-medium">{review.punctuality_rating}/5</span>
                    </div>
                  )}
                  {review.communication_rating && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Communication:</span>
                      <span className="font-medium">{review.communication_rating}/5</span>
                    </div>
                  )}
                  {review.quality_rating && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quality:</span>
                      <span className="font-medium">{review.quality_rating}/5</span>
                    </div>
                  )}
                </div>
              )}

              {/* Review Text */}
              {review.review_text && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground italic">"{review.review_text}"</p>
                </div>
              )}

              {/* Review Meta */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>
                  Reviewed by {reviewer?.first_name} {reviewer?.last_name}
                </span>
                <span>{format(new Date(review.reviewed_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
