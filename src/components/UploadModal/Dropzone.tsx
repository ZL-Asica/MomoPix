import { Typography } from '@mui/material';
import { useDropzone } from 'react-dropzone';

import { DropzoneContainer } from './styles';

import { MAX_FILE_SIZE_MB, MAX_FILES } from '@/consts';

interface DropzoneProperties {
  onDrop: (acceptedFiles: File[]) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

const Dropzone = ({
  onDrop,
  isDragging,
  setIsDragging,
}: DropzoneProperties) => {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: MAX_FILES,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  return (
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
  );
};

export default Dropzone;
