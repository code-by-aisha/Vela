import { getCloudinary } from '../config/cloudinary.js';
import { Readable } from 'stream';

const upload = (buffer, options = {}) => {
  const cld = getCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cld.uploader.upload_stream({ folder: 'vela', ...options }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    const r = new Readable();
    r.push(buffer);
    r.push(null);
    r.pipe(stream);
  });
};

export const uploadImage = async (buffer, folder = 'vela/images') => {
  const r = await upload(buffer, { folder, resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] });
  return { url: r.secure_url, publicId: r.public_id };
};

export const uploadVideo = async (buffer, folder = 'vela/videos') => {
  const r = await upload(buffer, { folder, resource_type: 'video' });
  return { url: r.secure_url, publicId: r.public_id };
};

export const uploadProfilePicture = async (buffer) => {
  const r = await upload(buffer, {
    folder: 'vela/avatars', resource_type: 'image',
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }, { quality: 'auto', fetch_format: 'auto' }],
  });
  return { url: r.secure_url, publicId: r.public_id };
};

export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  const cld = getCloudinary();
  return cld.uploader.destroy(publicId, { resource_type: resourceType });
};

export const uploadToCloudinary = upload;
