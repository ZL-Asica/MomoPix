import { toast } from 'sonner';

const upload = async (
  uploadData: UploadData, // Upload data is an array of { key, file }
  TOKEN: string
): Promise<UploadResults> => {
  if (!TOKEN) {
    console.error('No token provided');
    toast.error('No token provided');
    throw new Error('No token provided');
  }

  // Convert UploadData to FormData
  const formData = new FormData();
  uploadData.forEach(({ key, file }) => {
    formData.append('key', key);
    formData.append('file', file);
  });

  try {
    const response = await fetch(import.meta.env.VITE_API_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      body: formData, // FormData as the request body
    });

    // Check response status
    if (!response.ok) {
      const errorDetails = await response.json().catch(() => null);
      console.error('Failed to upload files:', response, errorDetails);
      toast.error(
        `Upload failed: ${errorDetails?.error || response.statusText}`
      );
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText}`
      );
    }

    // Parse successful response
    const result: UploadResults = await response.json();
    if (result.success) {
      toast.success('All files uploaded successfully!');
    } else {
      console.warn('Partial failure in upload results:', result.failed);
      toast.error(
        `Some files failed to upload: ${result.failed
          .map((f) => f.key)
          .join(', ')}`
      );
    }

    return result;
  } catch (error) {
    console.error('Unexpected error during upload:', error);
    toast.error(`Unexpected error: ${(error as Error).message}`);
    throw error;
  }
};

export default upload;
