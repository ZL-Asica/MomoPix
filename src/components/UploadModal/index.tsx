import { useState } from 'react';
import { Modal, Grid2 as Grid, Box, Button } from '@mui/material';

import ModalHeader from './ModalHeader';
import Dropzone from './Dropzone';
import FilePreview from './FilePreview';
import { ModalContainer } from './styles';

import { useAuthContext, useFileUploader, useUpdateUserData } from '@/hooks';

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
  const { userData } = useAuthContext();
  const { addPhotosToAlbum } = useUpdateUserData();

  const [isDragging, setIsDragging] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string>(targetAlbum);

  const { files, isUploading, addFiles, deleteFile, renameFile, handleUpload } =
    useFileUploader(userData, selectedAlbum, addPhotosToAlbum, onClose);

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
            disabled={files.length === 0 || isUploading}
          >
            {isUploading ? '上传中...' : '上传'}
          </Button>
          <Button
            variant='outlined'
            onClick={onClose}
            disabled={isUploading}
          >
            取消
          </Button>
        </Box>
      </ModalContainer>
    </Modal>
  );
};

export default UploadModal;
