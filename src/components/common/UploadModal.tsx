import { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  Grid2 as Grid,
  TextField,
} from '@mui/material';
import { styled, useMediaQuery, useTheme } from '@mui/system';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILES = 10;

const ModalContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '95%',
  maxWidth: 600,
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
}));

const DropzoneContainer = styled(Box, {
  shouldForwardProp: (property) => property !== 'isDragging',
})<{ isDragging: boolean }>(({ isDragging, theme }) => ({
  border: `2px dashed ${isDragging ? theme.palette.primary.dark : theme.palette.primary.main}`,
  borderRadius: theme.spacing(1),
  padding: isDragging ? theme.spacing(6) : theme.spacing(4), // Increase padding when dragging
  textAlign: 'center',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  backgroundColor: isDragging ? 'rgba(245, 245, 245, 0.5)' : 'transparent', // Add background color when dragging
  transform: isDragging ? 'scale(1.05)' : 'scale(1)',
}));

const PreviewImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  borderRadius: 8,
});

const PreviewContainer = styled(Box)(({ theme }) => ({
  width: 120,
  height: 120,
  border: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  backgroundColor: theme.palette.background.default,
}));

interface UploadModalProperties {
  open: boolean;
  onClose: () => void;
}

const UploadModal = ({ open, onClose }: UploadModalProperties) => {
  const [files, setFiles] = useState<{ file: File; name: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const validateFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(`文件 "${file.name}" 类型不支持，仅支持图片格式`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`文件 "${file.name}" 超过了 ${MAX_FILE_SIZE_MB}MB 限制`);
      return false;
    }
    return true;
  };

  const onDrop = (acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((file) => validateFile(file));
    const newFiles = validFiles.map((file) => ({
      file,
      name: file.name,
    }));

    if (files.length + newFiles.length > MAX_FILES) {
      toast.error(`一次最多上传 ${MAX_FILES} 张图片`);
      return;
    }

    setFiles((previous) => [...previous, ...newFiles]);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: MAX_FILES,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  const handleDelete = (index: number) => {
    setFiles((previous) => previous.filter((_, index_) => index_ !== index));
  };

  const handleFileNameChange = (index: number, newName: string) => {
    setFiles((previous) =>
      previous.map((file, index_) => {
        if (index_ === index) {
          const extension = file.file.name.split('.').pop(); // Extract file extension
          const baseName = newName.split('.').slice(0, -1).join('.') || newName; // Remove file extension from new name
          return { ...file, name: `${baseName}.${extension}` };
        }
        return file;
      })
    );
  };

  const handleUpload = () => {
    if (files.length === 0) {
      toast.error('请至少上传一张图片');
      return;
    }

    // ! Nee dto replace with real upload logic
    console.log(
      '上传的图片:',
      files.map(({ file, name }) => ({ file, name }))
    );

    setFiles([]);
    onClose();
  };

  return (
    <Modal
      sx={isMobile ? { mx: 10 } : {}}
      open={open}
      onClose={onClose}
      aria-labelledby='upload-modal-title'
      aria-describedby='upload-modal-description'
    >
      <ModalContainer>
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={2}
        >
          <Typography
            id='upload-modal-title'
            variant='h6'
          >
            上传图片
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {isMobile ? ( // 移动端显示点击上传按钮
          <Button
            sx={{ display: 'block', mx: 'auto' }}
            variant='contained'
            color='primary'
            onClick={() => {
              const fileInput = document.querySelector(
                'input[type="file"]'
              ) as HTMLInputElement | null;
              fileInput?.click();
            }}
          >
            点击上传文件
          </Button>
        ) : (
          <DropzoneContainer
            {...getRootProps()}
            isDragging={isDragging}
          >
            <input {...getInputProps()} />
            <Typography
              variant='body1'
              color='textSecondary'
            >
              {isDragging ? '松开文件以上传' : '拖拽图片到此处或点击上传文件'}
            </Typography>
            <Typography
              variant='caption'
              color='textSecondary'
            >
              每张最大 {MAX_FILE_SIZE_MB}MB，一次最多上传 {MAX_FILES} 张图片
            </Typography>
          </DropzoneContainer>
        )}

        <Grid
          container
          spacing={2}
          mt={2}
        >
          {files.map(({ file, name }, index) => (
            <Grid
              component='li'
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Box position='relative'>
                <PreviewContainer>
                  <PreviewImage
                    src={URL.createObjectURL(file)}
                    alt={name}
                  />
                </PreviewContainer>
                <TextField
                  fullWidth
                  value={name.split('.').slice(0, -1).join('.')} // Remove file extension
                  onChange={(event) =>
                    handleFileNameChange(index, event.target.value)
                  }
                  variant='standard'
                  size='small'
                  sx={{ mt: 1 }}
                />
                <IconButton
                  size='small'
                  color='error'
                  onClick={() => handleDelete(index)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Grid>
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
            disabled={files.length === 0}
          >
            上传
          </Button>
          <Button
            variant='outlined'
            color='secondary'
            onClick={onClose}
          >
            取消
          </Button>
        </Box>
      </ModalContainer>
    </Modal>
  );
};

export default UploadModal;
