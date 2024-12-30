import { asyncHandler } from '@/utils'
import { Box, Button, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

interface AlbumNotFoundProperties {
  albumName: string
}

function AlbumNotFound({ albumName }: AlbumNotFoundProperties) {
  const navigate = useNavigate()
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        mt: 10,
      }}
    >
      <Typography
        sx={{ textAlign: 'center' }}
        variant="h4"
        gutterBottom
      >
        不存在的相册
        <br />
        {albumName}
      </Typography>
      <Button
        type="submit"
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        onClick={
          asyncHandler(async () => {
            await navigate('/')
          })
        }
      >
        返回相册列表
      </Button>
    </Box>
  )
}

export default AlbumNotFound
