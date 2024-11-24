import { Box } from '@mui/material';

interface ImageDisplayProperties {
  url: string;
  alt: string;
}

const ImageDisplay = ({ url, alt }: ImageDisplayProperties) => {
  return (
    <Box
      sx={{
        width: '100%', // 父容器宽度固定
        height: 400, // 固定高度，避免图片过小影响父容器
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9', // 可选背景色，增强视觉对比
        borderRadius: 2,
        border: '1px solid #ddd',
      }}
    >
      <Box
        component='img'
        src={url}
        alt={alt}
        sx={{
          maxWidth: '100%', // 图片宽度超出父容器时自动缩小
          maxHeight: '100%', // 图片高度超出父容器时自动缩小
          objectFit: 'contain', // 确保缩小时保持比例
          display: 'block',
        }}
      />
    </Box>
  );
};

export default ImageDisplay;
