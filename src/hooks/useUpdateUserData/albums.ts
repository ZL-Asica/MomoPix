import { useCommonUtils } from './utils';

type AlbumOperations = {
  addAlbum: (albumName: string) => Promise<void>;
  updateAlbum: (
    albumName: string,
    updatedFields: Partial<Pick<Album, 'name' | 'thumbnail'>>
  ) => Promise<void>;
};

const useAlbumOperations = (): AlbumOperations => {
  const { ensureUserData, updateUserData, userData } = useCommonUtils();

  const addAlbum = async (albumName: string) => {
    const newAlbum: Album = {
      name: albumName,
      thumbnail: '',
      createdAt: new Date().toISOString(),
      photos: [],
    };

    ensureUserData();
    const updatedAlbums = [...(userData!.albums || []), newAlbum];
    await updateUserData(
      { albums: updatedAlbums },
      `新增相册 ${albumName} 成功`,
      `新增相册 ${albumName} 失败`
    );
  };

  const updateAlbum = async (
    albumName: string,
    updatedFields: Partial<Pick<Album, 'name' | 'thumbnail'>>
  ) => {
    ensureUserData();
    const updatedAlbums = (userData!.albums || []).map((album) =>
      album.name === albumName ? { ...album, ...updatedFields } : album
    );

    const successMessage =
      'name' in updatedFields
        ? `相册 ${albumName} 已重命名`
        : `相册 ${albumName} 封面已更新`;
    await updateUserData({ albums: updatedAlbums }, successMessage);
  };

  return { addAlbum, updateAlbum };
};

export { useAlbumOperations };
