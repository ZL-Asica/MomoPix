import { processImage, generatePhotoId, generatePhotoUrl } from './index';

import { getPreSignedLinks } from '@/api';
import { useUpdateUserData } from '@/hooks';

const uploadImages = async (
  userId: string,
  files: File[],
  albumName: string,
  incrementProgress: () => void
) => {
  const { addPhotosToAlbum } = useUpdateUserData();
  const photoIds = files.map((file) => generatePhotoId(userId, file.name));
  const preSignedLinks = await getPreSignedLinks(photoIds);

  const photos: Photo[] = [];

  for (const [index, file] of files.entries()) {
    const compressedBlob = await processImage(file);
    const photoId = photoIds[index];
    const preSignedUrl = preSignedLinks[index];

    const response = await fetch(preSignedUrl, {
      method: 'PUT',
      body: compressedBlob,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload photo: ${file.name}`);
    }

    const photo: Photo = {
      id: photoId,
      url: generatePhotoUrl(photoId),
      size: compressedBlob.size,
      lastModified: Date.now(),
      uploadedAt: Date.now(),
      name: file.name,
    };

    photos.push(photo);
    incrementProgress();
  }

  await addPhotosToAlbum(albumName, photos);
};

export default uploadImages;
