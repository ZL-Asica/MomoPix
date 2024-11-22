import { Toaster } from 'sonner';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';

import { AuthProvider } from '@/contexts/AuthContext';
import { theme } from '@/utils';

const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <Toaster
          richColors
          expand={true}
        />
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default AppProviders;
