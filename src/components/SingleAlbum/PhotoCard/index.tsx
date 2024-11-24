import { Box, Checkbox, Grid2 as Grid, Typography } from '@mui/material';
import { CheckBoxOutlineBlank, CheckBox } from '@mui/icons-material';

import PhotoDropdownMenu from './PhotoDropdownMenu';

import { useUpdateUserData } from '@/hooks';

interface PhotoCardProperties {
  photo: Photo;
  albumName: string;
  selected: boolean;
  onSelect: () => void;
  onClick: () => void;
}

const PhotoCard = ({
  photo,
  albumName,
  selected,
  onSelect,
  onClick,
}: PhotoCardProperties) => {
  const { processing } = useUpdateUserData();

  return (
    <Grid
      component='li'
      sx={(theme) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: theme.shadows[2],
        transition: 'box-shadow 0.2s, transform 0.2s',
        [theme.breakpoints.up('md')]: {
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: theme.shadows[6],
          },
        },
      })}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: 120, sm: 160, md: 200 },
        }}
      >
        <Box
          component='img'
          src={photo.url}
          alt={photo.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            cursor: 'pointer',
            opacity: processing ? 0.5 : 1,
            pointerEvents: processing ? 'none' : 'auto',
          }}
          onClick={onClick}
        />

        {/* Checkbox */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
          }}
        >
          <Checkbox
            checked={selected}
            onChange={onSelect}
            icon={<CheckBoxOutlineBlank fontSize='small' />}
            checkedIcon={<CheckBox fontSize='small' />}
            sx={{ p: 0 }}
            disabled={processing}
          />
        </Box>

        {/* Dropdown Menu Icon */}

        <PhotoDropdownMenu
          albumName={albumName}
          photo={photo}
        />
      </Box>

      {/* Picture Name */}
      <Typography
        variant='body2'
        sx={{
          p: 1,
          textAlign: 'center',
          wordBreak: 'break-word',
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
        }}
      >
        {photo.name}
      </Typography>
    </Grid>
  );
};

export default PhotoCard;
