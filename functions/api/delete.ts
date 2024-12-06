interface DeleteBody {
  keys: string[];
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const body: DeleteBody = await context.request.json();

    if (!body || !Array.isArray(body.keys)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request body. Expected an array of keys.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const keysArray = body.keys;

    if (keysArray.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No keys provided for deletion.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete files from R2
    const deleteResults = await Promise.allSettled(
      keysArray.map(async (key: string) => {
        try {
          const fileExists = await context.env.R2.head(key);
          if (!fileExists) {
            throw new Error(`File ${key} does not exist.`);
          }
          await context.env.R2.delete(key);
          return { key, success: true };
        } catch (error) {
          console.error(`Error deleting file ${key}:`, error);
          return {
            key,
            success: false,
            error: (error as Error).message,
          };
        }
      })
    );

    const successfulDeletes = deleteResults
      .filter((result) => result.status === 'fulfilled' && result.value.success)
      .map(
        (result) => (result as PromiseFulfilledResult<{ key: string }>).value
      );

    const failedDeletes = deleteResults
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
        deleted: successfulDeletes,
        failed: failedDeletes,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error during deletion:', error);
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
