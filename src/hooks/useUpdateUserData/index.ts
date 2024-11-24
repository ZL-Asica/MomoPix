import { useAlbumOperations } from './albums';
import { usePhotoOperations } from './photos';
import { useCommonUtils } from './utils';

const useUpdateUserData = () => {
  const albumOps = useAlbumOperations();
  const photoOps = usePhotoOperations();
  const { updateUserData, processing } = useCommonUtils();

  /**
   * Update the user's basic information
   * @param updatedFields - Partial fields of UserData to update
   * @param successMessage - Message to show on success
   * @param errorMessage - Message to show on error
   */
  const updateBasicInfo = async (
    updatedFields: Partial<UserData>,
    successMessage = '个人资料更新成功',
    errorMessage = '个人资料更新失败'
  ) => {
    await updateUserData(updatedFields, successMessage, errorMessage);
  };

  return {
    ...albumOps,
    ...photoOps,
    updateBasicInfo,
    processing,
  };
};

export default useUpdateUserData;
