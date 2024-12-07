export function extractFileKeysFromUrls(
  urls: string[],
  baseUrl: string
): string[] {
  return urls.map((url) => url.replace(`${baseUrl}/`, ''));
}

export async function deleteFiles(
  env: Env,
  fileKeys: string[]
): Promise<{ key: string; deleted: boolean; reason?: string }[]> {
  return Promise.all(
    fileKeys.map(async (key) => {
      try {
        const headResponse = await env.R2.head(key);
        if (!headResponse) {
          return { key, deleted: false, reason: 'File not found' };
        }
        await env.R2.delete(key);
        return { key, deleted: true };
      } catch (error) {
        return { key, deleted: false, reason: (error as Error).message };
      }
    })
  );
}
