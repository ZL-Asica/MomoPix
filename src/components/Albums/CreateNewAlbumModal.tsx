import { useUpdateUserData } from '@/hooks';
import { InputDialog } from '@/components';

interface CreateNewAlbumModalProperties {
  dialogOpen: boolean;
  toggleDialogOpen: () => void;
  setAlbumName?: (albumName: string) => void;
}

const CreateNewAlbumModal = ({
  dialogOpen,
  toggleDialogOpen,
  setAlbumName,
}: CreateNewAlbumModalProperties) => {
  const { addAlbum } = useUpdateUserData();
  const handleAddAlbum = async (albumName: string) => {
    await addAlbum(albumName);
    setAlbumName?.(albumName);
  };
  return (
    <InputDialog
      open={dialogOpen}
      onClose={toggleDialogOpen}
      title='新建相册'
      inputLabel='相册名称'
      handleSave={handleAddAlbum}
    />
  );
};

export default CreateNewAlbumModal;
