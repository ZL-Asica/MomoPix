import { toast } from 'sonner';
import type { z } from 'zod';

import type { UploadFile } from '@/schemas';
import { UploadResultsSchema } from '@/schemas';

const upload = async (
  uploadData: UploadFile[],
  TOKEN: string
): Promise<z.infer<typeof UploadResultsSchema>> => {
  if (!TOKEN) {
    toast.error('No token provided');
    throw new Error('No token provided');
  }

  const formData = new FormData();
  uploadData.forEach(({ key, file }) => {
    formData.append('key', key);
    formData.append('file', file);
  });

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorDetails = await response.json().catch(() => null);
      toast.error(
        `Upload failed: ${errorDetails?.error || response.statusText}`
      );
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText}`
      );
    }

    const jsonResponse = await response.json();

    const parseResult = UploadResultsSchema.safeParse(jsonResponse);
    if (!parseResult.success) {
      console.error('Invalid API response structure:', parseResult.error);
      throw new Error('Invalid API response structure');
    }

    const result = parseResult.data;

    return result;
  } catch (error) {
    toast.error(`Unexpected error: ${(error as Error).message}`);
    console.error('Upload error:', error);
    throw error;
  }
};

export default upload;
