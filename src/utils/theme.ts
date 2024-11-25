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
  typography: {
    fontFamily: '"Roboto", "Noto Sans SC", "Arial", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 600 },
    h2: { fontSize: '1.75rem', fontWeight: 600 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.2 },
  },
  colorSchemes: {
    light: {
      palette: lightPalette,
    },
    dark: {
      palette: darkPalette,
    },
  },
  components: {
    MuiTypography: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.text.primary,
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          padding: '8px 16px',
          textTransform: 'none', // Disable uppercase transformation
          fontWeight: 500,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.04)',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiInputBase-root': {
            borderRadius: '8px',
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiInputBase-input': {
            padding: '12px',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.divider,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
          },
        }),
      },
    },
    MuiLink: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.primary.main,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
          '&:active': {
            color: theme.palette.primary.dark,
          },
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px',
          '&:last-child': {
            paddingBottom: '16px',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: '8px',
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
        },
        list: {
          padding: 0,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          margin: '4px 8px',
          padding: '8px 16px',
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
  },
});

export default theme;
