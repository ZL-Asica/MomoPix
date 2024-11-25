import { z } from 'zod';

const DeleteResultSchema = z.object({
  key: z.string(),
  success: z.boolean(),
  error: z.string().optional(), // Error is optional because successful deletions won't have it
});

const DeleteResponseSchema = z.object({
  success: z.boolean(),
  deleted: z.array(DeleteResultSchema), // Array of successfully deleted files
  failed: z.array(DeleteResultSchema), // Array of failed deletions with error details
});

type DeleteResult = z.infer<typeof DeleteResultSchema>;
type DeleteResponse = z.infer<typeof DeleteResponseSchema>;

export { DeleteResultSchema, DeleteResponseSchema };
export type { DeleteResult, DeleteResponse };
