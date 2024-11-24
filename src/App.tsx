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
          {/* Default route */}
          <Route
            index
            element={
              <ProtectedRoute>
                <AlbumsPage />
              </ProtectedRoute>
            }
          />

          {/* Auth routes */}
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

          {/* Authenticated user routes */}
          <Route
            path='profile'
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path='album/:albumName'
            element={
              <ProtectedRoute>
                <SingleAlbumPage />
              </ProtectedRoute>
            }
          />

          {/* Not Found */}
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
