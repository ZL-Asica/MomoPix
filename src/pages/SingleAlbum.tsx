import { PaginationControls } from '@/components'
import {
  AlbumHeader,
  AlbumNotFound,
  PhotoCard,
} from '@/components/SingleAlbum'
import SinglePhotoModal from '@/components/SinglePhoto'

import { SelectableContainer } from '@/components/ui'
import { usePagination } from '@/hooks'
import { useAuthStore } from '@/stores'

import { Grid2 as Grid } from '@mui/material'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

function SingleAlbumPage() {
  const params = useParams()
  const userData = useAuthStore(state => state.userData)
  // Current album
  const albumName = params.albumName
  const currentAlbum = userData?.albums.find(
    album => album.name === albumName,
  )

  // States
  const {
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedPhotos,
    totalPages,
  } = usePagination(currentAlbum?.photos || [], 20)

  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([] as Photo[])
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null)

  if (!currentAlbum) {
    return <AlbumNotFound albumName={albumName ?? ''} />
  }

  // Handle select photo
  const toggleSelectPhoto = (photo: Photo) => {
    setSelectedPhotos(previous =>
      previous.includes(photo)
        ? previous.filter(selectedPhoto => selectedPhoto !== photo)
        : [...previous, photo],
    )
  }

  // Handle opening and closing modal
  const openPhotoModal = (photo: Photo) => {
    setActivePhoto(photo)
  }

  const handleSelectionChange = (selectedItems: Photo[]) => {
    setSelectedPhotos((previous) => {
      const updatedSelections = previous.filter(
        item => !selectedItems.includes(item),
      )
      const newSelections = selectedItems.filter(
        item => !previous.includes(item),
      )
      return [...updatedSelections, ...newSelections]
    })
  }

  return (
    <SelectableContainer<Photo>
      items={paginatedPhotos}
      itemSelector={photo => document.querySelector(`#photo-${photo.id}`)}
      isSelecting={isSelecting}
      setIsSelecting={setIsSelecting}
      selectedItems={selectedPhotos}
      onSelectionChange={handleSelectionChange}
      color="#f6a8b8"
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
          {paginatedPhotos.map(photo => (
            <Grid
              id={`photo-${photo.id}`}
              key={photo.id}
              component="li"
              size={{
                xs: 6,
                sm: 4,
                md: 3,
                lg: 2,
              }}
              style={{
                listStyle: 'none',
              }}
            >
              <PhotoCard
                key={photo.id}
                photo={photo}
                albumName={albumName ?? ''}
                selected={selectedPhotos.includes(photo)}
                onSelect={() => toggleSelectPhoto(photo)}
                onClick={() => openPhotoModal(photo)}
              />
            </Grid>
          ))}
        </Grid>
      </PaginationControls>
      <SinglePhotoModal
        albumName={albumName ?? ''}
        photo={activePhoto}
        onClose={() => setActivePhoto(null)}
      />
    </SelectableContainer>
  )
}

export default SingleAlbumPage
