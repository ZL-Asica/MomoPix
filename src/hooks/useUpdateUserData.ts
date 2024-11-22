import { useAuthContext } from '@/hooks';

/**
 * Hook for updating user data in Firestore
 */
const useUpdateUserData = () => {
  const { loading, userData, updateUserData } = useAuthContext();

  /**
   * Ensure that user data is available.
   * Throws an error if user data is not loaded or authenticated.
   */
  const ensureUserData = () => {
    if (loading) {
      throw new Error('User data is still loading');
    }
    if (!userData) {
      throw new Error('User data is not available');
    }
  };

  /**
   * Update the user's basic information.
   * @param updatedFields - Partial user data fields to update
   */
  const updateBasicInfo = async (updatedFields: Partial<UserData>) => {
    ensureUserData();
    await updateUserData(updatedFields);
  };

  /**
   * Add a new album to the user's albums.
   * @param albumName - Name of the new album
   */
  const addAlbum = async (albumName: string) => {
    ensureUserData();
    const newAlbum: Album = {
      name: albumName,
      thumbnail: '',
      createdAt: new Date().toISOString(),
      photos: [],
    };
    const updatedAlbums = [...(userData!.albums || []), newAlbum];
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
    ensureUserData();
    const updatedAlbums = (userData!.albums || []).map((album) =>
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

  /**
   * Update album details (name or thumbnail).
   * @param albumName - The name of the album to update
   * @param updatedFields - The updated album fields 'name' | 'thumbnail'
   */
  const updateAlbum = async (
    albumName: string,
    updatedFields: Partial<Pick<Album, 'name' | 'thumbnail'>>
  ) => {
    ensureUserData();
    const updatedAlbums = (userData!.albums || []).map((album) =>
      album.name === albumName ? { ...album, ...updatedFields } : album
    );

    await updateUserData({ albums: updatedAlbums });
  };

  /**
   * Update a photo's name within an album.
   * @param albumName - The name of the album containing the photo
   * @param photoId - The unique identifier of the photo to update
   * @param updatedName - The new name for the photo
   */
  const updatePhotoName = async (
    albumName: string,
    photoId: string,
    updatedName: string
  ) => {
    ensureUserData();
    const updatedAlbums = (userData!.albums || []).map((album) =>
      album.name === albumName
        ? {
            ...album,
            photos: album.photos.map((photo) =>
              photo.id === photoId ? { ...photo, name: updatedName } : photo
            ),
          }
        : album
    );

    await updateUserData({ albums: updatedAlbums });
  };

  /**
   * Move a photo from one album to another.
   * @param originalAlbumName - The name of the album containing the photo
   * @param newAlbumName - The name of the destination album
   * @param photoId - The unique identifier of the photo to move
   */
  const movePhoto = async (
    originalAlbumName: string,
    newAlbumName: string,
    photoId: string
  ) => {
    ensureUserData();
    const updatedAlbums = (userData!.albums || []).map((album) => {
      if (album.name === originalAlbumName) {
        return {
          ...album,
          photos: album.photos.filter((photo) => photo.id !== photoId),
        };
      }
      if (album.name === newAlbumName) {
        return {
          ...album,
          photos: [
            ...album.photos,
            userData!.albums
              .find((album) => album.name === originalAlbumName)
              ?.photos.find((photo) => photo.id === photoId) as Photo,
          ],
        };
      }
      return album;
    });

    await updateUserData({ albums: updatedAlbums });
  };

  return {
    updateBasicInfo,
    addAlbum,
    updateAlbum,
    addPhotosToAlbum,
    updatePhotoName,
    movePhoto,
  };
};

export default useUpdateUserData;
