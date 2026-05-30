import React, { useState } from 'react';
import { Upload, X, FileText, Image, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EnhancedFileUploadProps {
  uploadedFiles: File[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove?: (index: number) => void;
}

const EnhancedFileUpload = ({ uploadedFiles, onFileUpload, onFileRemove }: EnhancedFileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files);
    }
  };

  const handleFileSelection = (files: FileList) => {
    const filesArray = Array.from(files);
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    
    const invalidFiles = filesArray.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, DOC, DOCX, JPG, or PNG files only",
        variant: "destructive",
      });
      return;
    }

    const oversizedFiles = filesArray.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 50MB each",
        variant: "destructive",
      });
      return;
    }

    // Create file event
    const fakeEvent = {
      target: {
        files: files
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    onFileUpload(fakeEvent);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-primary" />;
    }
    return <FileText className="h-5 w-5 text-primary" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getTotalSize = () => {
    return uploadedFiles.reduce((total, file) => total + file.size, 0);
  };

  return (
    <div className="w-full space-y-4">
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          {uploadedFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="border-2 border-primary rounded-lg p-4 bg-primary/5">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    {getFileIcon(file)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(file.size)}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">Ready to upload</span>
                    </div>
                  </div>
                </div>
                {onFileRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileRemove(index)}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {uploadedFiles.length > 1 && (
            <div className="text-sm text-muted-foreground">
              Total: {uploadedFiles.length} files ({formatFileSize(getTotalSize())})
            </div>
          )}
        </div>
      )}
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="bg-muted rounded-full p-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {uploadedFiles.length > 0 ? 'Add more files' : 'Drop files here or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOC, DOCX, JPG, or PNG • Max 50MB per file • Multiple files supported
            </p>
          </div>
        </div>
        <input
          id="file-input"
          type="file"
          className="hidden"
          onChange={handleInputChange}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          multiple
        />
      </div>
    </div>
  );
};

export default EnhancedFileUpload;
