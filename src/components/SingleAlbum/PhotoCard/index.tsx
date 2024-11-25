import { Box, Checkbox, Grid2 as Grid, Typography } from '@mui/material';
import { CheckBoxOutlineBlank, CheckBox } from '@mui/icons-material';

import PhotoDropdownMenu from './PhotoDropdownMenu';

import { useUpdateUserData } from '@/hooks';

import { FloatingIconButton } from '@/components/ui';

interface PhotoCardProperties {
  id: string;
  photo: Photo;
  albumName: string;
  selected: boolean;
  onSelect: () => void;
  onClick: () => void;
}

const PhotoCard = ({
  id,
  photo,
  albumName,
  selected,
  onSelect,
  onClick,
}: PhotoCardProperties) => {
  const { processing } = useUpdateUserData();

  return (
    <Grid
      id={id}
      component='li'
      size={{ xs: 6, sm: 4, md: 3, lg: 2 }}
      sx={(theme) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
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
          aspectRatio: '1 / 1',
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
        <FloatingIconButton
          onClick={onSelect}
          disabled={processing}
        >
          <Checkbox
            checked={selected}
            icon={<CheckBoxOutlineBlank fontSize='small' />}
            checkedIcon={<CheckBox fontSize='small' />}
            sx={{ p: 0 }}
            disabled={processing}
          />
        </FloatingIconButton>

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
