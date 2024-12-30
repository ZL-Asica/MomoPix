import { FloatingIconButton, LazyImage } from '@/components/ui'
import { useAuthStore } from '@/stores'

import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material'

import {
  Card,
  CardContent,
  CardMedia,
  Checkbox,
  Typography,
} from '@mui/material'

import PhotoDropdownMenu from './PhotoDropdownMenu'

interface PhotoCardProperties {
  photo: Photo
  albumName: string
  selected: boolean
  onSelect: () => void
  onClick: () => void
}

function PhotoCard({
  photo,
  albumName,
  selected,
  onSelect,
  onClick,
}: PhotoCardProperties) {
  const localLoading = useAuthStore(state => state.localLoading)

  return (
    <Card
      sx={{
        'display': 'flex',
        'flexDirection': 'column',
        'borderRadius': 2,
        'boxShadow': theme => theme.shadows[2],
        'transition': 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme => theme.shadows[4],
        },
        'width': '100%',
      }}
    >
      <CardMedia
        component="div"
        sx={{
          position: 'relative',
          height: { xs: 160, sm: 180 },
          overflow: 'hidden',
        }}
      >
        <LazyImage
          src={photo.url}
          alt={photo.name}
          onClick={onClick}
        />

        <FloatingIconButton
          onClick={onSelect}
          disabled={localLoading.photoActions}
        >
          <Checkbox
            checked={selected}
            icon={<CheckBoxOutlineBlank fontSize="small" />}
            checkedIcon={<CheckBox fontSize="small" />}
            sx={{ p: 0 }}
            disabled={localLoading.photoActions}
          />
        </FloatingIconButton>

        <PhotoDropdownMenu
          albumName={albumName}
          photo={photo}
        />
      </CardMedia>

      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            wordBreak: 'break-word',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          }}
        >
          {photo.name}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default PhotoCard
