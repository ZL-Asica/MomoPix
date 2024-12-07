export const MAX_COUNT = 10;
export const MAX_SIZE_MB = 5;

export function parseFormData(formData: FormData): {
  albumName: string;
  files: UploadFile[];
} {
  const albumName = formData.get('albumName') as string;

  const fileKeys = formData.getAll('fileKey') as string[];
  const fileNames = formData.getAll('fileName') as string[];
  const files = formData.getAll('file') as unknown as File[];

  const uploadFiles: UploadFile[] = fileKeys.map((key, index) => ({
    key,
    name: fileNames[index],
    file: files[index],
  }));

  if (!albumName || files.length === 0) {
    throw new Error('No Data Provided');
  }

  return { albumName, files: uploadFiles };
}

export function updateAlbumData(
  currentAlbums: Album[],
  albumName: string,
  uploadedFiles: UploadFile[],
  envR2Url: string
): Album {
  const currentAlbumData: Album = currentAlbums.find(
    (album) => album.name === albumName
  ) || {
    name: albumName,
    thumbnail: '',
    createdAt: new Date().toISOString(),
    photos: [],
  };

  const newPhotos = uploadedFiles.map((file) => ({
    id: file.key.split('/').slice(-1)[0].split('.')[0],
    url: `${envR2Url}/${file.key}`,
    size: file.file.size,
    lastModified: Date.now(),
    uploadedAt: Date.now(),
    name: file.name,
  }));

  const updatedAlbumData: Album = {
    ...currentAlbumData,
    photos: [...currentAlbumData.photos, ...newPhotos],
  };

  return updatedAlbumData;
}

export function validateFileSizes(files: UploadFile[]): UploadFile[] {
  return files.filter(
    (uploadFile) => uploadFile.file.size <= MAX_SIZE_MB * 1024 * 1024
  );
}

export async function uploadFiles(
  env: Env,
  files: UploadFile[]
): Promise<{ success: boolean; uploadFile: UploadFile; error?: string }[]> {
  return Promise.all(
    files.map(async (uploadFile) => {
      try {
        const arrayBuffer = await uploadFile.file.arrayBuffer();
        await env.R2.put(uploadFile.key, new Uint8Array(arrayBuffer));
        return { success: true, uploadFile };
      } catch (error) {
        console.error(`Error uploading file ${uploadFile.key}:`, error);
        return { success: false, uploadFile, error: (error as Error).message };
      }
    })
  );
}
