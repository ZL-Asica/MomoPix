import { theme } from '@/utils'
import { ThemeProvider } from '@mui/material'
import { BrowserRouter as Router } from 'react-router-dom'

import { Toaster } from 'sonner'

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <Toaster
          richColors
          expand
        />
        {children}
      </ThemeProvider>
    </Router>
  )
}

export default AppProviders
