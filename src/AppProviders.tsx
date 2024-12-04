import { Toaster } from 'sonner';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';

import { theme } from '@/utils';

const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <Toaster
          richColors
          expand={true}
        />
        {children}
      </ThemeProvider>
    </Router>
  );
};

export default AppProviders;
