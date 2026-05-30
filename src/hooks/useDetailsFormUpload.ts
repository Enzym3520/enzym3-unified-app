import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDetailsFormUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadDetailsForm = async (
    weddingId: string,
    file: File,
    uploadedBy: string,
    notes?: string
  ): Promise<boolean> => {
    setIsUploading(true);
    
    try {
      // Generate unique file path
      const timestamp = new Date().getTime();
      
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `details-forms/${weddingId}/${timestamp}-${sanitizedFileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('wedding-uploads')
        .upload(filePath, file);

      if (uploadError) {
        if (import.meta.env.DEV) console.error('File upload error:', uploadError);
        throw new Error('Failed to upload file to storage');
      }

      // Create record in uploaded_details_forms table
      const { error: insertError } = await supabase
        .from('uploaded_details_forms')
        .insert({
          wedding_id: weddingId,
          file_path: filePath,
          file_name: file.name,
          file_type: file.type,
          uploaded_by: uploadedBy,
          notes: notes || null
        });

      if (insertError) {
        if (import.meta.env.DEV) console.error('Database insert error:', insertError);
        // Try to clean up the uploaded file
        await supabase.storage.from('wedding-uploads').remove([filePath]);
        throw new Error('Failed to save upload record');
      }

      toast({
        title: 'Upload Successful',
        description: 'Details form has been uploaded successfully.',
      });

      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload details form',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultipleDetailsForm = async (
    weddingId: string,
    files: File[],
    uploadedBy: string,
    notes?: string
  ): Promise<boolean> => {
    setIsUploading(true);
    
    try {
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const file of files) {
        try {
          // Generate unique file path
          const timestamp = new Date().getTime();
          
          const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const filePath = `details-forms/${weddingId}/${timestamp}-${sanitizedFileName}`;

          // Upload file to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('wedding-uploads')
            .upload(filePath, file);

          if (uploadError) {
            if (import.meta.env.DEV) console.error('File upload error:', uploadError);
            errors.push(`${file.name}: Failed to upload`);
            failCount++;
            continue;
          }

          // Create record in uploaded_details_forms table
          const { error: insertError } = await supabase
            .from('uploaded_details_forms')
            .insert({
              wedding_id: weddingId,
              file_path: filePath,
              file_name: file.name,
              file_type: file.type,
              uploaded_by: uploadedBy,
              notes: notes || null
            });

          if (insertError) {
            if (import.meta.env.DEV) console.error('Database insert error:', insertError);
            // Try to clean up the uploaded file
            await supabase.storage.from('wedding-uploads').remove([filePath]);
            errors.push(`${file.name}: Failed to save record`);
            failCount++;
            continue;
          }

          successCount++;
        } catch (error) {
          if (import.meta.env.DEV) console.error('Error uploading file:', file.name, error);
          errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Upload Complete',
          description: `Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}${failCount > 0 ? `. ${failCount} failed.` : ''}`,
        });
      }

      if (failCount > 0 && successCount === 0) {
        toast({
          title: 'Upload Failed',
          description: errors.join('; '),
          variant: 'destructive',
        });
        return false;
      }

      return successCount > 0;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload files',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadDetailsForm,
    uploadMultipleDetailsForm,
    isUploading
  };
};
