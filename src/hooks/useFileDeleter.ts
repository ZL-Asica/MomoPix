import { toast } from 'sonner';

import { deleteFilesAPI } from '@/api';

const deleteFiles = async (
  userData: UserData,
  albumName: string,
  photos: Photo[],
  deletePhotosFromAlbum: (albumName: string, photos: Photo[]) => void
): Promise<boolean> => {
  if (!userData.TOKEN) {
    toast.error('用户未登录或TOKEN无效');
    return false;
  }

  if (photos.length === 0) {
    toast.error('未选择任何图片删除');
    return false;
  }

  try {
    // Get keys to delete
    const keysToDelete = photos.map((photo) =>
      photo.url.replace(`${import.meta.env.VITE_CF_R2}/`, '')
    );

    // Call API to delete files
    const result = await deleteFilesAPI(keysToDelete, userData.TOKEN);

    // Handle the result
    const successfulDeletes = new Set(result.deleted.map((d) => d.key));
    const failedDeletes = result.failed;

    const deletedPhotos = photos.filter((photo) =>
      successfulDeletes.has(
        photo.url.replace(`${import.meta.env.VITE_CF_R2}/`, '')
      )
    );

    if (deletedPhotos.length > 0) {
      // Update the album and inform the user
      await deletePhotosFromAlbum(albumName, deletedPhotos);
    }

    if (failedDeletes.length > 0) {
      failedDeletes.forEach((failure) => {
        console.error(`删除失败：${failure.key}，错误：${failure.error}`);
      });
    }

    return failedDeletes.length === 0;
  } catch (error) {
    console.error('删除过程中发生错误：', error);
    return false;
  }
};

export default deleteFiles;
