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
import { MAX_FILES } from './constants';

import { useAuthContext, useUploadProgress } from '@/hooks';
import { uploadImages } from '@/utils';

import { SelectAlbumDropdown } from '@/components/Albums';

interface UploadModalProperties {
  open: boolean;
  onClose: () => void;
}

const UploadModal = ({ open, onClose }: UploadModalProperties) => {
  const { userData } = useAuthContext();
  const [files, setFiles] = useState<{ file: File; name: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('default');
  const { progress, incrementProgress, resetProgress } = useUploadProgress(
    files.length
  );

  const validateFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(`文件 "${file.name}" 类型不支持，仅支持图片格式`);
      return false;
    }
    return true;
  };

  const onDrop = (acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((file) => validateFile(file));
    const newFiles = validFiles.map((file) => ({ file, name: file.name }));

    if (files.length + newFiles.length > MAX_FILES) {
      toast.error(`一次最多上传 ${MAX_FILES} 张图片`);
      return;
    }

    setFiles((previous) => [...previous, ...newFiles]);
  };

  const handleDelete = (index: number) => {
    setFiles((previous) => previous.filter((_, index_) => index_ !== index));
  };

  const handleRename = (index: number, newName: string) => {
    setFiles((previous) =>
      previous.map((file, index_) =>
        index_ === index
          ? { ...file, name: `${newName}.${file.file.name.split('.').pop()}` }
          : file
      )
    );
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('请至少上传一张图片');
      return;
    }

    try {
      resetProgress();
      await uploadImages(
        userData?.uid || '',
        files.map((f) => f.file),
        selectedAlbum,
        incrementProgress
      );
      toast.success('上传完成！');
      setFiles([]);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('上传失败');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby='upload-modal-title'
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

        {/* 文件拖拽/上传区域 */}
        <Dropzone
          onDrop={onDrop}
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
              onDelete={() => handleDelete(index)}
              onRename={(newName) => handleRename(index, newName)}
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
