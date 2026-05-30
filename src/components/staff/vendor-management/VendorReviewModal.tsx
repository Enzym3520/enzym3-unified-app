import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Star } from 'lucide-react';
import { useSubmitReview, CreateReviewData } from '@/hooks/useVendorReviews';

interface VendorReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
  vendorName: string;
  assignmentId: string;
  eventDetails: {
    coupleName: string;
    eventDate: string;
    eventType: string;
  };
}

export function VendorReviewModal({ 
  open, 
  onOpenChange, 
  vendorId, 
  vendorName,
  assignmentId,
  eventDetails 
}: VendorReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [professionalismRating, setProfessionalismRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [wouldHireAgain, setWouldHireAgain] = useState(true);
  const [reviewText, setReviewText] = useState('');

  const submitReview = useSubmitReview();

  const handleSubmit = () => {
    const reviewData: CreateReviewData = {
      vendor_id: vendorId,
      assignment_id: assignmentId,
      rating,
      professionalism_rating: professionalismRating,
      punctuality_rating: punctualityRating,
      communication_rating: communicationRating,
      quality_rating: qualityRating,
      would_hire_again: wouldHireAgain,
      review_text: reviewText || undefined,
    };

    submitReview.mutate(reviewData, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setRating(5);
    setProfessionalismRating(5);
    setPunctualityRating(5);
    setCommunicationRating(5);
    setQualityRating(5);
    setWouldHireAgain(true);
    setReviewText('');
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (val: number) => void; label: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-colors"
          >
            <Star
              className={`h-6 w-6 ${
                star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Vendor Performance</DialogTitle>
          <DialogDescription>
            Rate {vendorName}'s performance for {eventDetails.coupleName}'s {eventDetails.eventType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Rating */}
          <StarRating value={rating} onChange={setRating} label="Overall Rating" />

          {/* Category Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StarRating 
              value={professionalismRating} 
              onChange={setProfessionalismRating} 
              label="Professionalism" 
            />
            <StarRating 
              value={punctualityRating} 
              onChange={setPunctualityRating} 
              label="Punctuality" 
            />
            <StarRating 
              value={communicationRating} 
              onChange={setCommunicationRating} 
              label="Communication" 
            />
            <StarRating 
              value={qualityRating} 
              onChange={setQualityRating} 
              label="Quality of Work" 
            />
          </div>

          {/* Would Hire Again */}
          <div className="flex items-center justify-between">
            <Label htmlFor="hire-again" className="text-base">Would you hire this vendor again?</Label>
            <Switch
              id="hire-again"
              checked={wouldHireAgain}
              onCheckedChange={setWouldHireAgain}
            />
          </div>

          {/* Private Notes */}
          <div className="space-y-2">
            <Label htmlFor="review-text">Private Notes (optional)</Label>
            <Textarea
              id="review-text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Add any additional notes about this vendor's performance..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              These notes are private and only visible to admins
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitReview.isPending}>
            {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
