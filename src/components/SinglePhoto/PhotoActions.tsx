import { Box, Typography, Button, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import MoveIcon from '@mui/icons-material/SwapHoriz';

const PhotoActions = ({ photo }: { photo: Photo }) => {
  const handleEdit = () => {
    console.log('Edit photo:', photo.name);
  };

  const handleMove = () => {
    console.log('Move photo:', photo.name);
  };

  return (
    <Box
      display='flex'
      justifyContent='space-between'
      alignItems='center'
      mt={2}
    >
      <Typography variant='h6'>{photo.name}</Typography>
      <Stack
        direction='column'
        spacing={1}
      >
        <Button
          variant='outlined'
          startIcon={<EditIcon />}
          onClick={handleEdit}
        >
          编辑
        </Button>
        <Button
          variant='outlined'
          startIcon={<MoveIcon />}
          onClick={handleMove}
        >
          移动
        </Button>
      </Stack>
    </Box>
  );
};

export default PhotoActions;
