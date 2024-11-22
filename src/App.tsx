import { Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import SignIn from '@/pages/SignIn';
import NotFoundPage from '@/pages/NotFoundPage';
import SignUpPage from '@/pages/SignUp';

import Layout from '@/components/common/Layout';

const App = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors expand={true} />
      <Router>
        <Routes>
          <Route path='/' element={<Layout />}>
            <Route index element={<Box>Home Page</Box>} />
            <Route path='signin' element={<SignIn />} />
            <Route path='signup' element={<SignUpPage />} />
            <Route path='*' element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
