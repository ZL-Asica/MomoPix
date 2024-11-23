import uploadSinglePhoto from './uploadUtils';
import generatePhotoData from './generatePhotoUrl';

import { getPreSignedLinks } from '@/api';

const uploadImages = async (
  userData: UserData,
  files: File[],
  albumName: string,
  addPhotosToAlbum: (albumName: string, photos: Photo[]) => Promise<void>,
  incrementProgress: () => void
) => {
  const photoData = files.map((file) =>
    generatePhotoData(userData.uid, file.name)
  );
  const preSignedLinks = await getPreSignedLinks(photoData, userData.TOKEN);

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
