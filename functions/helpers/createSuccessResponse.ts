const createSuccessResponse = (
  status: number,
  data: unknown,
  headers?: HeadersInit,
  message?: string,
  links?: Record<string, string>
): Response => {
  const responseBody: Record<string, unknown> = { data };

  if (message) {
    responseBody.message = message;
  }

  if (links) {
    responseBody.links = links;
  }

  const responseHeaders = new Headers(headers);
  responseHeaders.set('Content-Type', 'application/json');

  return new Response(JSON.stringify(responseBody), {
    status,
    headers: responseHeaders,
  });
};

export default createSuccessResponse;
