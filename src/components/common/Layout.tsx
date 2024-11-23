import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
        backgroundColor: (theme) => theme.palette.background.default,
      }}
    >
      <Header />
      <Box
        component='main'
        sx={{
          flexGrow: 1,
          py: 4,
          px: 2,
        }}
      >
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;
