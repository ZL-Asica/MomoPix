import { useState } from 'react';
import {
  Button,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  CircularProgress,
} from '@mui/material';
import MoveIcon from '@mui/icons-material/SwapHoriz';
import { useToggle } from '@zl-asica/react';

import { useAuthContext, useUpdateUserData } from '@/hooks';

interface MovePhotoDialogProperties {
  albumName: string;
  photo: Photo;
  onClose: () => void;
}

const MovePhotoDialog = ({
  albumName,
  photo,
  onClose,
}: MovePhotoDialogProperties) => {
  const { movePhoto, processing } = useUpdateUserData();
  const [open, toggleOpen] = useToggle();
  const [targetAlbum, setTargetAlbum] = useState<string>('');

  // Fetch user's album list dynamically (exclude current album)
  const { userData } = useAuthContext();

  const albums =
    userData?.albums.filter((album: Album) => album.name !== albumName) || [];

  const handleMovePhoto = async () => {
    // Prevent moving if no album is selected
    if (!targetAlbum) return;
    await movePhoto(albumName, targetAlbum, photo.id);
    toggleOpen(); // Close the dialog
    onClose(); // Close the modal
  };

  return (
    <>
      {/* Trigger to open the move dialog */}
      <IconButton
        size='large'
        color='primary'
        onClick={toggleOpen}
        aria-label='Move photo'
      >
        <MoveIcon />
      </IconButton>

      {/* Move Photo Dialog */}
      <Dialog
        open={open}
        onClose={toggleOpen}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>移动照片</DialogTitle>
        <DialogContent>
          <Typography
            variant='body2'
            sx={{ mb: 2 }}
          >
            选择目标相册以移动照片：
          </Typography>
          <Select
            value={targetAlbum}
            onChange={(event_) => setTargetAlbum(event_.target.value)}
            fullWidth
            displayEmpty
          >
            <MenuItem
              value=''
              disabled
            >
              选择相册
            </MenuItem>
            {albums.map((album) => (
              <MenuItem
                key={album.name}
                value={album.name}
              >
                {album.name}
              </MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={toggleOpen}
            color='secondary'
            disabled={processing}
          >
            取消
          </Button>
          <Button
            onClick={handleMovePhoto}
            color='primary'
            disabled={processing || !targetAlbum}
            startIcon={processing && <CircularProgress size={16} />}
          >
            移动
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MovePhotoDialog;
