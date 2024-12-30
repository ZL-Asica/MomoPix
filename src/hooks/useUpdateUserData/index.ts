import { fetchGravatarProfile, getGravatarURL } from '@/utils'
import { useAlbumOperations } from './albums'
import { usePhotoOperations } from './photos'

import { useCommonUtils } from './utils'

async function getPhotoURLFromGravatarBasedOnEmail(email: string) {
  const gravatarProfile = await fetchGravatarProfile(email)
  const avatarURL = await getGravatarURL(email)
  const photoURL = gravatarProfile?.photoURL ?? avatarURL
  return { photoURL }
}

function useUpdateUserData() {
  const albumOps = useAlbumOperations()
  const photoOps = usePhotoOperations()
  const { updateUserData } = useCommonUtils()

  /**
   * Update the user's basic information
   * @param updatedFields - Partial fields of UserData to update
   * @param successMessage - Message to show on success
   * @param errorMessage - Message to show on error
   */
  const updateBasicInfo = async (
    updatedFields: Partial<UserData>,
    successMessage = '个人资料更新成功',
    errorMessage = '个人资料更新失败',
  ) => {
    if (updatedFields.email?.trim() !== '' && updatedFields.photoURL === undefined) {
      const photoURL = await getPhotoURLFromGravatarBasedOnEmail(
        updatedFields.email as string,
      )
      updatedFields = { ...updatedFields, ...photoURL }
    }
    await updateUserData(updatedFields, successMessage, errorMessage)
  }

  return {
    ...albumOps,
    ...photoOps,
    updateBasicInfo,
  }
}

export default useUpdateUserData
