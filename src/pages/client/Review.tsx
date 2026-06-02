import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClientEvent } from "@/hooks/useClientEvent";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseLocalDate } from "@/lib/formatters";
// --- Sub-components ---
function ReviewLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function ReviewFuture({ eventData }: { eventData: { event_date: string } }) {
  const eventDate = parseLocalDate(eventData.event_date);
  const reviewDate = new Date(eventDate.getTime() + 86400000);
  const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / 86400000);
  const reviewDateStr = reviewDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const progress = daysUntil > 0 ? Math.max(0, Math.min(100, 100 - (daysUntil / 365) * 100)) : 100;

  return (
    <div className="max-w-lg mx-auto mt-12">
      <Card>
        <CardContent className="pt-8 text-center space-y-5">
          <Clock className="h-14 w-14 text-primary/60 mx-auto" />
          <div>
            <h2 className="text-xl font-semibold">Save This Page for After Your Event!</h2>
            <p className="text-muted-foreground mt-2">
              You'll be able to leave a review starting <strong>{reviewDateStr}</strong>.{" "}
              We can't wait to hear how it went!
            </p>
          </div>
          {daysUntil > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Today</span>
                <span>{daysUntil} day{daysUntil !== 1 ? 's' : ''} until your event</span>
                <span>Event Day</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewSubmitted({ rating }: { rating: number }) {
  return (
    <div className="max-w-lg mx-auto mt-12 space-y-6">
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold">Thank You for Your Review!</h2>
          <p className="text-muted-foreground">
            Your feedback means the world to us. It helps other couples feel confident choosing Enzym3 Entertainment.
          </p>
          {rating > 0 && (
            <div className="flex justify-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn("h-6 w-6", star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Main component ---
const Review = () => {
  const { event: eventData, loading: eventLoading, user } = useClientEvent<{
    id: string; event_date: string; couple_name: string; event_type: string;
  }>('id, event_date, couple_name, event_type');

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingRating, setExistingRating] = useState(0);
  const [reviewCheckDone, setReviewCheckDone] = useState(false);
  const [eventInFuture, setEventInFuture] = useState(false);

  useEffect(() => {
    if (eventLoading || !user?.email) return;

    const checkExistingReview = async () => {
      const { data: existingReview } = await supabase
        .from("client_reviews")
        .select("rating")
        .ilike("reviewer_email", user.email!.toLowerCase())
        .limit(1)
        .maybeSingle();

      if (existingReview) {
        setExistingRating(existingReview.rating);
        setSubmitted(true);
      }

      if (eventData && parseLocalDate(eventData.event_date) > new Date()) {
        setEventInFuture(true);
      }

      setReviewCheckDone(true);
    };

    checkExistingReview();
  }, [eventLoading, user?.email, eventData]);

  const handleSubmit = async () => {
    if (!rating || !reviewText.trim()) {
      toast.error("Please provide a rating and review text.");
      return;
    }
    if (!user?.email) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("client_reviews").insert({
        wedding_id: eventData?.id || null,
        reviewer_name: eventData?.couple_name || user.email,
        reviewer_email: user.email,
        rating,
        review_text: reviewText.trim(),
        event_date: eventData?.event_date || null,
        event_type: eventData?.event_type || "wedding",
      });

      if (error) throw error;

      setSubmitted(true);
      setExistingRating(rating);
      toast.success("Thank you for your review! 🎉");
    } catch (err: any) {
      console.error("Error submitting review:", err);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const loading = eventLoading || !reviewCheckDone;

  if (loading) return <ReviewLoading />;
  if (eventInFuture && eventData) return <ReviewFuture eventData={eventData} />;
  if (submitted) return <ReviewSubmitted rating={existingRating || rating} />;

  return (
    <div className="max-w-lg mx-auto mt-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Leave a Review</h1>
        <p className="text-muted-foreground mt-1">
          We'd love to hear about your experience with Enzym3 Entertainment!
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Experience</CardTitle>
          <CardDescription>How was your event with us?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review">Your Review</Label>
            <Textarea
              id="review"
              placeholder="Tell us about your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">{reviewText.length}/2000</p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !rating || !reviewText.trim()}
            className="w-full"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Review;
