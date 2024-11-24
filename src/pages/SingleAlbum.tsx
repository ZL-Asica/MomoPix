import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Grid2 as Grid } from '@mui/material';

import { useAuthContext, usePagination } from '@/hooks';
import { PaginationControls } from '@/components';

import SinglePhotoModal from '@/components/SinglePhoto';
import {
  AlbumNotFound,
  AlbumHeader,
  PhotoCard,
} from '@/components/SingleAlbum';

const SingleAlbumPage = () => {
  const params = useParams();
  const { userData } = useAuthContext();

  // Current album
  const albumName = params.albumName;
  const currentAlbum = userData?.albums.find(
    (album) => album.name === albumName
  );

  if (!currentAlbum) {
    return <AlbumNotFound albumName={albumName || ''} />;
  }

  // States
  const {
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedPhotos,
    totalPages,
  } = usePagination(currentAlbum.photos, 20);

  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([] as Photo[]);
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);

  // Handle select photo
  const toggleSelectPhoto = (photo: Photo) => {
    setSelectedPhotos((previous) =>
      previous.includes(photo)
        ? previous.filter((selectedPhoto) => selectedPhoto !== photo)
        : [...previous, photo]
    );
  };

  // Handle opening and closing modal
  const openPhotoModal = (photo: Photo) => {
    setActivePhoto(photo);
  };

  const closePhotoModal = () => {
    setActivePhoto(null);
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        '& .MuiPagination-ul': {
          justifyContent: 'center',
          margin: '16px 0',
        },
      }}
    >
      <AlbumHeader currentAlbum={currentAlbum} />

      <PaginationControls
        totalPages={totalPages}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        selectedItems={selectedPhotos}
        albumName={albumName}
      >
        <Grid
          container
          spacing={2}
        >
          {paginatedPhotos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              albumName={albumName || ''}
              selected={selectedPhotos.includes(photo)}
              onSelect={() => toggleSelectPhoto(photo)}
              onClick={() => openPhotoModal(photo)}
            />
          ))}
        </Grid>
      </PaginationControls>

      <SinglePhotoModal
        albumName={albumName || ''}
        photo={activePhoto}
        onClose={closePhotoModal}
      />
    </Box>
  );
};

export default SingleAlbumPage;
