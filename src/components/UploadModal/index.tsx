import { useState } from 'react';
import { Modal, Grid2 as Grid, Box, Button } from '@mui/material';

import ModalHeader from './ModalHeader';
import Dropzone from './Dropzone';
import FilePreview from './FilePreview';
import { ModalContainer } from './styles';

import { useFileUploader } from '@/hooks';
import { useAuthStore } from '@/stores';

import { SelectAlbumDropdown } from '@/components/Albums';

interface UploadModalProperties {
  open: boolean;
  onClose: () => void;
  targetAlbum?: string;
}

const UploadModal = ({
  open,
  onClose,
  targetAlbum = 'default',
}: UploadModalProperties) => {
  const userData = useAuthStore((state) => state.userData);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string>(targetAlbum);

  const { files, loading, addFiles, deleteFile, renameFile, handleUpload } =
    useFileUploader(userData, selectedAlbum, onClose);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby='upload-modal-title'
      sx={{
        margin: 8,
      }}
    >
      <ModalContainer>
        <ModalHeader
          title='上传图片'
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
              key={index}
              file={file}
              name={name}
              onDelete={() => deleteFile(index)}
              onRename={(newName) => renameFile(index, newName)}
            />
          ))}
        </Grid>

        <Box
          display='flex'
          justifyContent='space-between'
          mt={3}
        >
          <Button
            variant='contained'
            color='primary'
            onClick={handleUpload}
            disabled={files.length === 0 || loading}
          >
            {loading ? '上传中...' : '上传'}
          </Button>
          <Button
            variant='outlined'
            onClick={onClose}
            disabled={loading}
          >
            取消
          </Button>
        </Box>
      </ModalContainer>
    </Modal>
  );
};

export default UploadModal;
