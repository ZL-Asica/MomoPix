const createErrorResponse = (
  status: number,
  title: string,
  headers?: HeadersInit,
  detail?: string
): Response => {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Content-Type', 'application/json');

  return new Response(
    JSON.stringify({
      title,
      status,
      detail,
    }),
    {
      status,
      headers: responseHeaders,
    }
  );
};

export default createErrorResponse;
