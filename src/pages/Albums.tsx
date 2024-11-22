import { Box, Grid2 as Grid, Typography, Button, Alert } from '@mui/material';
import { Link } from 'react-router-dom';

import { AlbumCard } from '@/components/Albums';

import useAuthContext from '@/hooks/useAuthContext';

const AlbumsPage = () => {
  const { userData, loading } = useAuthContext();

  if (!userData) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='100vh'
      >
        <Alert severity='error'>请先登录查看相册</Alert>
      </Box>
    );
  }

  const albums = userData.albums || [];

  return (
    <Box
      maxWidth={1000}
      margin='0 auto'
      padding={3}
    >
      <Typography
        variant='h4'
        gutterBottom
        align='center'
      >
        我的相册
      </Typography>

      {albums.length === 0 ? (
        <Box
          textAlign='center'
          mt={4}
        >
          <Typography
            variant='body1'
            color='textSecondary'
          >
            还没有创建任何相册。
          </Typography>
          <Button
            variant='contained'
            color='primary'
            component={Link}
            to='/create-album'
            sx={{ mt: 2 }}
          >
            创建第一个相册
          </Button>
        </Box>
      ) : (
        <Grid
          container
          spacing={3}
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: 3, // 设置每个卡片的间隔
          }}
        >
          {albums.map((album, index) => (
            <AlbumCard
              key={index}
              album={album}
              loading={loading}
            />
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AlbumsPage;
