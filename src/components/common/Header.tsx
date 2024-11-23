import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AccountBox as AccountBoxIcon,
  CloudUpload as CloudUploadIcon,
  PhotoAlbum as PhotoAlbumIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Menu,
  MenuItem,
  IconButton,
  Avatar,
  Skeleton,
} from '@mui/material';
import { useClickOutside, useToggle } from '@zl-asica/react';

import { UploadModal } from '@/components';
import { useAuthContext, useAuth } from '@/hooks';

const Header = () => {
  const { loading, userData } = useAuthContext();
  const { logout } = useAuth();
  const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(null);
  const [uploadModalOpen, toggleUploadModalOpen] = useToggle();
  const menuReference = useRef(null);
  const location = useLocation();

  useClickOutside(menuReference, () => {
    setAnchorElement(null);
  });

  useEffect(() => {
    setAnchorElement(null);
  }, [location]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElement(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorElement(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const handleUploadModalOpen = () => {
    toggleUploadModalOpen();
    handleMenuClose();
  };

  return (
    <AppBar
      position='static'
      color='primary'
      sx={{ mb: 2 }}
    >
      <Toolbar>
        {/* App Title */}
        <Typography
          variant='h6'
          component='div'
          sx={{ flexGrow: 1 }}
        >
          <Link
            to='/'
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            MomoPix
          </Link>
        </Typography>

        {/* User Actions */}
        <Box
          display='flex'
          alignItems='center'
          gap={1.5}
        >
          {userData && (
            <>
              <IconButton
                size='large'
                color='inherit'
                component={Link}
                to='/albums'
                sx={{
                  transition: '0.2s',
                  '&:hover': { color: 'secondary.main' },
                }}
              >
                <PhotoAlbumIcon />
              </IconButton>
              <IconButton
                size='large'
                color='inherit'
                onClick={handleUploadModalOpen}
                sx={{
                  transition: '0.2s',
                  '&:hover': { color: 'secondary.main' },
                }}
              >
                <CloudUploadIcon />
              </IconButton>
            </>
          )}
          <IconButton
            size='large'
            color='inherit'
            aria-controls='menu-appbar'
            aria-haspopup='true'
            onClick={handleMenuOpen}
            sx={{ transition: '0.2s', '&:hover': { color: 'secondary.main' } }}
          >
            {loading ? (
              <Skeleton
                variant='circular'
                animation='wave'
                width={40}
                height={40}
              />
            ) : (
              <Avatar
                src={userData?.photoURL ?? undefined}
                alt={userData?.displayName || 'U'}
                sx={{
                  bgcolor: userData?.photoURL
                    ? 'transparent'
                    : 'secondary.main',
                }}
              >
                {userData?.displayName?.charAt(0).toUpperCase() || ''}
              </Avatar>
            )}
          </IconButton>
        </Box>

        {/* User Menu */}
        <Menu
          ref={menuReference}
          id='menu-appbar'
          anchorEl={anchorElement}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorElement)}
          onClose={handleMenuClose}
        >
          {userData
            ? [
                <MenuItem
                  key='profile'
                  component={Link}
                  to='/profile'
                  onClick={handleMenuClose}
                >
                  <AccountBoxIcon sx={{ mr: 1 }} />
                  个人资料
                </MenuItem>,
                <MenuItem
                  key='logout'
                  onClick={handleLogout}
                >
                  <LogoutIcon sx={{ mr: 1 }} />
                  登出
                </MenuItem>,
              ]
            : [
                <MenuItem
                  key='signin'
                  component={Link}
                  to='/signin'
                  onClick={handleMenuClose}
                >
                  <LoginIcon sx={{ mr: 1 }} />
                  登录
                </MenuItem>,
                <MenuItem
                  key='signup'
                  component={Link}
                  to='/signup'
                  onClick={handleMenuClose}
                >
                  <PersonAddIcon sx={{ mr: 1 }} />
                  注册
                </MenuItem>,
              ]}
        </Menu>
      </Toolbar>

      {/* Upload Modal */}
      <UploadModal
        open={uploadModalOpen}
        onClose={toggleUploadModalOpen}
      />
    </AppBar>
  );
};

export default Header;
