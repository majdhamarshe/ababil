import { v2 as cloudinary } from 'cloudinary';

const cloudinaryConfig = () => ({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const isCloudinaryConfigured = () =>
  Object.values(cloudinaryConfig()).every(Boolean);

export const uploadToCloudinary = (file) => {
  if (!isCloudinaryConfigured()) {
    const error = new Error(
      'Image storage is not configured. Add the Cloudinary credentials in Render.'
    );
    error.statusCode = 503;
    throw error;
  }

  cloudinary.config(cloudinaryConfig());

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'ababil',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
  });
};
