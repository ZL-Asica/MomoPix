import { SmallLoadingCircle } from '@/components'

import { useFileDeleter } from '@/hooks'
import { useAuthStore } from '@/stores'
import { asyncHandler } from '@/utils'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'

interface DeletePhotosDialogProperties {
  albumName: string
  photos: Photo[]
  open: boolean
  onClose: () => void
}

function DeletePhotosDialog({
  albumName,
  photos,
  open,
  onClose,
}: DeletePhotosDialogProperties) {
  const localLoading = useAuthStore(state => state.localLoading)
  const { deleteFiles } = useFileDeleter()

  const handleDelete = async () => {
    await deleteFiles(albumName, photos, onClose)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {photos.length > 1 ? `删除 ${photos.length} 张照片` : '删除照片'}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          sx={{ mb: 2 }}
        >
          {photos.length > 1
            ? `确定要删除这 ${photos.length} 张照片吗？`
            : `确定要删除 ${photos[0].name} 吗？`}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="primary"
          disabled={localLoading.photoActions}
        >
          取消
        </Button>
        <Button
          onClick={asyncHandler(async () => {
            await handleDelete()
          })}
          color="primary"
          variant="contained"
        >
          {localLoading.photoActions
            ? (
                <SmallLoadingCircle text="删除中..." />
              )
            : (
                '删除'
              )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeletePhotosDialog
