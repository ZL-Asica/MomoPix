import { Menu, MenuItem, IconButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useState } from 'react';
import { useToggle } from '@zl-asica/react';

import { copyPhotoLinks } from '@/utils';
import { MovePhotoDialog } from '@/components';

interface BulkActionMenuProperties {
  albumName: string;
  selectedItems: Photo[];
}

const BulkActionMenu = ({
  albumName,
  selectedItems,
}: BulkActionMenuProperties) => {
  const [openMoveDialog, toggleMoveDialog] = useToggle();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  return (
    <>
      <IconButton
        onClick={handleMenuOpen}
        aria-label='Bulk actions'
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClick={handleMenuClose}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={toggleMoveDialog}>一键移动</MenuItem>
        <MenuItem
          onClick={async () => await copyPhotoLinks(selectedItems, 'direct')}
        >
          复制图片链接
        </MenuItem>
        <MenuItem
          onClick={async () => await copyPhotoLinks(selectedItems, 'html')}
        >
          复制 HTML
        </MenuItem>
        <MenuItem
          onClick={async () => await copyPhotoLinks(selectedItems, 'markdown')}
        >
          复制 Markdown
        </MenuItem>
        <MenuItem
          onClick={async () => await copyPhotoLinks(selectedItems, 'bbcode')}
        >
          复制 BBCode
        </MenuItem>
      </Menu>

      <MovePhotoDialog
        albumName={albumName}
        photo={selectedItems}
        open={openMoveDialog}
        onClose={toggleMoveDialog}
      />
    </>
  );
};

export default BulkActionMenu;
