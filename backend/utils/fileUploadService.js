import 'dotenv/config';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import fs from 'fs';
import path from 'path';

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, E2E_MODE } = process.env;
const isE2EMode = String(E2E_MODE).toLowerCase() === 'true';

let storage;

if (isE2EMode) {
  const tempDir = path.join(process.cwd(), 'temp', 'e2e-uploads');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, tempDir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });
} else {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    console.error('CRITICAL ERROR: Cloudinary credentials are not configured.');
    throw new Error('Cloudinary credentials are not configured in environment variables');
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    timeout: 60000, // 60 seconds timeout for uploads
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
      const userId = req.user._id.toString();
      return {
        folder: `campus-complaints/${userId}`,
        resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
      };
    },
  });
}

// File size limit (10MB)
const limits = {
  fileSize: 10 * 1024 * 1024,
};

// This is the new fileFilter function you requested (Point 1)
const fileFilter = (req, file, cb) => {
  // This is the security check for 'anonymous' uploads (Point 3)
  // Your 'protect' middleware should run first, but this is a
  // great "defense-in-depth" check to prevent unauthenticated uploads.
  if (!req.user) {
    const authError = new Error('Not authorized. Please log in to upload files.');
    authError.code = 'UNAUTHENTICATED_UPLOAD';
    return cb(authError, false);
  }

  // This is your file type validation (Point 1)
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Allow file
  } else {
    // Reject file with a specific error
    const typeError = new Error('Invalid file type. Only JPG, PNG, MP4, and MOV are allowed.');
    typeError.code = 'INVALID_FILE_TYPE';
    cb(typeError, false);
  }
};

// Middleware handles uploads to Cloudinary with per-user folders.
export const upload = multer({
  storage,
  limits,
  fileFilter, // We added your new fileFilter here
});

/**
* Extracts public ID from Cloudinary URL and deletes the asset.
 * @param {string} fileUrl - The full Cloudinary URL stored in DB
 */
export const deleteFromCloudinary = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    // 1. Determine resource type (image or video) based on URL content or extension
    const isVideo = fileUrl.includes('/video/') || fileUrl.match(/\.(mp4|mov|avi|mkv)$/i);
    const resourceType = isVideo ? 'video' : 'image';

    // 2. Extract Public ID using Regex
    // Matches everything after '/upload/' (optional version 'v1234/') and before the file extension
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
    const match = fileUrl.match(regex);

    if (match && match[1]) {
      const publicId = match[1]; // e.g., "campus-complaints/user123/my-image"
      
      console.log(`Deleting from Cloudinary: ${publicId} (${resourceType})`);
      
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });
    } else {
      console.warn('Could not extract publicId from URL:', fileUrl);
    }
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    // We don't throw here to ensure the database delete continues even if cloud delete fails
  }
};