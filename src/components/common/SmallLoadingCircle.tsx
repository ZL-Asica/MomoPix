import { Box, Typography } from '@mui/material'

interface SmallLoadingCircleProperties {
  text?: string
}

function SmallLoadingCircle({ text = '' }: SmallLoadingCircleProperties) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          width: 24,
          height: 24,
          border: '3px solid',
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {text && <Typography variant="body2">{text}</Typography>}
    </Box>
  )
}

export default SmallLoadingCircle
