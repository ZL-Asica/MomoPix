import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  DialogActions,
  Button,
} from '@mui/material';

import { useAuthContext, useFileDeleter, useUpdateUserData } from '@/hooks';

interface DeletePhotosDialogProperties {
  albumName: string;
  photos: Photo[];
  open: boolean;
  onClose: () => void;
}

const DeletePhotosDialog = ({
  albumName,
  photos,
  open,
  onClose,
}: DeletePhotosDialogProperties) => {
  const { userData } = useAuthContext();
  const { deletePhotosFromAlbum } = useUpdateUserData();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='sm'
    >
      <DialogTitle>
        {photos.length > 1 ? `删除 ${photos.length} 张照片` : '删除照片'}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant='body2'
          sx={{ mb: 2 }}
        >
          {photos.length > 1
            ? `确定要删除这 ${photos.length} 张照片吗？`
            : `确定要删除 ${photos[0].name} 吗？`}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color='primary'
        >
          取消
        </Button>
        <Button
          onClick={async () => {
            await useFileDeleter(
              userData as UserData,
              albumName,
              photos,
              deletePhotosFromAlbum
            );
            onClose();
          }}
          color='primary'
          variant='contained'
        >
          删除
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeletePhotosDialog;
