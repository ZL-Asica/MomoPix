import { useCallback } from 'react';
import { toast } from 'sonner';

import { useAuthStore } from '@/stores';
import { UpdateFiles } from '@/api';

const useFileUpdater = () => {
  const setUserData = useAuthStore((state) => state.setUserData);
  const setLocalLoading = useAuthStore((state) => state.setLocalLoading);

  const renamePhoto = useCallback(
    async (albumName: string, photoId: string, newName: string) => {
      try {
        setLocalLoading('photoActions', true);
        const response_ = await UpdateFiles({
          albumName,
          updates: [{ id: photoId, name: newName }],
        });

        toast.success(`已重命名为 ${newName}`);
        setUserData(response_);
      } catch (error_) {
        toast.error(`重命名为 ${newName} 失败`);
        console.error(
          `Error while updating images: ${(error_ as Error).message}`
        );
      } finally {
        setLocalLoading('photoActions', false);
      }
    },
    [setUserData, setLocalLoading]
  );

  return { renamePhoto };
};

export default useFileUpdater;
