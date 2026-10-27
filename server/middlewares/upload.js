import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
} from '../config/cloudinary.js';

const uploadDirectory = path.resolve('server/uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.memoryStorage();

export const uploadImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 25 },
  fileFilter: (req, file, done) => done(null, allowedTypes.has(file.mimetype)),
}).fields([
  { name: 'images', maxCount: 5 },
  { name: 'colorImages', maxCount: 20 },
]);

export const uploadCategoryImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, done) => done(null, allowedTypes.has(file.mimetype)),
}).single('image');

const saveForLocalDevelopment = async (file) => {
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path
    .extname(file.originalname)
    .toLowerCase()}`;
  await fs.promises.writeFile(
    path.join(uploadDirectory, filename),
    file.buffer
  );
  return `/uploads/${filename}`;
};

export const imageUrls = async (files = []) =>
  Promise.all(
    files.map((file) => {
      if (isCloudinaryConfigured()) return uploadToCloudinary(file);
      if (process.env.NODE_ENV === 'production') {
        const error = new Error(
          'Image storage is not configured. Add the Cloudinary credentials in Render.'
        );
        error.statusCode = 503;
        throw error;
      }
      return saveForLocalDevelopment(file);
    })
  );
