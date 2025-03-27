import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FileUploaderProps {
  name: string;
  label: string;
  required?: boolean;
  helpText?: string;
  accept?: string;
  error?: string;
  onChange: (file: File | null) => void;
}

export function FileUploader({
  name,
  label,
  required = false,
  helpText,
  accept = "*",
  error,
  onChange
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      onChange(file);
      
      // Create a preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setPreview(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    } else {
      setSelectedFile(null);
      setPreview(null);
      onChange(null);
    }
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <div className="border rounded-md p-4 bg-gray-50">
        <Input
          id={name}
          name={name}
          type="file"
          onChange={handleFileChange}
          accept={accept}
          className={`w-full ${error ? "border-red-500" : ""}`}
        />
        {selectedFile && (
          <div className="mt-2 text-sm">
            <p className="font-medium">Selected file: {selectedFile.name}</p>
            <p>Size: {Math.round(selectedFile.size / 1024)} KB</p>
            {preview && (
              <div className="mt-2">
                <p className="mb-1">Preview:</p>
                <img 
                  src={preview} 
                  alt="File preview" 
                  className="max-w-full max-h-40 object-contain border rounded"
                />
              </div>
            )}
          </div>
        )}
      </div>
      {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}