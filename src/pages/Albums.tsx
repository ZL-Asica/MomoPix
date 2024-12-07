import { Box, Grid2 as Grid, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { useToggle } from '@zl-asica/react';

import { useAuthStore } from '@/stores';

import { AlbumCard, CreateNewAlbumModal } from '@/components/Albums';

const AlbumsPage = () => {
  const userData = useAuthStore((state) => state.userData);
  const navigate = useNavigate();

  const [dialogOpen, toggleDialogOpen] = useToggle();

  const albums = userData?.albums || [];

  if (!userData) navigate('/');

  return (
    <Box
      mx='auto'
      px={2}
      py={4}
    >
      {/* Page Title */}
      <Typography
        variant='h4'
        align='center'
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: (theme) => theme.palette.primary.main,
        }}
      >
        我的相簿
      </Typography>

      {/* Create album button */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        marginBottom={3}
        sx={{
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography
          variant='subtitle1'
          color='text.secondary'
        >
          共 {albums.length} 个相簿
        </Typography>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={toggleDialogOpen}
          sx={{
            borderRadius: 4,
            paddingX: 3,
            textTransform: 'none',
          }}
        >
          新建相簿
        </Button>
      </Box>

      {/* Albums list */}
      <Grid
        container
        spacing={3}
        sx={{
          justifyContent: { xs: 'center', md: 'flex-start' },
        }}
      >
        {albums.map((album, index) => (
          <AlbumCard
            key={index}
            album={album}
          />
        ))}
      </Grid>

      {/* Create Album Modal */}
      <CreateNewAlbumModal
        dialogOpen={dialogOpen}
        toggleDialogOpen={toggleDialogOpen}
      />
    </Box>
  );
};

export default AlbumsPage;
