const MAX_COUNT = 10;
const MAX_SIZE_MB = 5;

interface Env {
  R2: R2Bucket;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const formData = await context.request.formData();

    const files: { key: string; blob: Blob }[] = [];

    formData.forEach((value: any, key: string) => {
      if (key === 'file' && value instanceof Blob) {
        const correspondingKey = formData.get('key') as string;
        if (correspondingKey) {
          files.push({ key: correspondingKey, blob: value });
        }
      }
    });

    if (files.length > MAX_COUNT) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Too many files. Maximum is ${MAX_COUNT}.`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const invalidFiles = files
      .filter((file) => file.blob.size > MAX_SIZE_MB * 1024 * 1024)
      .map((file) => ({
        key: file.key,
        success: false,
        error: `File exceeds size limit of ${MAX_SIZE_MB}MB`,
      }));

    if (invalidFiles.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Some files are invalid.`,
          failed: invalidFiles,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 上传文件到 R2
    const uploadResults = await Promise.allSettled(
      files.map(async ({ key, blob }) => {
        try {
          const arrayBuffer = await blob.arrayBuffer();
          await context.env.R2.put(key, new Uint8Array(arrayBuffer));
          return { key, success: true };
        } catch (error) {
          console.error(`Error uploading file ${key}:`, error);
          return { key, success: false, error: (error as Error).message };
        }
      })
    );

    // 处理上传结果
    const successUploads = uploadResults
      .filter((result) => result.status === 'fulfilled' && result.value.success)
      .map(
        (result) => (result as PromiseFulfilledResult<{ key: string }>).value
      );

    const failedUploads = uploadResults
      .filter(
        (result) => result.status === 'fulfilled' && !result.value.success
      )
      .map(
        (result) =>
          (result as PromiseFulfilledResult<{ key: string; error: string }>)
            .value
      );

    return new Response(
      JSON.stringify({
        success: true,
        uploaded: successUploads,
        failed: failedUploads,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error during upload:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        details: (error as Error).message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
