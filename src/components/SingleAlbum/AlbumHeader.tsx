import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Tooltip } from '@mui/material';
import {
  PhotoLibrary as PhotoLibraryIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { useToggle } from '@zl-asica/react';

import { UploadModal, InputDialog } from '@/components';
import { useUpdateUserData } from '@/hooks';

interface AlbumHeaderProperties {
  currentAlbum: Album;
}

const AlbumHeader = ({ currentAlbum }: AlbumHeaderProperties) => {
  const navigate = useNavigate();
  const { updateAlbum } = useUpdateUserData();

  const albumNameInput = currentAlbum?.name || '';
  const [editingAlbum, toggleEditingAlbum] = useToggle();
  const [uploadModalOpen, toggleUploadModalOpen] = useToggle();

  const handleSaveAlbum = async (newName: string) => {
    try {
      await updateAlbum(currentAlbum.name, { name: newName });
      navigate(`/album/${newName}`);
      toast.success('更新相册名称成功');
    } catch (error) {
      console.error('Failed to update album', error);
      toast.error('更新相册名称失败');
    }
  };

  return (
    <>
      <Box
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        mb={4}
      >
        <Box>
          <Typography
            variant='h4'
            gutterBottom
          >
            {currentAlbum.name}
          </Typography>
          <Typography
            variant='body2'
            color='textSecondary'
          >
            照片数量: {currentAlbum.photos.length || 0}
            <br />
            创建时间: {new Date(currentAlbum.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexDirection: 'column',
          }}
        >
          <Tooltip title={`上传到 ${currentAlbum.name}`}>
            <Button
              startIcon={<PhotoLibraryIcon />}
              variant='contained'
              color='primary'
              onClick={toggleUploadModalOpen}
            >
              上传到此相册
            </Button>
          </Tooltip>

          <Tooltip
            title={
              currentAlbum.name === 'default'
                ? '默认相册名称不可编辑'
                : '编辑相册名称'
            }
          >
            <span>
              <Button
                startIcon={<EditIcon />}
                variant='outlined'
                onClick={toggleEditingAlbum}
                disabled={currentAlbum.name === 'default'}
              >
                编辑相册名称
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Edit album dialog */}
      <InputDialog
        open={editingAlbum}
        onClose={toggleEditingAlbum}
        title='编辑相册名称'
        inputLabel='相册名称'
        handleSave={handleSaveAlbum}
        defaultValue={albumNameInput}
      />

      {/* Upload Modal */}
      <UploadModal
        open={uploadModalOpen}
        onClose={toggleUploadModalOpen}
        targetAlbum={currentAlbum.name}
      />
    </>
  );
};

export default AlbumHeader;
