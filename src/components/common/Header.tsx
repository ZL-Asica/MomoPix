import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AccountBox as AccountBoxIcon,
  CloudUpload as CloudUploadIcon,
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
import { useAuth } from '@/hooks';
import { useAuthStore } from '@/stores';

const Header = () => {
  const userData = useAuthStore((state) => state.userData);
  const loading = useAuthStore((state) => state.loading);
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

  return (
    <AppBar
      position='static'
      color='primary'
      sx={{ mb: 2, borderRadius: '0 0' }}
    >
      <Toolbar>
        {/* App Title */}
        <Typography
          variant='h6'
          component='div'
          sx={{ flexGrow: 1, color: 'white' }}
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
            <IconButton
              size='large'
              color='inherit'
              onClick={toggleUploadModalOpen}
              sx={{
                transition: '0.2s',
                '&:hover': { color: 'secondary.main' },
              }}
            >
              <CloudUploadIcon />
            </IconButton>
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
          onClick={handleMenuClose}
          onClose={handleMenuClose}
        >
          {userData
            ? [
                <MenuItem
                  key='profile'
                  component={Link}
                  to='/profile'
                >
                  <AccountBoxIcon sx={{ mr: 1 }} />
                  个人资料
                </MenuItem>,
                <MenuItem
                  key='logout'
                  onClick={logout}
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
                >
                  <LoginIcon sx={{ mr: 1 }} />
                  登录
                </MenuItem>,
                <MenuItem
                  key='signup'
                  component={Link}
                  to='/signup'
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
