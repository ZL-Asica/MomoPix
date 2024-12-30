import { Box } from '@mui/material'
import { styled } from '@mui/material/styles'

const ModalContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '95%',
  maxWidth: 600,
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
}))

const DropzoneContainer = styled(Box, {
  shouldForwardProp: property => property !== 'isDragging',
})<{ isDragging: boolean }>(({ isDragging, theme }) => ({
  border: `2px dashed ${isDragging ? theme.palette.primary.dark : theme.palette.primary.main}`,
  borderRadius: theme.spacing(1),
  padding: isDragging ? theme.spacing(6) : theme.spacing(4), // Increase padding when dragging
  textAlign: 'center',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  backgroundColor: isDragging ? 'rgba(245, 245, 245, 0.5)' : 'transparent', // Add background color when dragging
  transform: isDragging ? 'scale(1.05)' : 'scale(1)',
}))

const PreviewImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  borderRadius: 8,
})

const PreviewContainer = styled(Box)(({ theme }) => ({
  width: 120,
  height: 120,
  border: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  backgroundColor: theme.palette.background.default,
}))

export { DropzoneContainer, ModalContainer, PreviewContainer, PreviewImage }
