import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Grid2 as Grid,
  Typography,
} from '@mui/material'
import { Link } from 'react-router-dom'

interface AlbumCardProperties {
  album: Album
}

function AlbumCard({ album }: AlbumCardProperties) {
  const placeholderBackground = 'linear-gradient(135deg, #f5f5f5, #e0e0e0)'

  return (
    <Grid
      component="li"
      size={{ xs: 6, sm: 4, md: 3, lg: 2 }}
      sx={{
        listStyle: 'none',
        display: 'flex',
      }}
    >
      <Card
        sx={{
          'display': 'flex',
          'flexDirection': 'column',
          'borderRadius': 2,
          'boxShadow': theme => theme.shadows[2],
          'transition': 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: theme => theme.shadows[4],
          },
          'height': '100%',
        }}
      >
        {/* Image Section */}
        <Link
          to={`/album/${album.name}`}
          style={{
            textDecoration: 'none',
          }}
        >
          <CardMedia
            component="div"
            sx={{
              height: { xs: 160, sm: 180 },
              backgroundColor:
                album.thumbnail || album.photos?.length > 0
                  ? 'transparent'
                  : '#e0e0e0',
              backgroundImage: album.thumbnail
                ? `url(${album.thumbnail})`
                : album.photos?.length > 0
                  ? `url(${album.photos.at(-1)?.url})`
                  : placeholderBackground,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '8px 8px 0 0',
            }}
          />
        </Link>

        {/* Content Section */}
        <CardContent
          sx={{
            flexGrow: 1,
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {album.name}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            照片数量:
            {' '}
            {album.photos.length || 0}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
          >
            创建时间:
            {' '}
            {new Date(album.createdAt).toLocaleDateString()}
          </Typography>
        </CardContent>

        {/* Actions Section */}
        <CardActions
          sx={{
            justifyContent: 'space-between',
            paddingX: 2,
            paddingBottom: 2,
          }}
        >
          <Button
            size="small"
            color="primary"
            component={Link}
            to={`/album/${album.name}`}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            查看详情
          </Button>
        </CardActions>
      </Card>
    </Grid>
  )
}

export default AlbumCard
