import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

const uploadDirectory = path.resolve('server/uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, done) =>
    done(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`
    ),
});

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

export const imageUrls = (files = []) =>
  files.map((file) => `/uploads/${file.filename}`);
