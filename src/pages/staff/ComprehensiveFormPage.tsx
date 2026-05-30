import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EnhancedFileUpload from '@/components/staff/form-fields/EnhancedFileUpload';
import { useDetailsFormUpload } from '@/hooks/useDetailsFormUpload';
import { Upload, FileText } from 'lucide-react';
import { formatEventType } from '@/utils/notificationHelpers';
import { capitalizeNames } from '@/utils/contactHelpers';
import { safeFormatDate } from '@/utils/dateHelpers';
import { format } from 'date-fns';

interface CoupleOption {
  id: string;
  couple_name: string;
  event_date: string;
  event_type: string;
  venue: string | null;
}

const ComprehensiveFormPage = () => {
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [uploaderName, setUploaderName] = useState('Cece');

  const { uploadMultipleDetailsForm, isUploading } = useDetailsFormUpload();

  // Fetch all couples from event_notification_history
  const { data: couples = [], isLoading: isLoadingCouples } = useQuery({
    queryKey: ['couples-for-upload'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_notification_history')
        .select('id, couple_name, event_date, event_type, venue')
        .order('event_date', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data as CoupleOption[];
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const handleFileRemove = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedWeddingId) {
      alert('Please select an event');
      return;
    }

    if (uploadedFiles.length === 0) {
      alert('Please upload at least one file');
      return;
    }

    const success = await uploadMultipleDetailsForm(
      selectedWeddingId,
      uploadedFiles,
      uploaderName,
      notes
    );

    if (success) {
      // Reset form
      setSelectedWeddingId('');
      setUploadedFiles([]);
      setNotes('');
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">Upload Completed Details Form</CardTitle>
          <CardDescription className="text-base">
            Upload a pre-filled event details form and link it to an event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Couple Selector */}
          <div className="space-y-2">
            <Label htmlFor="couple-select" className="text-base font-semibold">
              Select Event <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedWeddingId}
              onValueChange={setSelectedWeddingId}
              disabled={isLoadingCouples}
            >
              <SelectTrigger id="couple-select" className="w-full">
                <SelectValue placeholder="Choose an event..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {couples.map((couple) => (
                  <SelectItem key={couple.id} value={couple.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{capitalizeNames(couple.couple_name)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatEventType(couple.event_type)} • {safeFormatDate(couple.event_date, 'MMM dd, yyyy')}
                        {couple.venue && ` • ${couple.venue}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoadingCouples && (
              <p className="text-sm text-muted-foreground">Loading events...</p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Upload Form <span className="text-destructive">*</span>
            </Label>
            <EnhancedFileUpload
              uploadedFiles={uploadedFiles}
              onFileUpload={handleFileUpload}
              onFileRemove={handleFileRemove}
            />
            <p className="text-sm text-muted-foreground">
              Supported formats: PDF, DOC, DOCX, JPG, PNG • Max 50MB per file • Upload multiple files
            </p>
          </div>

          {/* Uploader Name */}
          <div className="space-y-2">
            <Label htmlFor="uploader-name" className="text-base font-semibold">
              Your Name
            </Label>
            <Input
              id="uploader-name"
              type="text"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          {/* Optional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-semibold">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any notes or comments about this upload..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!selectedWeddingId || uploadedFiles.length === 0 || isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Details Form
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveFormPage;
