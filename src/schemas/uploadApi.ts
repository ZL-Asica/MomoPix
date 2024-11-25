import { z } from 'zod';

const UploadFileSchema = z.object({
  key: z.string(),
  file: z.instanceof(Blob),
});

const UploadResultsSchema = z.object({
  success: z.boolean(),
  uploaded: z.array(
    z.object({
      key: z.string(),
      success: z.boolean(),
    })
  ),
  failed: z.array(
    z.object({
      key: z.string(),
      success: z.boolean(),
      error: z.string(),
    })
  ),
});

type UploadFile = z.infer<typeof UploadFileSchema>;
type UploadResults = z.infer<typeof UploadResultsSchema>;

export { UploadFileSchema, UploadResultsSchema };
export type { UploadFile, UploadResults };
