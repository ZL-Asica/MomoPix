import processImage from './processImage';

const uploadSinglePhoto = async (
  file: File,
  photoData: PhotoData,
  preSignedLink: PreSignedUrl,
  incrementProgress: () => void
): Promise<Photo | null> => {
  try {
    const compressedBlob = await processImage(file);

    const response = await fetch(preSignedLink.signedUrl, {
      method: 'PUT',
      body: compressedBlob,
    });

    if (!response.ok) {
      console.error(`Failed to upload photo: ${photoData.id}`);
      return null;
    }

    incrementProgress();

    return {
      id: photoData.id,
      url: `${import.meta.env.VITE_CF_R2}/${photoData.url}`,
      size: compressedBlob.size,
      lastModified: Date.now(),
      uploadedAt: Date.now(),
      name: file.name,
    };
  } catch (error) {
    console.error(`Error uploading photo ${photoData.id}:`, error);
    return null;
  }
};

export default uploadSinglePhoto;
