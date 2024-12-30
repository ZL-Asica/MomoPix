import { Box, CircularProgress } from '@mui/material'

function LoadingIndicator() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <CircularProgress size={36} />
    </Box>
  )
}

export default LoadingIndicator
