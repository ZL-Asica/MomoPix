import { Box, Typography, Divider, Button } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuthContext } from '@/hooks';

import {
  ImageDisplay,
  PhotoActions,
  CopyableLinks,
} from '@/components/SinglePhoto';

const SinglePhotoPage = () => {
  const { userData } = useAuthContext();
  const navigate = useNavigate();
  const params = useParams();
  const albumName = params.albumName;
  const photoId = params.photoId;

  const photo = userData?.albums
    .find((album) => album.name === albumName)
    ?.photos.find((photo) => photo.id === photoId);

  if (!photo) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          px: 2,
          textAlign: 'center',
        }}
      >
        <Typography
          variant='h5'
          gutterBottom
        >
          未找到图片
        </Typography>
        <Typography>看看链接是不是输错了呢～～～</Typography>
        <Button
          variant='outlined'
          onClick={() => navigate(`/album/${albumName}`)}
          sx={{ mt: 3 }}
        >
          返回相册
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        px: 2,
      }}
    >
      {/* 返回按钮 */}
      <Button
        variant='text'
        onClick={() => navigate(`/album/${albumName}`)}
        sx={{
          alignSelf: 'flex-start',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        返回相册 {albumName?.toLocaleLowerCase()}
      </Button>

      {/* 图片显示 */}
      <ImageDisplay
        url={photo.url}
        alt={photo.name}
      />

      {/* 图片名称和操作按钮 */}
      <PhotoActions photo={photo} />

      <Divider sx={{ my: 3 }} />

      {/* 图片链接 */}
      <Box
        sx={{
          maxWidth: '600px', // 限制最大宽度
          mx: 'auto', // 水平居中
          width: '100%', // 保证在小屏幕时占满宽度
        }}
      >
        <Typography
          variant='h6'
          gutterBottom
        >
          图片链接
        </Typography>
        <CopyableLinks photo={photo} />
      </Box>
    </Box>
  );
};

export default SinglePhotoPage;
