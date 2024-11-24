import { Box } from '@mui/material';

interface ImageDisplayProperties {
  url: string;
  alt: string;
}

const ImageDisplay = ({ url, alt }: ImageDisplayProperties) => {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: 2,
      }}
    >
      <img
        src={url}
        alt={alt}
        style={{
          maxWidth: '100%',
          maxHeight: '80vh',
          objectFit: 'contain',
        }}
      />
    </Box>
  );
};

export default ImageDisplay;
