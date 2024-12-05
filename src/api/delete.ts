import { toast } from 'sonner';
import type { z } from 'zod';

import { DeleteResponseSchema } from '@/schemas';

const deleteFiles = async (
  keys: string[],
  TOKEN: string
): Promise<z.infer<typeof DeleteResponseSchema>> => {
  if (!TOKEN) {
    toast.error('No token provided');
    throw new Error('No token provided');
  }

  if (!keys || keys.length === 0) {
    toast.error('No keys provided');
    throw new Error('No keys provided');
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_ENDPOINT}/delete`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ keys }),
      }
    );

    if (!response.ok) {
      const errorDetails = await response.json().catch(() => null);
      toast.error(
        `Delete failed: ${errorDetails?.error || response.statusText}`
      );
      throw new Error(
        `Delete failed: ${response.status} ${response.statusText}`
      );
    }

    const jsonResponse = await response.json();

    const parseResult = DeleteResponseSchema.safeParse(jsonResponse);
    if (!parseResult.success) {
      console.error('Invalid API response structure:', parseResult.error);
      toast.error('Invalid response format from server');
      throw new Error('Invalid API response structure');
    }

    const result = parseResult.data;

    if (result.success) {
      if (result.failed.length > 0) {
        toast.error(
          `Some files failed to delete: ${result.failed
            .map((f) => f.key)
            .join(', ')}`
        );
      } else {
        toast.success('All files deleted successfully!');
      }
    } else {
      toast.error('Deletion partially or fully failed.');
    }

    return result;
  } catch (error) {
    toast.error(`Unexpected error: ${(error as Error).message}`);
    console.error('Delete error:', error);
    throw error;
  }
};

export default deleteFiles;
