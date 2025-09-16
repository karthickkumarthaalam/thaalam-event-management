import { extname } from 'path';
import * as path from 'path';
import { diskStorage } from 'multer';
import { existsSync, unlinkSync } from 'fs';

export function multerConfig(folder: string) {
  return {
    storage: diskStorage({
      destination: `./uploads/${folder}`,
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
  };
}

export function getFilePath(folder: string, filename: string) {
  return `/uploads/${folder}/${filename}`;
}

export function deleteFileIfExists(filePath: string) {
  if (!filePath) return;

  const relativePath = filePath.startsWith('/')
    ? filePath.substring(1)
    : filePath;
  const fullPath = path.join(process.cwd(), relativePath);

  if (existsSync(fullPath)) {
    try {
      unlinkSync(fullPath);
    } catch (error) {
      console.warn(`Failed to delete file: ${fullPath}`, error.message);
    }
  } else {
    console.warn('File does not exist:', fullPath);
  }
}
