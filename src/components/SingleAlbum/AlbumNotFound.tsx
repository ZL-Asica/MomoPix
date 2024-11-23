import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface AlbumNotFoundProperties {
  albumName: string;
}

const AlbumNotFound = ({ albumName }: AlbumNotFoundProperties) => {
  const navigate = useNavigate();
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
};

export default AlbumNotFound;
