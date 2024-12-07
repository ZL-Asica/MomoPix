import { useState } from 'react';
import { Box, IconButton, Typography, TextField, Tooltip } from '@mui/material';
import MoveIcon from '@mui/icons-material/SwapHoriz';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Close';
import { useToggle } from '@zl-asica/react';

import { MovePhotoDialog } from '@/components';
import { updateImages } from '@/utils';
import { useAuthStore } from '@/stores';

interface PhotoInfoAndActionsProperties {
  albumName: string;
  photo: Photo;
}

const PhotoInfoAndActions = ({
  albumName,
  photo,
}: PhotoInfoAndActionsProperties) => {
  const setAuthState = useAuthStore((state) => state.setAuthState);
  const [photoName, setPhotoName] = useState(photo.name);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedName, setUpdatedName] = useState(photo.name);
  const [openMoveDialog, toggleMoveDialog] = useToggle();
  const [loading, setLoading] = useState<boolean>(false);

  const handleSaveName = async () => {
    if (updatedName !== photo.name) {
      const response_ = await updateImages(
        albumName,
        photo.id,
        updatedName,
        setLoading
      );
      if (response_) {
        setAuthState(response_);
      }

      setIsEditing(false);
      setPhotoName(updatedName);
    }
  };

  const handleCancelEdit = () => {
    setUpdatedName(photo.name);
    setIsEditing(false);
  };

  const photoSize =
    photo.size < 1024 * 1024
      ? `${(photo.size / 1024).toFixed(2)} KB`
      : `${(photo.size / 1024 / 1024).toFixed(2)} MB`;

  return (
    <>
      <Box
        display='flex'
        flexDirection='row'
        justifyContent='space-between'
        alignItems='center'
        gap={2}
        sx={{
          mr: { xs: 0, sm: 2, md: 3 },
        }}
      >
        {/* Name with edit functionality */}
        <Box
          display='flex'
          alignItems='center'
          gap={1}
          width='100%'
        >
          {isEditing ? (
            <>
              <TextField
                value={updatedName}
                onChange={(event_) => setUpdatedName(event_.target.value)}
                size='small'
                variant='outlined'
                sx={{
                  flexGrow: 1,
                }}
              />
              <Tooltip title='保存'>
                <IconButton
                  size='small'
                  color='primary'
                  onClick={handleSaveName}
                  disabled={loading}
                >
                  <SaveIcon fontSize='small' />
                </IconButton>
              </Tooltip>
              <Tooltip title='取消'>
                <IconButton
                  size='small'
                  color='secondary'
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  <CancelIcon fontSize='small' />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <Typography
                variant='h6'
                sx={{
                  wordBreak: 'break-word',
                }}
              >
                {photoName}
              </Typography>
              <Tooltip title='编辑名称'>
                <IconButton
                  size='small'
                  color='primary'
                  onClick={() => setIsEditing(true)}
                >
                  <EditIcon fontSize='small' />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
        <Tooltip title='移动照片'>
          <IconButton
            size='large'
            color='primary'
            onClick={toggleMoveDialog}
            aria-label='Move photo'
          >
            <MoveIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Metadata */}
      <Typography
        variant='body2'
        color='text.secondary'
      >
        上传时间：{new Date(photo.uploadedAt).toLocaleString()}
      </Typography>
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ mt: 1 }}
      >
        文件大小：{photoSize}
      </Typography>

      <MovePhotoDialog
        albumName={albumName}
        photo={[photo]}
        open={openMoveDialog}
        onClose={toggleMoveDialog}
      />
    </>
  );
};

export default PhotoInfoAndActions;
