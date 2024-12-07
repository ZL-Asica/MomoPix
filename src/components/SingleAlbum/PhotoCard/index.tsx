import { Box, Checkbox, Grid2 as Grid, Typography } from '@mui/material';
import { CheckBoxOutlineBlank, CheckBox } from '@mui/icons-material';

import PhotoDropdownMenu from './PhotoDropdownMenu';

import { useAuthStore } from '@/stores';

import { FloatingIconButton, LazyImage } from '@/components/ui';

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
  const localLoading = useAuthStore((state) => state.localLoading);

  return (
    <Grid
      id={id}
      component='li'
      size={{ xs: 6, sm: 4, md: 3, lg: 2 }}
      sx={(theme) => ({
        aspectRatio: '1 / 1.2',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
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
          paddingTop: '100%', // 1:1 Aspect Ratio. Some browsers don't support aspect-ratio yet.
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <LazyImage
          src={photo.url}
          alt={photo.name}
          onClick={onClick}
        />

        {/* Checkbox */}
        <FloatingIconButton
          onClick={onSelect}
          disabled={localLoading['photoActions']}
        >
          <Checkbox
            checked={selected}
            icon={<CheckBoxOutlineBlank fontSize='small' />}
            checkedIcon={<CheckBox fontSize='small' />}
            sx={{ p: 0 }}
            disabled={localLoading['photoActions']}
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
