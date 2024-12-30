import CloseIcon from '@mui/icons-material/Close'
import { Box, IconButton, Typography } from '@mui/material'

interface ModalHeaderProperties {
  title: string
  onClose: () => void
}

function ModalHeader({ title, onClose }: ModalHeaderProperties) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      mb={2}
    >
      <Typography
        id="upload-modal-title"
        variant="h6"
      >
        {title}
      </Typography>
      <IconButton onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </Box>
  )
}

export default ModalHeader
