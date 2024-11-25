import { useState } from 'react';
import { Menu, MenuItem, IconButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useToggle } from '@zl-asica/react';

import { useUpdateUserData } from '@/hooks';
import { InputDialog, MovePhotoDialog } from '@/components';

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

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [renameDialogOpen, toggleRenameDialog] = useToggle();
  const [openMoveDialog, toggleMoveDialog] = useToggle();

  const setThumbnail = async () => {
    await updateAlbum(albumName, {
      thumbnail: photo.url,
    });
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
          disabled={processing}
        >
          <MoreVertIcon fontSize='small' />
        </IconButton>
      </FloatingIconButton>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
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
      </Menu>
      <InputDialog
        open={renameDialogOpen}
        onClose={toggleRenameDialog}
        title='重命名'
        inputLabel='新图片名称'
        handleSave={(newName: string) => {
          console.log('newName', newName);
        }}
        defaultValue={photo.name}
      />

      <MovePhotoDialog
        albumName={albumName}
        photo={[photo]}
        open={openMoveDialog}
        onClose={toggleMoveDialog}
      />
    </>
  );
};

export default PhotoDropdownMenu;
