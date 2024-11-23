import { useState } from 'react';
import {
  Modal,
  Grid2 as Grid,
  Box,
  Button,
  Typography,
  LinearProgress,
} from '@mui/material';
import { toast } from 'sonner';

import ModalHeader from './ModalHeader';
import Dropzone from './Dropzone';
import FilePreview from './FilePreview';
import { ModalContainer } from './styles';

import {
  useAuthContext,
  useFileUploader,
  useUpdateUserData,
  useUploadProgress,
} from '@/hooks';
import { uploadImages } from '@/utils';

import { SelectAlbumDropdown } from '@/components/Albums';

interface UploadModalProperties {
  open: boolean;
  onClose: () => void;
}

const UploadModal = ({ open, onClose }: UploadModalProperties) => {
  const { userData } = useAuthContext();
  const { addPhotosToAlbum } = useUpdateUserData();
  const { files, setFiles, addFiles, deleteFile, renameFile } =
    useFileUploader();

  const [isDragging, setIsDragging] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('default');
  const { progress, incrementProgress, resetProgress } = useUploadProgress(
    files.length
  );

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('请至少上传一张图片');
      return;
    }

    if (!userData) {
      toast.error('用户数据未加载');
      return;
    }

    try {
      resetProgress(); // Reset progress
      await uploadImages(
        userData,
        files.map((f) => f.file),
        selectedAlbum,
        addPhotosToAlbum,
        incrementProgress
      );
      toast.success('上传完成！');
      setFiles([]); // Clear files
      onClose();
    } catch (error) {
      console.error('上传失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast.error(`上传失败：${errorMessage}`);
    }
  };

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

        {/* 上传进度条 */}
        {progress > 0 && (
          <Box
            mt={3}
            mb={1}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography
              variant='body2'
              color='textSecondary'
            >
              上传进度:
            </Typography>
            <LinearProgress
              variant='determinate'
              value={(progress / files.length) * 100}
              sx={{ flex: 1 }}
            />
            <Typography variant='body2'>
              {Math.round((progress / files.length) * 100)}%
            </Typography>
          </Box>
        )}

        <Box
          display='flex'
          justifyContent='space-between'
          mt={3}
        >
          <Button
            variant='contained'
            color='primary'
            onClick={handleUpload}
            disabled={files.length === 0 || progress > 0}
          >
            {progress > 0 ? '上传中...' : '上传'}
          </Button>
          <Button
            variant='outlined'
            onClick={onClose}
            disabled={progress > 0}
          >
            取消
          </Button>
        </Box>
      </ModalContainer>
    </Modal>
  );
};

export default UploadModal;
