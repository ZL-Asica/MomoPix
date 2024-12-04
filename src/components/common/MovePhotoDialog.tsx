import { useState } from 'react';
import {
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  CircularProgress,
} from '@mui/material';

import { useUpdateUserData } from '@/hooks';
import { useAuthStore } from '@/stores';

interface MovePhotoDialogProperties {
  albumName: string;
  photo: Photo[];
  open: boolean;
  onClose: () => void;
}

const MovePhotoDialog = ({
  albumName,
  photo,
  open,
  onClose,
}: MovePhotoDialogProperties) => {
  const { movePhoto, processing } = useUpdateUserData();
  const [targetAlbum, setTargetAlbum] = useState<string>('');

  // Fetch user's album list dynamically (exclude current album)
  const userData = useAuthStore((state) => state.userData);
  const albums =
    userData?.albums.filter((album: Album) => album.name !== albumName) || [];

  const handleMovePhoto = async () => {
    // Prevent moving if no album is selected
    if (!targetAlbum) return;
    await Promise.all(
      photo.map((photo) => movePhoto(albumName, targetAlbum, photo.id))
    );
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='sm'
    >
      <DialogTitle>
        {photo.length > 1 ? `移动 ${photo.length} 张照片` : '移动照片'}
      </DialogTitle>
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
          onClick={onClose}
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
  );
};

export default MovePhotoDialog;
