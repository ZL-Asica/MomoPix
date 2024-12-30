import CloseIcon from '@mui/icons-material/Close'
import { Box, Divider, IconButton, Modal } from '@mui/material'

import CopyableLinks from './CopyableLinks'
import ImageDisplay from './ImageDisplay'
import PhotoInfoAndActions from './PhotoActions'

interface SinglePhotoModalProperties {
  albumName: string | null
  photo: Photo | null
  onClose: () => void
}

function SinglePhotoModal({
  albumName,
  photo,
  onClose,
}: SinglePhotoModalProperties) {
  if (albumName === null || photo === null)
    return null

  return (
    <Modal
      open={Boolean(photo)}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 1, sm: 3 },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          maxWidth: { xs: '100%', md: '80%' },
          maxHeight: '90vh',
          width: '100%',
          overflow: 'hidden',
          backgroundColor: 'background.paper',
          borderRadius: { xs: 0, sm: 3 },
          boxShadow: theme => theme.shadows[5],
        }}
      >
        {/* Close button */}
        <IconButton
          onClick={onClose}
          sx={{
            'position': 'absolute',
            'top': 16,
            'right': 16,
            'zIndex': 10,
            'backgroundColor': 'rgba(0, 0, 0, 0.4)',
            'color': '#fff',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 2, md: 4 },
            p: { xs: 2, md: 4 },
            overflow: 'auto',
            maxHeight: 'calc(90vh - 32px)',
          }}
        >
          <ImageDisplay url={photo.url} alt={photo.name} />

          {/* Right side */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <PhotoInfoAndActions albumName={albumName} photo={photo} />

            <Divider sx={{ my: 2 }} />

            <CopyableLinks photo={photo} />
          </Box>
        </Box>
      </Box>
    </Modal>
  )
}

export default SinglePhotoModal
