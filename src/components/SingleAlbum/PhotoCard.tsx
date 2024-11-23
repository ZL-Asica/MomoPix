import {
  Box,
  Checkbox,
  Grid2 as Grid,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  CheckBoxOutlineBlank,
  CheckBox,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useUpdateUserData } from '@/hooks';

interface PhotoCardProperties {
  photo: Photo;
  albumName: string;
  selected: boolean;
  onSelect: () => void;
}

const PhotoCard = ({
  photo,
  albumName,
  selected,
  onSelect,
}: PhotoCardProperties) => {
  const navigate = useNavigate();
  const { updateAlbum } = useUpdateUserData();

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const setThumbnail = async () => {
    try {
      await updateAlbum(albumName, {
        thumbnail: photo.url,
      });
      toast.success(`已将 ${photo.name} 设置为封面`);
      handleMenuClose();
    } catch (error) {
      console.error('Failed to set thumbnail', error);
      toast.error('设置封面失败');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  return (
    <Grid
      component='li'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: (theme) => theme.shadows[2],
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: (theme) => theme.shadows[6],
        },
      }}
    >
      {/* 图片部分 */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: 120, sm: 160, md: 200 },
        }}
      >
        <Box
          component='img'
          src={photo.url}
          alt={photo.name}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            cursor: 'pointer',
          }}
          onClick={() => navigate(`/album/${albumName}/${photo.id}`)}
        />

        {/* 复选框 */}
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
            width: 32,
            height: 32,
          }}
        >
          <Checkbox
            checked={selected}
            onChange={onSelect}
            icon={<CheckBoxOutlineBlank fontSize='small' />}
            checkedIcon={<CheckBox fontSize='small' />}
            sx={{
              p: 0, // 去除多余内边距
            }}
          />
        </Box>

        {/* Dropdown Menu Icon */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
          }}
        >
          <IconButton
            aria-label='options'
            onClick={handleMenuOpen}
            size='small'
            sx={{
              p: 0,
            }}
          >
            <MoreVertIcon fontSize='small' />
          </IconButton>
        </Box>
      </Box>

      {/* Dropdown Menu Content */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={setThumbnail}>设置封面</MenuItem>
        <MenuItem
          onClick={() => {
            console.log(`操作：${photo.name}`);
            handleMenuClose();
          }}
        >
          其他操作
        </MenuItem>
      </Menu>

      {/* Picture Name */}
      <Typography
        variant='body2'
        sx={{
          p: 1,
          textAlign: 'center',
          wordBreak: 'break-word',
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
        }}
      >
        {photo.name}
      </Typography>
    </Grid>
  );
};

export default PhotoCard;
