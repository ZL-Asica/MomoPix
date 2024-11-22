import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component='footer'
      sx={{
        py: 2,
        px: 4,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[200],
        textAlign: 'center',
      }}
    >
      <Typography variant='body2' color='textSecondary'>
        © {new Date().getFullYear()} MomoPix. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
