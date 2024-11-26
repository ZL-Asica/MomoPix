import { useCommonUtils } from './utils';

const usePhotoOperations = () => {
  const { ensureUserData, updateUserData, userData } = useCommonUtils();

  const addPhotosToAlbum = async (albumName: string, photos: Photo[]) => {
    ensureUserData();
    const updatedAlbums = (userData!.albums || []).map((album) =>
      album.name === albumName
        ? {
            ...album,
            photos: [
              ...album.photos,
              ...photos.map((photo) => ({
                ...photo,
                lastModified: Date.now(),
                uploadedAt: Date.now(),
              })),
            ],
          }
        : album
    );
    await updateUserData(
      { albums: updatedAlbums },
      `成功添加 ${photos.length} 张照片到相册 ${albumName}`,
      `添加 ${photos.length} 张照片到相册 ${albumName} 失败`
    );
  };

  const deletePhotosFromAlbum = async (
    albumName: string,
    photos: Photo[]
  ): Promise<void> => {
    ensureUserData();
    const updatedAlbums = (userData!.albums || []).map((album) =>
      album.name === albumName
        ? {
            ...album,
            photos: album.photos.filter(
              (photo) => !photos.map((p) => p.id).includes(photo.id)
            ),
          }
        : album
    );
    await updateUserData(
      { albums: updatedAlbums },
      `成功删除 ${photos.length} 张照片`,
      `删除 ${photos.length} 张照片失败`
    );
  };

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
    await updateUserData(
      { albums: updatedAlbums },
      `已重命名为 ${updatedName}`,
      `重命名为 ${updatedName} 失败`
    );
  };

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

    await updateUserData(
      { albums: updatedAlbums },
      `已移动到相册 ${newAlbumName}`,
      `移动到相册 ${newAlbumName} 失败`
    );
  };

  return {
    addPhotosToAlbum,
    deletePhotosFromAlbum,
    updatePhotoName,
    movePhoto,
  };
};

export { usePhotoOperations };
