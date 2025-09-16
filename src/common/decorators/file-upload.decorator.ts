import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../utils/file-upload.utils';

export function UploadFile(filedName: string, folder: string) {
  return applyDecorators(
    UseInterceptors(FileInterceptor(filedName, multerConfig(folder))),
  );
}
