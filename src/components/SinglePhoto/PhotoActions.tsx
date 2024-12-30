import { MovePhotoDialog } from '@/components'
import { useFileUpdater } from '@/hooks'
import { useAuthStore } from '@/stores'
import { asyncHandler } from '@/utils'
import SaveIcon from '@mui/icons-material/Check'
import CancelIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import MoveIcon from '@mui/icons-material/SwapHoriz'

import { Box, IconButton, TextField, Tooltip, Typography } from '@mui/material'
import { useToggle } from '@zl-asica/react'
import { useState } from 'react'

interface PhotoInfoAndActionsProperties {
  albumName: string
  photo: Photo
}

function PhotoInfoAndActions({
  albumName,
  photo,
}: PhotoInfoAndActionsProperties) {
  const localLoading = useAuthStore(state => state.localLoading)
  const [photoName, setPhotoName] = useState(photo.name)
  const [isEditing, setIsEditing] = useState(false)
  const [updatedName, setUpdatedName] = useState(photo.name)
  const [openMoveDialog, toggleMoveDialog] = useToggle()
  const renamePhoto = useFileUpdater().renamePhoto

  const handleSaveName = async () => {
    if (updatedName !== photo.name) {
      await renamePhoto(albumName, photo.id, updatedName)
      setIsEditing(false)
      setPhotoName(updatedName)
    }
  }

  const handleCancelEdit = () => {
    setUpdatedName(photo.name)
    setIsEditing(false)
  }

  const photoSize
    = photo.size < 1024 * 1024
      ? `${(photo.size / 1024).toFixed(2)} KB`
      : `${(photo.size / 1024 / 1024).toFixed(2)} MB`

  return (
    <>
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        sx={{
          mr: { xs: 0, sm: 2, md: 3 },
        }}
      >
        {/* Name with edit functionality */}
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          width="100%"
        >
          {isEditing
            ? (
                <>
                  <TextField
                    value={updatedName}
                    onChange={event_ => setUpdatedName(event_.target.value)}
                    size="small"
                    variant="outlined"
                    sx={{
                      flexGrow: 1,
                    }}
                  />
                  <Tooltip title="保存">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={
                        asyncHandler(async () => {
                          await handleSaveName()
                        })
                      }
                      disabled={localLoading.photoActions}
                    >
                      <SaveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="取消">
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={handleCancelEdit}
                      disabled={localLoading.photoActions}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )
            : (
                <>
                  <Typography
                    variant="h6"
                    sx={{
                      wordBreak: 'break-word',
                    }}
                  >
                    {photoName}
                  </Typography>
                  <Tooltip title="编辑名称">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => setIsEditing(true)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
        </Box>
        <Tooltip title="移动照片">
          <IconButton
            size="large"
            color="primary"
            onClick={toggleMoveDialog}
            aria-label="Move photo"
          >
            <MoveIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Metadata */}
      <Typography
        variant="body2"
        color="text.secondary"
      >
        上传时间：
        {new Date(photo.uploadedAt).toLocaleString()}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1 }}
      >
        文件大小：
        {photoSize}
      </Typography>

      <MovePhotoDialog
        albumName={albumName}
        photo={[photo]}
        open={openMoveDialog}
        onClose={toggleMoveDialog}
      />
    </>
  )
}

export default PhotoInfoAndActions
