import { Box } from '@mui/material';
import { Route, Routes } from 'react-router-dom';

import AppProviders from '@/AppProviders';

import SignInPage from '@/pages/SignIn';
import NotFoundPage from '@/pages/NotFoundPage';
import SignUpPage from '@/pages/SignUp';
import Profile from '@/pages/Profile';
import AlbumsPage from '@/pages/Albums';

import Layout from '@/components/common/Layout';

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
            element={<SignInPage />}
          />
          <Route
            path='signup'
            element={<SignUpPage />}
          />
          <Route
            path='profile'
            element={<Profile />}
          />
          <Route
            path='/albums'
            element={<AlbumsPage />}
          />
          <Route
            path='/album/:albumName'
            element={<Box>Album Detail Page</Box>}
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
