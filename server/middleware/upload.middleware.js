import multer from 'multer';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

// Use memory storage → stream directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: ${allowedTypes.join(', ')}`), false);
  }
};

export const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
});

export const uploadVideo = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: fileFilter(ALLOWED_VIDEO_TYPES),
});

export const uploadMedia = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: fileFilter([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]),
});
