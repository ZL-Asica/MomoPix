import { Box, IconButton, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import { PreviewContainer, PreviewImage } from './styles';

interface FilePreviewProperties {
  file: File;
  name: string;
  onDelete: () => void;
  onRename: (newName: string) => void;
}

const FilePreview = ({
  file,
  name,
  onDelete,
  onRename,
}: FilePreviewProperties) => (
  <Box position='relative'>
    <PreviewContainer>
      <PreviewImage
        src={URL.createObjectURL(file)}
        alt={name}
      />
    </PreviewContainer>
    <TextField
      fullWidth
      value={name.split('.').slice(0, -1).join('.')}
      onChange={(event) => onRename(event.target.value)}
      variant='standard'
      size='small'
      sx={{ mt: 1 }}
    />
    <IconButton
      size='small'
      color='error'
      onClick={onDelete}
      sx={{
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255,255,255,0.8)',
      }}
    >
      <DeleteIcon />
    </IconButton>
  </Box>
);

export default FilePreview;
