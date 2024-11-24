import { toast } from 'sonner';

import generatePhoto from './generatePhoto';
import processImage from './processImage';

import { upload } from '@/api';

const uploadImages = async (
  userData: UserData,
  files: File[],
  albumName: string,
  addPhotosToAlbum: (albumName: string, photos: Photo[]) => Promise<void>
): Promise<boolean> => {
  // Step 1: Generate Photo objects for each file
  const photos: Photo[] = await Promise.all(
    files.map((file) => generatePhoto(userData.uid, file))
  );

  // Step 2: Process files and create UploadData
  const uploadData: UploadData = await Promise.all(
    photos.map(async (photo, index) => {
      const processedFile = await processImage(files[index]);
      if (!processedFile) {
        toast.error(`处理图片失败：${files[index].name}`);
        throw new Error(`Failed to process image: ${files[index].name}`);
      }
      const fileExtension = processedFile.type.split('/')[1] || 'bin';
      const key = `${photo.url}.${fileExtension}`;
      photo.url = key;
      photo.size = processedFile.size;

      return {
        key, // Key for the file in the backend
        file: processedFile, // Processed Blob
      };
    })
  );

  // Step 3: Upload files to the backend
  const uploadResults: UploadResults = await upload(uploadData, userData.TOKEN);

  // Step 4: Handle upload results
  const successfulUploads = uploadResults.uploaded.filter(
    (result) => result.success
  );
  const failedUploads = uploadResults.failed;

  // Mark uploadedAt for successful photos
  if (successfulUploads.length > 0) {
    const uploadedPhotos = successfulUploads.map((result) => {
      const photo = photos.find((p) => p.url === result.key);
      if (photo) {
        photo.url = `${import.meta.env.VITE_CF_R2}/${result.key}`;
        photo.uploadedAt = Date.now();
      }
      return photo;
    }) as Photo[];

    await addPhotosToAlbum(albumName, uploadedPhotos);
  }

  if (failedUploads.length > 0) {
    console.error('Failed to upload some files:', failedUploads);
    failedUploads.forEach((failure) => {
      console.error(`File failed: ${failure.key}, Error: ${failure.error}`);
      toast.error(`上传失败：${failure.key}，错误：${failure.error}`);
    });
    return false;
  }

  toast.success('上传完成！');
  return true;
};

export default uploadImages;
