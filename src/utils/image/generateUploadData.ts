import { generateUniqueId } from '@zl-asica/react';

import processImage from './processImage';

import type { UploadFile } from '@/schemas';

const generateUploadData = async (
  uid: string,
  files: File[]
): Promise<UploadFile[]> => {
  const uploadData: UploadFile[] = await Promise.all(
    files.map(async (singleFile) => {
      const id = await generateUniqueId([
        uid,
        singleFile.name,
        singleFile.size.toString(),
      ]);
      // eslint-disable-next-line unicorn/prefer-string-replace-all
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '/');

      const url = `${date}/${id}`;

      const processedFile = await processImage(singleFile);
      if (!processedFile) {
        throw new Error(`处理图片失败：${singleFile.name}`);
      }

      const fileExtension = processedFile.type.split('/')[1] || 'bin';
      const key = `${url}.${fileExtension}`;

      return {
        key, // Backend key
        name: singleFile.name.includes('.')
          ? singleFile.name.replace(/\.[^./]+$/, '')
          : singleFile.name,
        file: processedFile, // Processed Blob
      };
    })
  );

  return uploadData;
};

export default generateUploadData;
