import { produce } from 'immer'

import { useCommonUtils } from './utils'

function usePhotoOperations() {
  const { ensureUserData, updateUserData, userData } = useCommonUtils()

  const modifyAlbum = async (
    modifyCallback: (draftAlbums: Album[]) => void,
    successMessage: string,
    errorMessage: string,
  ) => {
    ensureUserData()
    const updatedAlbums = produce(userData!.albums ?? [], modifyCallback)
    await updateUserData(
      { albums: updatedAlbums },
      successMessage,
      errorMessage,
    )
  }

  const movePhoto = async (
    originalAlbumName: string,
    newAlbumName: string,
    photoId: string,
  ) => {
    await modifyAlbum(
      (draftAlbums) => {
        const originalAlbum = draftAlbums.find(
          album => album.name === originalAlbumName,
        )
        const newAlbum = draftAlbums.find(
          album => album.name === newAlbumName,
        )
        if (originalAlbum && newAlbum) {
          const photo = originalAlbum.photos.find(
            photo => photo.id === photoId,
          )
          if (photo) {
            originalAlbum.photos = originalAlbum.photos.filter(
              photo => photo.id !== photoId,
            )
            newAlbum.photos.push(photo)
          }
        }
      },
      `已移动到相册 ${newAlbumName}`,
      `移动到相册 ${newAlbumName} 失败`,
    )
  }

  return {
    movePhoto,
  }
}

export { usePhotoOperations }
