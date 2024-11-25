import { toast } from 'sonner';

import generatePhoto from './generatePhoto';
import processImage from './processImage';

import upload from '@/api/upload';
import type { UploadFile } from '@/schemas';
import { UploadResultsSchema } from '@/schemas';

const uploadImages = async (
  userData: UserData,
  files: File[],
  albumName: string,
  addPhotosToAlbum: (albumName: string, photos: Photo[]) => Promise<void>
): Promise<boolean> => {
  try {
    // Step 1: Generate Photo objects for each file
    const photos: Photo[] = await Promise.all(
      files.map((file) => generatePhoto(userData.uid, file))
    );

    // Step 2: Process images and generate UploadData
    const uploadData: UploadFile[] = await Promise.all(
      photos.map(async (photo, index) => {
        const processedFile = await processImage(files[index]);
        if (!processedFile) {
          const errorMessage = `处理图片失败：${files[index].name}`;
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        const fileExtension = processedFile.type.split('/')[1] || 'bin';
        const key = `${photo.url}.${fileExtension}`;

        // Update photo metadata
        photo.url = key;
        photo.size = processedFile.size;

        return {
          key, // Backend key
          file: processedFile, // Processed Blob
        };
      })
    );

    // Step 3: Upload files to the backend
    const rawResults = await upload(uploadData, userData.TOKEN);

    // Validate results using Zod
    const parsedResults = UploadResultsSchema.safeParse(rawResults);
    if (!parsedResults.success) {
      console.error('Invalid upload results:', parsedResults.error);
      toast.error('上传返回结果格式错误！');
      throw new Error('Invalid upload results structure');
    }
    const uploadResults = parsedResults.data;

    // Step 4: Handle upload results
    const successfulUploads = uploadResults.uploaded.filter(
      (result) => result.success
    );
    const failedUploads = uploadResults.failed;

    // Mark uploadedAt for successful photos
    if (successfulUploads.length > 0) {
      const uploadedPhotos = successfulUploads
        .map((result) => {
          const photo = photos.find((p) => p.url === result.key);
          if (!photo) {
            console.error(`无法匹配成功上传的文件：${result.key}`);
            return null;
          }

          photo.url = `${import.meta.env.VITE_CF_R2}/${result.key}`;
          photo.uploadedAt = Date.now();
          return photo;
        })
        .filter(Boolean) as Photo[];

      await addPhotosToAlbum(albumName, uploadedPhotos);
    }

    // Handle failed uploads
    if (failedUploads.length > 0) {
      console.error('Failed to upload some files:', failedUploads);
      failedUploads.forEach((failure) => {
        console.error(`File failed: ${failure.key}, Error: ${failure.error}`);
        toast.error(`上传失败：${failure.key}，错误：${failure.error}`);
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error during upload:', error);
    toast.error(`上传过程中发生错误：${(error as Error).message}`);
    return false;
  }
};

export default uploadImages;
