import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { config } from '../config';
import { ValidationError } from '../utils/errors';

const uploadDir = path.resolve(config.upload.dir);

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedName = file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    const filename = `${uuidv4()}_${sanitizedName}${ext}`;
    cb(null, filename);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError(`File type '${file.mimetype}' is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSizeMb * 1024 * 1024,
    files: 10,
  },
});

export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 10);
