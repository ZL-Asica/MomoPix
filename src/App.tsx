import { Box } from '@mui/material';
import { Route, Routes } from 'react-router-dom';

import AppProviders from '@/AppProviders';
import { Layout, ProtectedRoute, GuestRoute } from '@/components';

import SignInPage from '@/pages/SignIn';
import NotFoundPage from '@/pages/NotFoundPage';
import SignUpPage from '@/pages/SignUp';
import Profile from '@/pages/Profile';
import AlbumsPage from '@/pages/Albums';
import SingleAlbumPage from '@/pages/SingleAlbum';

const App = () => {
  return (
    <AppProviders>
      <Routes>
        <Route
          path='/'
          element={<Layout />}
        >
          <Route
            index
            element={<Box>Home Page</Box>}
          />
          <Route
            path='signin'
            element={
              <GuestRoute>
                <SignInPage />
              </GuestRoute>
            }
          />
          <Route
            path='signup'
            element={
              <GuestRoute>
                <SignUpPage />
              </GuestRoute>
            }
          />
          <Route
            path='profile'
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path='/albums'
            element={
              <ProtectedRoute>
                <AlbumsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/album/:albumName'
            element={
              <ProtectedRoute>
                <SingleAlbumPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/album/:albumName/:photoId'
            element={
              <ProtectedRoute>
                <Box> Photo Page </Box>
              </ProtectedRoute>
            }
          />
          <Route
            path='*'
            element={<NotFoundPage />}
          />
        </Route>
      </Routes>
    </AppProviders>
  );
};

export default App;
