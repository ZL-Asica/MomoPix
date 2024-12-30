import { SelectAlbumDropdown } from '@/components/Albums'
import { useFileUploader } from '@/hooks'

import { useAuthStore } from '@/stores'
import { asyncHandler } from '@/utils'
import { Box, Button, Grid2 as Grid, Modal } from '@mui/material'
import { useState } from 'react'

import Dropzone from './Dropzone'
import FilePreview from './FilePreview'

import ModalHeader from './ModalHeader'
import { ModalContainer } from './styles'

interface UploadModalProperties {
  open: boolean
  onClose: () => void
  targetAlbum?: string
}

function UploadModal({
  open,
  onClose,
  targetAlbum = 'default',
}: UploadModalProperties) {
  const localLoading = useAuthStore(state => state.localLoading)

  const [isDragging, setIsDragging] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<string>(targetAlbum)

  const { files, addFiles, deleteFile, renameFile, handleUpload }
    = useFileUploader(selectedAlbum, onClose)

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="upload-modal-title"
      sx={{
        margin: 8,
      }}
    >
      <ModalContainer>
        <ModalHeader
          title="上传图片"
          onClose={onClose}
        />
        <SelectAlbumDropdown
          selectedAlbum={selectedAlbum}
          setSelectedAlbum={setSelectedAlbum}
        />

        {/* File drag and upload */}
        <Dropzone
          onDrop={addFiles}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
        />
        <Grid
          container
          spacing={2}
          mt={2}
        >
          {files.map(({ file, name }, index) => (
            <FilePreview
              key={`${name}-${file.lastModified}`}
              file={file}
              name={name}
              onDelete={() => deleteFile(index)}
              onRename={newName => renameFile(index, newName)}
            />
          ))}
        </Grid>

        <Box
          display="flex"
          justifyContent="space-between"
          mt={3}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={
              asyncHandler(async () => {
                await handleUpload()
              })
            }
            disabled={files.length === 0 || localLoading.upload}
          >
            {localLoading.upload ? '上传中...' : '上传'}
          </Button>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={localLoading.upload}
          >
            取消
          </Button>
        </Box>
      </ModalContainer>
    </Modal>
  )
}

export default UploadModal
