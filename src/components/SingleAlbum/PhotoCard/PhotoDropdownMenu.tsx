import { useState } from 'react';
import { Menu, MenuItem, IconButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useToggle } from '@zl-asica/react';

import { useUpdateUserData } from '@/hooks';
import { updateImages } from '@/utils';
import { InputDialog, MovePhotoDialog, DeletePhotosDialog } from '@/components';
import { useAuthStore } from '@/stores';

import { FloatingIconButton } from '@/components/ui';

interface PhotoDropdownMenuProperties {
  albumName: string;
  photo: Photo;
}

const PhotoDropdownMenu = ({
  albumName,
  photo,
}: PhotoDropdownMenuProperties) => {
  const { updateAlbum, processing } = useUpdateUserData();
  const setAuthState = useAuthStore((state) => state.setAuthState);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [renameDialogOpen, toggleRenameDialog] = useToggle();
  const [openMoveDialog, toggleMoveDialog] = useToggle();
  const [openDeleteDialog, toggleDeleteDialog] = useToggle();
  const [loading, setLoading] = useState<boolean>(false);

  const setThumbnail = async () => {
    await updateAlbum(albumName, {
      thumbnail: photo.url,
    });
    handleMenuClose();
  };

  const renamePhoto = async (newName: string) => {
    const response_ = await updateImages(
      albumName,
      photo.id,
      newName,
      setLoading
    );
    if (response_) {
      setAuthState(response_);
    }
    handleMenuClose();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  return (
    <>
      <FloatingIconButton
        onClick={handleMenuOpen}
        position={{ top: 8, left: 8 }}
        size={36}
      >
        <IconButton
          aria-label='options'
          onClick={handleMenuOpen}
          size='small'
          sx={{ p: 0 }}
          disabled={processing || loading}
        >
          <MoreVertIcon fontSize='small' />
        </IconButton>
      </FloatingIconButton>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={setThumbnail}
          disabled={processing}
        >
          设置封面
        </MenuItem>
        <MenuItem
          onClick={toggleRenameDialog}
          disabled={processing}
        >
          重命名
        </MenuItem>
        <MenuItem
          onClick={toggleMoveDialog}
          disabled={processing}
        >
          移动
        </MenuItem>
        <MenuItem
          onClick={toggleDeleteDialog}
          disabled={processing}
        >
          删除
        </MenuItem>
      </Menu>
      <InputDialog
        open={renameDialogOpen}
        onClose={toggleRenameDialog}
        title='重命名'
        inputLabel='新图片名称'
        handleSave={(newName: string) => renamePhoto(newName)}
        defaultValue={photo.name}
      />

      <MovePhotoDialog
        albumName={albumName}
        photo={[photo]}
        open={openMoveDialog}
        onClose={toggleMoveDialog}
      />

      <DeletePhotosDialog
        albumName={albumName}
        photos={[photo]}
        open={openDeleteDialog}
        onClose={toggleDeleteDialog}
      />
    </>
  );
};

export default PhotoDropdownMenu;
