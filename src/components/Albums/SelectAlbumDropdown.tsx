import { TextField, MenuItem } from '@mui/material';
import { useToggle } from '@zl-asica/react';

import { useAuthContext } from '@/hooks';

import { CreateNewAlbumModal } from '@/components/Albums';

interface SelectAlbumDropdownProperties {
  selectedAlbum: string;
  setSelectedAlbum: (album: string) => void;
}

const SelectAlbumDropdown = ({
  selectedAlbum,
  setSelectedAlbum,
}: SelectAlbumDropdownProperties) => {
  const { userData } = useAuthContext();
  const albums = userData?.albums || [];
  const [dialogOpen, toggleDialogOpen] = useToggle();

  return (
    <>
      <TextField
        select
        label='选择相簿'
        value={selectedAlbum}
        onChange={(event_) => setSelectedAlbum(event_.target.value)}
        fullWidth
        margin='normal'
      >
        {albums.map((album) => (
          <MenuItem
            key={album.name}
            value={album.name}
          >
            {album.name}
          </MenuItem>
        ))}
        <MenuItem
          value='create-new'
          onClick={toggleDialogOpen}
        >
          新建相簿
        </MenuItem>
      </TextField>

      {/* 新建相簿弹窗 */}
      <CreateNewAlbumModal
        dialogOpen={dialogOpen}
        toggleDialogOpen={toggleDialogOpen}
        setAlbumName={setSelectedAlbum}
      />
    </>
  );
};

export default SelectAlbumDropdown;
