
import React from 'react';
import { Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface FileUploadSectionProps {
  uploadedFile: File | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUploadSection = ({ uploadedFile, onFileUpload }: FileUploadSectionProps) => {
  return (
    <div>
      <Label className="font-poppins font-medium">Upload (Optional)</Label>
      <div className="mt-2">
        <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex flex-col items-center">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <span className="font-poppins text-sm text-gray-500">
              {uploadedFile ? uploadedFile.name : "Click to upload a file"}
            </span>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={onFileUpload}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        </label>
      </div>
    </div>
  );
};

export default FileUploadSection;
