import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ModalHeaderProperties {
  title: string;
  onClose: () => void;
}

const ModalHeader = ({ title, onClose }: ModalHeaderProperties) => (
  <Box
    display='flex'
    justifyContent='space-between'
    alignItems='center'
    mb={2}
  >
    <Typography
      id='upload-modal-title'
      variant='h6'
    >
      {title}
    </Typography>
    <IconButton onClick={onClose}>
      <CloseIcon />
    </IconButton>
  </Box>
);

export default ModalHeader;
