import uploadSinglePhoto from './uploadUtils';
import generatePhotoData from './generatePhotoUrl';

import { getPreSignedLinks } from '@/api';
import { useUpdateUserData } from '@/hooks';

const uploadImages = async (
  userId: string,
  files: File[],
  albumName: string,
  incrementProgress: () => void
) => {
  const { addPhotosToAlbum } = useUpdateUserData();
  const photoData = files.map((file) => generatePhotoData(userId, file.name));
  const preSignedLinks = await getPreSignedLinks(photoData);

  const uploadTasks = files.map((file, index) => {
    const singlePhoto = photoData[index];
    const preSignedLink = preSignedLinks.find(
      (link) => link.id === singlePhoto.id
    );

    if (!preSignedLink) {
      console.error(
        `Pre-signed URL not found for singlePhoto: ${singlePhoto.id}`
      );
      return null;
    }

    return uploadSinglePhoto(
      file,
      singlePhoto,
      preSignedLink,
      incrementProgress
    );
  });

  const uploadResults = await Promise.all(uploadTasks);
  const photos = uploadResults.filter(Boolean) as Photo[];
  await addPhotosToAlbum(albumName, photos);
};

export default uploadImages;
