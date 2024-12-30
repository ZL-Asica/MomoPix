import { Box, Typography } from '@mui/material'

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 4,
        mt: 'auto',
        textAlign: 'center',
      }}
    >
      <Typography
        variant="body2"
        color="textSecondary"
      >
        ©
        {' '}
        {new Date().getFullYear()}
        {' '}
        MomoPix. 版权所有.
      </Typography>
    </Box>
  )
}

export default Footer
