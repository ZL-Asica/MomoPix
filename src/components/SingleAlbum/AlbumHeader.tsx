import { InputDialog, UploadModal } from '@/components'
import { useUpdateUserData } from '@/hooks'
import {
  Edit as EditIcon,
  PhotoLibrary as PhotoLibraryIcon,
} from '@mui/icons-material'
import { Box, Button, Tooltip, Typography } from '@mui/material'

import { useToggle } from '@zl-asica/react'
import { useNavigate } from 'react-router-dom'

interface AlbumHeaderProperties {
  currentAlbum: Album
}

function AlbumHeader({ currentAlbum }: AlbumHeaderProperties) {
  const navigate = useNavigate()
  const { updateAlbum } = useUpdateUserData()

  const albumNameInput = currentAlbum?.name || ''
  const [editingAlbum, toggleEditingAlbum] = useToggle()
  const [uploadModalOpen, toggleUploadModalOpen] = useToggle()

  const handleSaveAlbum = async (newName: string) => {
    await updateAlbum(currentAlbum.name, { name: newName })
    await navigate(`/album/${newName}`)
  }

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={4}
      >
        <Box>
          <Typography
            variant="h4"
            gutterBottom
          >
            {currentAlbum.name}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
          >
            照片数量:
            {' '}
            {currentAlbum.photos.length || 0}
            <br />
            创建时间:
            {' '}
            {new Date(currentAlbum.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexDirection: 'column',
          }}
        >
          <Tooltip title={`上传到 ${currentAlbum.name}`}>
            <Button
              startIcon={<PhotoLibraryIcon />}
              variant="contained"
              color="primary"
              onClick={toggleUploadModalOpen}
            >
              上传到此相册
            </Button>
          </Tooltip>

          <Tooltip
            title={
              currentAlbum.name === 'default'
                ? '默认相册名称不可编辑'
                : '编辑相册名称'
            }
          >
            <span>
              <Button
                startIcon={<EditIcon />}
                variant="outlined"
                onClick={toggleEditingAlbum}
                disabled={currentAlbum.name === 'default'}
              >
                编辑相册名称
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Edit album dialog */}
      <InputDialog
        open={editingAlbum}
        onClose={toggleEditingAlbum}
        title="编辑相册名称"
        inputLabel="相册名称"
        handleSave={handleSaveAlbum}
        defaultValue={albumNameInput}
      />

      {/* Upload Modal */}
      <UploadModal
        open={uploadModalOpen}
        onClose={toggleUploadModalOpen}
        targetAlbum={currentAlbum.name}
      />
    </>
  )
}

export default AlbumHeader
