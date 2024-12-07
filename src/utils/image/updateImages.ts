import { toast } from 'sonner';

import { UpdateFiles } from '@/api';

const updateImage = async (
  albumName: string,
  photoId: string,
  newName: string,
  setLoading: (loading: boolean) => void
): Promise<UserData | null> => {
  try {
    setLoading(true);
    const updateResponse = await UpdateFiles({
      albumName,
      updates: [{ id: photoId, name: newName }],
    });

    toast.success(`已重命名为 ${newName}`);
    return updateResponse;
  } catch (error_) {
    toast.error(`重命名为 ${newName} 失败`);
    console.error(`Error while updating images: ${(error_ as Error).message}`);
    return null;
  } finally {
    setLoading(false);
  }
};

export default updateImage;
