import { produce } from 'immer';

import { useCommonUtils } from './utils';

const usePhotoOperations = () => {
  const { ensureUserData, updateUserData, userData } = useCommonUtils();

  const modifyAlbum = async (
    modifyCallback: (draftAlbums: Album[]) => void,
    successMessage: string,
    errorMessage: string
  ) => {
    ensureUserData();
    const updatedAlbums = produce(userData!.albums || [], modifyCallback);
    await updateUserData(
      { albums: updatedAlbums },
      successMessage,
      errorMessage
    );
  };

  const addPhotosToAlbum = async (albumName: string, photos: Photo[]) => {
    await modifyAlbum(
      (draftAlbums) => {
        const album = draftAlbums.find((album) => album.name === albumName);
        if (album) {
          album.photos.push(
            ...photos.map((photo) => ({
              ...photo,
              lastModified: Date.now(),
              uploadedAt: Date.now(),
            }))
          );
        }
      },
      `成功添加 ${photos.length} 张照片到相册 ${albumName}`,
      `添加 ${photos.length} 张照片到相册 ${albumName} 失败`
    );
  };

  const deletePhotosFromAlbum = async (
    albumName: string,
    photos: Photo[]
  ): Promise<void> => {
    await modifyAlbum(
      (draftAlbums) => {
        const album = draftAlbums.find((album) => album.name === albumName);
        if (album) {
          album.photos = album.photos.filter(
            (photo) => !photos.map((photo) => photo.id).includes(photo.id)
          );
        }
      },
      `成功删除 ${photos.length} 张照片`,
      `删除 ${photos.length} 张照片失败`
    );
  };

  const updatePhotoName = async (
    albumName: string,
    photoId: string,
    updatedName: string
  ) => {
    await modifyAlbum(
      (draftAlbums) => {
        const album = draftAlbums.find((album) => album.name === albumName);
        if (album) {
          const photo = album.photos.find((photo) => photo.id === photoId);
          if (photo) {
            photo.name = updatedName;
          }
        }
      },
      `已重命名为 ${updatedName}`,
      `重命名为 ${updatedName} 失败`
    );
  };

  const movePhoto = async (
    originalAlbumName: string,
    newAlbumName: string,
    photoId: string
  ) => {
    await modifyAlbum(
      (draftAlbums) => {
        const originalAlbum = draftAlbums.find(
          (album) => album.name === originalAlbumName
        );
        const newAlbum = draftAlbums.find(
          (album) => album.name === newAlbumName
        );
        if (originalAlbum && newAlbum) {
          const photo = originalAlbum.photos.find(
            (photo) => photo.id === photoId
          );
          if (photo) {
            originalAlbum.photos = originalAlbum.photos.filter(
              (photo) => photo.id !== photoId
            );
            newAlbum.photos.push(photo);
          }
        }
      },
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
