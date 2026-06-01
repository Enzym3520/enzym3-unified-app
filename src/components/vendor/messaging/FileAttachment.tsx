import { useState, useRef } from 'react';
import { Paperclip, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileAttachmentProps {
  bucket: 'team-files' | 'wedding-files';
  folderPrefix: string;
  onFileUploaded: (url: string, name: string) => void;
  disabled?: boolean;
}

export const FileAttachment = ({ bucket, folderPrefix, onFileUploaded, disabled }: FileAttachmentProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 10MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${folderPrefix}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);

      if (bucket === 'team-files') {
        const { data: signedData, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365);
        if (signedError || !signedData?.signedUrl) {
          throw new Error(signedError?.message || 'Failed to generate signed URL for private file');
        }
        onFileUploaded(signedData.signedUrl, file.name);
      } else {
        onFileUploaded(publicUrl, file.name);
      }
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" />
      <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0" disabled={disabled || uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
      </Button>
    </>
  );
};

export const FilePreview = ({ fileUrl, fileName, className }: { fileUrl: string; fileName: string; className?: string }) => {
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);

  if (isImage) {
    return (
      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={cn('block mt-1', className)}>
        <img src={fileUrl} alt={fileName} className="max-w-[200px] max-h-[150px] rounded object-cover border" />
        <span className="text-xs opacity-70 mt-0.5 block">{fileName}</span>
      </a>
    );
  }

  return (
    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={cn('flex items-center gap-2 mt-1 p-2 rounded border bg-background/50 hover:bg-background/80 transition-colors', className)}>
      <FileText className="w-4 h-4 shrink-0" />
      <span className="text-xs truncate">{fileName}</span>
    </a>
  );
};
