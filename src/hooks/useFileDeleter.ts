import { toast } from 'sonner';

import { DeleteFiles } from '@/api';
import type { DeleteRequest } from '@/schemas';

const deleteFiles = async (
  albumName: string,
  photos: Photo[]
): Promise<UserData | null> => {
  if (photos.length === 0) {
    toast.error('未选择任何图片删除');
    return null;
  }
  try {
    const urlsToDelete = photos.map((photo) => photo.url);

    const deleteResponse = await DeleteFiles({
      albumName,
      urls: urlsToDelete,
    } as DeleteRequest);

    toast.success(`成功删除 ${photos.length} 张照片`);

    return deleteResponse;
  } catch (error_) {
    toast.error(`删除 ${photos.length} 张照片失败`);
    console.error(`删除过程中发生错误：${(error_ as Error).message}`);
    return null;
  }
};

export default deleteFiles;
