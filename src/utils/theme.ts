import { createTheme } from '@mui/material/styles';

// Define light and dark color schemes
const lightPalette = {
  primary: {
    main: '#f6a8b8',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#5bcefa',
    contrastText: '#ffffff',
  },
  background: {
    default: '#ffffff',
    paper: '#fefefe',
  },
  text: {
    primary: '#2d2d2d',
    secondary: '#4f4f4f',
  },
};

const darkPalette = {
  primary: {
    main: '#f6a8b8',
    contrastText: '#2d2d2d',
  },
  secondary: {
    main: '#5bcefa',
    contrastText: '#2d2d2d',
  },
  background: {
    default: '#1e1e2f',
    paper: '#2a2a40',
  },
  text: {
    primary: '#f1f1f1',
    secondary: '#d0d0d0',
  },
};

// Create the theme
const theme = createTheme({
  colorSchemes: {
    light: {
      palette: lightPalette,
    },
    dark: {
      palette: darkPalette,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          padding: '8px 16px',
        },
      },
    },
  },
});

export default theme;
