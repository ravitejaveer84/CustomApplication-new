import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current directory equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Configure upload limits and file types
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: function (req, file, cb) {
    // Accept all file types for now
    // You can add restrictions based on file.mimetype here
    cb(null, true);
  }
});

// Middleware to handle single file uploads
export const uploadSingleFile = (fieldName: string = 'file') => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        return res.status(400).json({ 
          success: false, 
          message: `Upload error: ${err.message}` 
        });
      } else if (err) {
        // An unknown error occurred
        return res.status(500).json({ 
          success: false, 
          message: `Server error: ${err.message}` 
        });
      }
      
      // Everything went fine, proceed
      next();
    });
  };
};

// Middleware to handle multiple file uploads
export const uploadMultipleFiles = (fieldName: string = 'files', maxCount: number = 5) => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        return res.status(400).json({ 
          success: false, 
          message: `Upload error: ${err.message}` 
        });
      } else if (err) {
        // An unknown error occurred
        return res.status(500).json({ 
          success: false, 
          message: `Server error: ${err.message}` 
        });
      }
      
      // Everything went fine, proceed
      next();
    });
  };
};

// Utility function to get file information
export const getFileInfo = (file: Express.Multer.File) => {
  return {
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    url: `/uploads/${file.filename}`
  };
};

// (Optional) Interface for SharePoint upload configuration
export interface SharePointConfig {
  siteUrl: string;
  username: string;
  password: string;
  libraryName: string;
  folderPath?: string;
}

// Upload to SharePoint (stub - would require SharePoint API integration)
export const uploadToSharePoint = async (
  file: Express.Multer.File, 
  config: SharePointConfig
): Promise<{ success: boolean; url?: string; message?: string }> => {
  try {
    // This would be replaced with actual SharePoint API integration
    console.log(`[Simulation] Uploading ${file.originalname} to SharePoint at ${config.siteUrl}`);
    
    // Simulated response for development
    return {
      success: true,
      url: `https://${config.siteUrl}/${config.libraryName}/${file.originalname}`,
      message: 'File uploaded to SharePoint successfully'
    };
  } catch (error) {
    console.error('SharePoint upload error:', error);
    return {
      success: false,
      message: `SharePoint upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};