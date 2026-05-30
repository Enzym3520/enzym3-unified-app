import React from 'react';
import { FileText } from 'lucide-react';

interface FileUploadSectionProps {
  uploadedFile: File;
}

const FileUploadSection = ({ uploadedFile }: FileUploadSectionProps) => {
  return (
    <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        Uploaded File
      </h3>
      <div className="bg-gradient-to-r from-gray-50/50 to-gray-50/30 rounded-2xl p-6 border border-border/20">
        <div className="text-sm">
          <p className="font-medium text-gray-800">{uploadedFile.name}</p>
          <p className="text-gray-600 mt-1">
            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUploadSection;