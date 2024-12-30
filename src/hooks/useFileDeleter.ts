import type { DeleteRequest } from '@/schemas'

import { DeleteFiles } from '@/api'
import { useAuthStore } from '@/stores'
import { toast } from 'sonner'

function useFileDeleter() {
  const setUserData = useAuthStore(state => state.setUserData)
  const setLocalLoading = useAuthStore(state => state.setLocalLoading)

  const deleteFiles = async (albumName: string, photos: Photo[], onClose: () => void) => {
    if (photos.length === 0) {
      toast.error('未选择任何图片删除')
      return null
    }

    setLocalLoading('photoActions', true)

    try {
      const urlsToDelete = photos.map(photo => photo.url)

      const deleteResponse = await DeleteFiles({
        albumName,
        urls: urlsToDelete,
      } as DeleteRequest)

      toast.success(`成功删除 ${photos.length} 张照片`)

      if (deleteResponse !== null) {
        setUserData(deleteResponse)
        onClose()
      }

      return deleteResponse
    }
    catch (error_) {
      toast.error(`删除 ${photos.length} 张照片失败`)
      console.error(`删除过程中发生错误：${(error_ as Error).message}`)
      return null
    }
    finally {
      setLocalLoading('photoActions', false)
    }
  }

  return { deleteFiles }
}

export default useFileDeleter
