import { useAuthContext } from '@/hooks';

/**
 * Hook for updating user data in Firestore
 */
const useUpdateUserData = () => {
  const { userData, updateUserData } = useAuthContext();

  if (!userData) {
    throw new Error('User is not authenticated');
  }

  /**
   * Update the user's basic information.
   * @param updatedFields - Partial user data fields to update
   */
  const updateBasicInfo = async (updatedFields: Partial<UserData>) => {
    await updateUserData(updatedFields);
  };

  /**
   * Add a new album to the user's albums.
   * @param albumName - Name of the new album
   */
  const addAlbum = async (albumName: string) => {
    const newAlbum: Album = {
      name: albumName,
      createdAt: new Date().toISOString(),
      photos: [],
    };
    const updatedAlbums = [...(userData.albums || []), newAlbum];
    await updateUserData({ albums: updatedAlbums });
  };

  /**
   * Add one or more photos to a specific album.
   * @param albumName - Name of the album
   * @param photos - Array of photo metadata
   */
  const addPhotosToAlbum = async (
    albumName: string = 'default',
    photos: Photo[]
  ) => {
    const updatedAlbums = (userData.albums || []).map((album) =>
      album.name === albumName
        ? {
            ...album,
            photos: [
              ...album.photos,
              ...photos.map((photo) => ({
                ...photo,
                uploadedAt: new Date().toISOString(),
              })),
            ],
          }
        : album
    );

    await updateUserData({ albums: updatedAlbums });
  };

  return {
    updateBasicInfo,
    addAlbum,
    addPhotosToAlbum,
  };
};

export default useUpdateUserData;
