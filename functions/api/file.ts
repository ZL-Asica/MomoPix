import { createErrorResponse, createSuccessResponse } from '@/helpers/index';
import { updateAlbumAndUserData } from '@/utils/user-data';
import {
  parseFormData,
  validateFileSizes,
  uploadFiles,
  updateAlbumData,
} from '@/utils/files-upload';
import { extractFileKeysFromUrls, deleteFiles } from '@/utils/files-delete';
import { validateUserAndEnv } from '@/utils/file-utils';

// interface UploadRequestBody {
//   albumName: string;
//   files: UploadFile[];
// }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { currentUserData, r2Url } = await validateUserAndEnv(context);

    const formData = await context.request.formData();
    const { albumName, files } = parseFormData(formData);

    const validFiles = validateFileSizes(files);
    if (validFiles.length < files.length) {
      return createErrorResponse(
        400,
        'Some Files Invalid',
        undefined,
        `${files.length - validFiles.length} files exceed size limit`
      );
    }

    const uploadResults = await uploadFiles(context.env, validFiles);

    const successUploads = uploadResults.filter((res) => res.success);
    const failedUploads = uploadResults.filter((res) => !res.success);

    if (failedUploads.length > 0) {
      console.error('File upload errors:', failedUploads);
    }

    const updatedAlbum = updateAlbumData(
      currentUserData.albums,
      albumName,
      successUploads.map((res) => res.uploadFile),
      r2Url
    );

    const newUserData = await updateAlbumAndUserData(
      context.env,
      currentUserData,
      updatedAlbum,
      albumName
    );

    return createSuccessResponse(200, newUserData, undefined, 'Upload success');
  } catch (error) {
    console.error('Unexpected error during upload:', error);
    return createErrorResponse(
      500,
      'Internal Server Error',
      undefined,
      (error as Error).message
    );
  }
};

interface DeleteRequestBody {
  albumName: string;
  urls: string[];
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { currentUserData, r2Url } = await validateUserAndEnv(context);

    const requestBody: DeleteRequestBody = await context.request.json();

    const { albumName, urls } = requestBody;

    if (!albumName || !Array.isArray(urls) || urls.length === 0) {
      return createErrorResponse(400, 'Invalid albumName or urls');
    }

    const album = currentUserData.albums.find((a) => a.name === albumName);
    if (!album) {
      return createErrorResponse(404, 'Album not found');
    }

    const fileKeys = extractFileKeysFromUrls(urls, r2Url);
    const deleteResults = await deleteFiles(context.env, fileKeys);

    const failedDeletes = deleteResults.filter((res) => !res.deleted);
    if (failedDeletes.length > 0) {
      console.error('Failed to delete some files:', failedDeletes);
    }

    const updatedPhotos = album.photos.filter(
      (photo) => !urls.includes(photo.url)
    );

    const updatedAlbum = { ...album, photos: updatedPhotos };
    const newUserData = await updateAlbumAndUserData(
      context.env,
      currentUserData,
      updatedAlbum,
      albumName
    );

    return createSuccessResponse(
      200,
      newUserData,
      undefined,
      'Files deleted successfully'
    );
  } catch (error) {
    console.error('Unexpected error during deletion:', error);
    return createErrorResponse(
      500,
      'Internal Server Error',
      undefined,
      (error as Error).message
    );
  }
};

interface UpdateRequestBody {
  albumName: string;
  updates: {
    id: string;
    name: string;
  }[];
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { currentUserData } = await validateUserAndEnv(context);
    const requestBody: UpdateRequestBody = await context.request.json();

    const { albumName, updates } = requestBody;

    if (!albumName || !Array.isArray(updates) || updates.length === 0) {
      return createErrorResponse(400, 'Invalid albumName or updates');
    }

    const album = currentUserData.albums.find((a) => a.name === albumName);
    if (!album) {
      return createErrorResponse(404, 'Album not found');
    }

    const updatedPhotos = album.photos.map((photo) => {
      const update = updates.find((u) => u.id === photo.id);
      if (update) {
        return {
          ...photo,
          name: update.name,
          lastModified: Date.now(),
        };
      }
      return photo;
    });

    const updatedAlbum = { ...album, photos: updatedPhotos };
    const newUserData = await updateAlbumAndUserData(
      context.env,
      currentUserData,
      updatedAlbum,
      albumName
    );

    return createSuccessResponse(
      200,
      newUserData,
      undefined,
      'Photos updated successfully'
    );
  } catch (error) {
    console.error('Unexpected error during update:', error);
    return createErrorResponse(
      500,
      'Internal Server Error',
      undefined,
      (error as Error).message
    );
  }
};
