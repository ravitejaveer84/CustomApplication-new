import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "./file-uploader";
import { apiRequest } from "@/lib/queryClient";

export function FileUploadTest() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Use fetch directly for FormData
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, browser will set it with boundary
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      const result = await response.json();
      setUploadResult(result);
      console.log('Upload successful:', result);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setUploadResult(null);
    } finally {
      setUploading(false);
    }
  };
  
  const handleSharePointUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Add SharePoint configuration
      formData.append('siteUrl', 'example.sharepoint.com');
      formData.append('username', 'demo@example.com');
      formData.append('password', 'password123');
      formData.append('libraryName', 'Documents');
      
      // Use fetch directly for FormData
      const response = await fetch('/api/upload/sharepoint', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'SharePoint upload failed');
      }
      
      const result = await response.json();
      setUploadResult(result);
      console.log('SharePoint upload successful:', result);
    } catch (err) {
      console.error('SharePoint upload error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setUploadResult(null);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>File Upload Test</CardTitle>
        <CardDescription>Test the file upload functionality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUploader 
          name="testFile"
          label="Upload File"
          accept="image/*,.pdf,.docx,.xlsx"
          onChange={setFile}
          error={error || undefined}
        />
        
        {uploadResult && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-green-700 font-medium mb-2">Upload Successful!</h3>
            <div className="text-sm">
              <p>Filename: {uploadResult.file?.filename}</p>
              <p>Type: {uploadResult.file?.mimetype}</p>
              <p>Size: {Math.round((uploadResult.file?.size || 0) / 1024)} KB</p>
              {uploadResult.file?.url && (
                <div className="mt-2">
                  <p className="font-medium">File URL:</p>
                  <a 
                    href={uploadResult.file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {uploadResult.file.url}
                  </a>
                </div>
              )}
              {uploadResult.sharePointUrl && (
                <div className="mt-2">
                  <p className="font-medium">SharePoint URL:</p>
                  <p className="break-all">{uploadResult.sharePointUrl}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => {
            setFile(null);
            setUploadResult(null);
            setError(null);
          }}
        >
          Clear
        </Button>
        <div className="space-x-2">
          <Button 
            onClick={handleFileUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload to Server'}
          </Button>
          <Button 
            variant="secondary"
            onClick={handleSharePointUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload to SharePoint'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}