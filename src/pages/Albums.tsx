import { Box, Grid2 as Grid, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { useToggle } from '@zl-asica/react';
import { toast } from 'sonner';

import { useAuthContext, useUpdateUserData } from '@/hooks';
import { InputDialog } from '@/components';

import { AlbumCard } from '@/components/Albums';

const AlbumsPage = () => {
  const { userData } = useAuthContext();
  const { addAlbum } = useUpdateUserData();

  const navigate = useNavigate();

  const [dialogOpen, toggleDialogOpen] = useToggle();

  const albums = userData?.albums || [];

  const handleAddAlbum = async (albumName: string) => {
    try {
      await addAlbum(albumName);
    } catch (error) {
      console.error('Failed to create album', error);
      toast.error('Failed to create album');
    }
  };

  if (!userData) navigate('/');

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

      {/* Create album button */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        marginBottom={3}
      >
        <Typography
          variant='subtitle1'
          color='textSecondary'
        >
          共 {albums.length} 个相册
        </Typography>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={toggleDialogOpen}
        >
          新建相册
        </Button>
      </Box>

      {/* album cards list */}
      <Grid
        container
        spacing={3}
        sx={{
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        {albums.map((album, index) => (
          <AlbumCard
            key={index}
            album={album}
          />
        ))}
      </Grid>

      {/* 新建相册弹窗 */}
      <InputDialog
        open={dialogOpen}
        onClose={toggleDialogOpen}
        title='新建相册'
        inputLabel='相册名称'
        handleSave={handleAddAlbum}
      />
    </Box>
  );
};

export default AlbumsPage;
