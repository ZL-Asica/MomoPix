import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid2 as Grid,
  Link,
  Divider,
} from '@mui/material';

import { useUpdateUserData } from '@/hooks';
import { useAuthStore } from '@/stores';

const Profile = () => {
  const userData = useAuthStore((state) => state.userData);
  const { updateBasicInfo, processing } = useUpdateUserData();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userData?.displayName || '');

  // Stats
  const stats = useMemo(() => {
    if (!userData)
      return { albums: 0, photos: 0, totalSize: 0, oldest: null, newest: null };

    const albums = userData.albums.length;
    const photos = userData.albums.reduce(
      (count, album) => count + album.photos.length,
      0
    );
    const totalSize = userData.albums.reduce(
      (size, album) =>
        size + album.photos.reduce((sum, photo) => sum + photo.size, 0),
      0
    );

    const allPhotos = userData.albums.flatMap((album) => album.photos);
    let oldest = null;
    let newest = null;

    for (const photo of allPhotos) {
      if (!oldest || photo.uploadedAt < oldest.uploadedAt) {
        oldest = photo;
      }
      if (!newest || photo.uploadedAt > newest.uploadedAt) {
        newest = photo;
      }
    }

    return { albums, photos, totalSize, oldest, newest };
  }, [userData]);

  const handleSave = async () => {
    await updateBasicInfo({ displayName });
    setEditing(false);
  };

  return (
    <Box
      maxWidth={600}
      mx='auto'
      px={3}
      py={5}
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: (theme) => theme.shadows[3],
      }}
    >
      <Typography
        variant='h4'
        align='center'
        gutterBottom
        sx={{ fontWeight: 700 }}
      >
        个人资料
      </Typography>

      <Grid
        container
        spacing={3}
        alignItems='center'
        justifyContent='center'
      >
        <Grid
          component='label'
          size={{ xs: 12, sm: 4 }}
        >
          <Box
            display='flex'
            justifyContent='center'
          >
            <Avatar
              src={userData?.photoURL || ''}
              alt={displayName}
              sx={{ width: 120, height: 120 }}
            />
          </Box>
        </Grid>

        <Grid
          component='label'
          size={{ xs: 12, sm: 8 }}
        >
          {editing ? (
            <TextField
              label='昵称'
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              fullWidth
              variant='outlined'
            />
          ) : (
            <Box
              display='flex'
              sx={{
                flexDirection: 'column',
                alignItems: { xs: 'center', sm: 'flex-start' },
              }}
            >
              <Typography
                variant='h6'
                sx={{ fontWeight: 600 }}
              >
                {displayName || '暂未设置昵称'}
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
              >
                {userData?.email}
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ mt: 1 }}
              >
                修改头像请前往{' '}
                <Link
                  href='https://gravatar.com/'
                  target='_blank'
                  rel='noopener noreferrer'
                  underline='hover'
                  color='primary'
                  sx={{
                    fontWeight: 500,
                  }}
                >
                  Gravatar
                </Link>
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box
        px={5}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Typography
          variant='h6'
          sx={{ mb: 2 }}
        >
          数据统计
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant='body2'>
            <strong>总相册数：</strong> {stats.albums}
          </Typography>
          <Typography variant='body2'>
            <strong>总照片数：</strong> {stats.photos}
          </Typography>
          <Typography variant='body2'>
            <strong>照片总大小：</strong>{' '}
            {(stats.totalSize / 1024 / 1024).toFixed(2)} MB
          </Typography>
          {stats.oldest && (
            <Typography variant='body2'>
              <strong>最早上传时间：</strong>{' '}
              {new Date(stats.oldest.uploadedAt).toLocaleString()}
            </Typography>
          )}
          {stats.newest && (
            <Typography variant='body2'>
              <strong>最近上传时间：</strong>{' '}
              {new Date(stats.newest.uploadedAt).toLocaleString()}
            </Typography>
          )}
        </Box>
      </Box>

      <Box
        display='flex'
        justifyContent='center'
        gap={2}
        mt={4}
      >
        {editing ? (
          <>
            <Button
              variant='contained'
              color='primary'
              onClick={handleSave}
              disabled={processing}
            >
              {processing ? '保存中...' : '保存'}
            </Button>
            <Button
              variant='outlined'
              color='secondary'
              onClick={() => setEditing(false)}
            >
              取消
            </Button>
          </>
        ) : (
          <Button
            variant='outlined'
            onClick={() => setEditing(true)}
          >
            编辑个人资料
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default Profile;
