import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, CheckCircle, Award } from 'lucide-react';
import { useVendorPerformance } from '@/hooks/useVendorReviews';
import { Skeleton } from '@/components/ui/skeleton';

interface VendorPerformanceCardProps {
  vendorId: string;
}

export function VendorPerformanceCard({ vendorId }: VendorPerformanceCardProps) {
  const { data: performance, isLoading } = useVendorPerformance(vendorId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!performance || performance.total_reviews === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No reviews yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const getReliabilityColor = () => {
    if (performance.average_rating >= 4.5) return 'text-green-500';
    if (performance.average_rating >= 3.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getReliabilityLabel = () => {
    if (performance.average_rating >= 4.5) return 'Excellent';
    if (performance.average_rating >= 3.5) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="text-2xl font-bold">{performance.average_rating.toFixed(1)}</span>
            <span className="text-muted-foreground">/ 5.0</span>
          </div>
          <Badge className={getReliabilityColor()}>
            {getReliabilityLabel()}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Award className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">{performance.total_reviews}</div>
            <div className="text-xs text-muted-foreground">Reviews</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">{performance.events_completed}</div>
            <div className="text-xs text-muted-foreground">Events</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">{Math.round(performance.would_hire_again_percentage)}%</div>
            <div className="text-xs text-muted-foreground">Rehire Rate</div>
          </div>
        </div>

        {/* Category Ratings */}
        {performance.category_ratings.professionalism > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Category Breakdown</h4>
            <div className="space-y-2">
              {[
                { label: 'Professionalism', value: performance.category_ratings.professionalism },
                { label: 'Punctuality', value: performance.category_ratings.punctuality },
                { label: 'Communication', value: performance.category_ratings.communication },
                { label: 'Quality', value: performance.category_ratings.quality },
              ].map((category) => (
                category.value > 0 && (
                  <div key={category.label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{category.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= Math.round(category.value)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium w-8 text-right">
                        {category.value.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
