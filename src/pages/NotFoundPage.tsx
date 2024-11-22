import { useEffect, useState } from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [timer, setTimer] = useState(10);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((previous) => {
        if (previous <= 1) {
          clearInterval(countdown);
          navigate('/');
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        bgcolor:
          theme.palette.mode === 'dark' ? 'background.default' : '#f9f9f9',
        color: theme.palette.mode === 'dark' ? '#f2d3dc' : '#333',
      }}
    >
      <Typography
        variant='h1'
        sx={{
          fontSize: '4rem',
          mb: 2,
          color: theme.palette.mode === 'dark' ? '#d47a92' : '#ff7597',
        }}
      >
        404 - (；′⌒`) 页面迷路啦~
      </Typography>
      <Typography
        variant='body1'
        sx={{
          fontSize: '1.25rem',
          mb: 3,
        }}
      >
        抱歉，您要找的页面已经不见了，或者它从未存在过 🔍
        <br />
        <Typography
          component='span'
          sx={{
            fontWeight: 'bold',
            color: theme.palette.mode === 'dark' ? '#d47a92' : '#ff7597',
          }}
        >
          {timer}
        </Typography>{' '}
        秒后将自动跳转到首页。
      </Typography>
      <Button
        variant='contained'
        onClick={() => navigate('/')}
        sx={{
          bgcolor: theme.palette.mode === 'dark' ? '#d47a92' : '#ff7597',
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' ? '#c26582' : '#ff93a8',
          },
        }}
      >
        立即跳转
      </Button>
    </Box>
  );
}
