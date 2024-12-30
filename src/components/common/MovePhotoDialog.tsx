import { SmallLoadingCircle } from '@/components'
import { useUpdateUserData } from '@/hooks'

import { useAuthStore } from '@/stores'
import { asyncHandler } from '@/utils'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import { useState } from 'react'

interface MovePhotoDialogProperties {
  albumName: string
  photo: Photo[]
  open: boolean
  onClose: () => void
}

function MovePhotoDialog({
  albumName,
  photo,
  open,
  onClose,
}: MovePhotoDialogProperties) {
  const { movePhoto } = useUpdateUserData()
  const [targetAlbum, setTargetAlbum] = useState<string>('')
  const localLoading = useAuthStore(state => state.localLoading)
  const setLocalLoading = useAuthStore(state => state.setLocalLoading)

  // Fetch user's album list dynamically (exclude current album)
  const userData = useAuthStore(state => state.userData)
  const albums
    = userData?.albums.filter((album: Album) => album.name !== albumName) || []

  const handleMovePhoto = async () => {
    // Prevent moving if no album is selected
    if (!targetAlbum)
      return
    setLocalLoading('photoActions', true)
    await Promise.all(
      photo.map(async photo => movePhoto(albumName, targetAlbum, photo.id)),
    )
    setLocalLoading('photoActions', false)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {photo.length > 1 ? `移动 ${photo.length} 张照片` : '移动照片'}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          sx={{ mb: 2 }}
        >
          选择目标相册以移动照片：
        </Typography>
        <Select
          value={targetAlbum}
          onChange={event_ => setTargetAlbum(event_.target.value)}
          fullWidth
          displayEmpty
        >
          <MenuItem
            value=""
            disabled
          >
            选择相册
          </MenuItem>
          {albums.map(album => (
            <MenuItem
              key={album.name}
              value={album.name}
            >
              {album.name}
            </MenuItem>
          ))}
        </Select>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="secondary"
          disabled={localLoading.photoActions}
        >
          取消
        </Button>
        <Button
          onClick={asyncHandler(async () => {
            await handleMovePhoto()
          })}
          color="primary"
          disabled={localLoading.photoActions || !targetAlbum}
        >
          {localLoading.photoActions
            ? (
                <SmallLoadingCircle text="移动中..." />
              )
            : (
                '移动'
              )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MovePhotoDialog
