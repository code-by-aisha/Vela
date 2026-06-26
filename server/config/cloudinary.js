import { v2 as cloudinary } from 'cloudinary';

let configured = false;

// Lazy — reads process.env at call-time, not at module-init time
export function getCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure:     true,
    });
    configured = true;
  }
  return cloudinary;
}

export default cloudinary;
