import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid2 as Grid,
  Checkbox,
  Pagination,
  MenuItem,
  Select,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import { useToggle } from '@zl-asica/react';
import { toast } from 'sonner';

import { useAuthContext, useUpdateUserData } from '@/hooks';
import { InputDialog } from '@/components';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 30];

const SingleAlbumPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { userData } = useAuthContext();
  const { updateAlbum } = useUpdateUserData();

  // Current album
  const albumName = params.albumName;
  const currentAlbum = userData?.albums.find(
    (album) => album.name === albumName
  );

  // States
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [editingAlbum, toggleEditingAlbum] = useToggle();
  const albumNameInput = currentAlbum?.name || '';

  // Pagination
  const paginatedPhotos =
    currentAlbum?.photos.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ) || [];

  if (!currentAlbum)
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          mt: 10,
        }}
      >
        <Typography
          sx={{ textAlign: 'center' }}
          variant='h4'
          gutterBottom
        >
          不存在的相册
          <br />
          {albumName}
        </Typography>
        <Button
          type='submit'
          variant='contained'
          color='primary'
          sx={{ mt: 2 }}
          onClick={() => navigate('/albums')}
        >
          返回相册列表
        </Button>
      </Box>
    );

  // Handle select photo
  const toggleSelectPhoto = (photoId: string) => {
    setSelectedPhotos((previous) =>
      previous.includes(photoId)
        ? previous.filter((id) => id !== photoId)
        : [...previous, photoId]
    );
  };

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

  const handleSetCover = (photoId: string) => {
    updateAlbum(currentAlbum.name, {
      thumbnail: currentAlbum.photos.find((photo) => photo.id === photoId)?.url,
    });
    console.log(`设置封面: ${photoId}`);
  };

  return (
    <Box
      sx={{
        p: 3,
        flexGrow: 1,
        overflowY: 'auto',
        '& .MuiPagination-ul': {
          justifyContent: 'center',
          margin: '16px 0',
        },
      }}
    >
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

      {/* Edit album dialog */}
      <InputDialog
        open={editingAlbum}
        onClose={toggleEditingAlbum}
        title='编辑相册名称'
        inputLabel='相册名称'
        handleSave={handleSaveAlbum}
        defaultValue={albumNameInput}
      />

      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        <Pagination
          count={Math.ceil(currentAlbum.photos.length / itemsPerPage)}
          page={currentPage}
          onChange={(_, page) => setCurrentPage(page)}
        />
        <Select
          value={itemsPerPage}
          onChange={(event) => setItemsPerPage(Number(event.target.value))}
          size='small'
        >
          {ITEMS_PER_PAGE_OPTIONS.map((option) => (
            <MenuItem
              key={option}
              value={option}
            >
              每页 {option} 张
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Grid
        container
        spacing={2}
      >
        {paginatedPhotos.map((photo) => (
          <Grid
            component='li'
            key={photo.id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: (theme) => theme.shadows[2],
              transition: 'transform 0.2s, box-shadow 0.2s',
              backgroundColor: 'background.paper',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: (theme) => theme.shadows[8],
              },
              '& .photo-preview': {
                width: '100%',
                height: 0,
                paddingTop: '75%', // 保持宽高比 4:3
                position: 'relative',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              },
              '& .photo-info': {
                padding: 2,
                width: '100%',
                textAlign: 'center',
                borderTop: (theme) => `1px solid ${theme.palette.divider}`,
              },
            }}
          >
            <Box
              sx={{
                border: selectedPhotos.includes(photo.id)
                  ? '2px solid #5bcefa'
                  : '1px solid #ddd',
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <Box
                component='img'
                src={photo.url}
                alt={photo.name}
                sx={{
                  width: '100%',
                  height: 150,
                  objectFit: 'cover',
                }}
                onClick={() => navigate(`/album/${albumName}/${photo.id}`)}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 10,
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 0.5,
                }}
              >
                <Checkbox
                  checked={selectedPhotos.includes(photo.id)}
                  onChange={() => toggleSelectPhoto(photo.id)}
                />
              </Box>
              <Typography
                variant='body2'
                sx={{ p: 1, textAlign: 'center', wordBreak: 'break-word' }}
              >
                {photo.name}
              </Typography>
              <Button
                fullWidth
                onClick={() => handleSetCover(photo.id)}
                size='small'
                startIcon={<PhotoLibraryIcon />}
              >
                设置封面
              </Button>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SingleAlbumPage;
