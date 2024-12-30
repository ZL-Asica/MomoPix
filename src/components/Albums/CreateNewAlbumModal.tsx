import { InputDialog } from '@/components'
import { useUpdateUserData } from '@/hooks'

interface CreateNewAlbumModalProperties {
  dialogOpen: boolean
  toggleDialogOpen: () => void
  setAlbumName?: (albumName: string) => void
}

function CreateNewAlbumModal({
  dialogOpen,
  toggleDialogOpen,
  setAlbumName,
}: CreateNewAlbumModalProperties) {
  const { addAlbum } = useUpdateUserData()

  const handleAddAlbum = async (albumName: string) => {
    try {
      await addAlbum(albumName)
      setAlbumName?.(albumName)
    }
    catch (error) {
      console.error('Failed to add album:', error)
    }
  }

  return (
    <InputDialog
      open={dialogOpen}
      onClose={toggleDialogOpen}
      title="新建相册"
      inputLabel="相册名称"
      handleSave={handleAddAlbum}
    />
  )
}

export default CreateNewAlbumModal
