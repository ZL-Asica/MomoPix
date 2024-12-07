interface FetchAPIOptions extends RequestInit {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  timeout?: number;
}

interface SuccessResponse<T> {
  data: T;
  message?: string;
  links?: Record<string, string>;
}

interface ErrorResponse {
  title: string;
  status: number;
  detail?: string;
}

const fetchAPI = async <T>(
  url: string,
  options: FetchAPIOptions = {}
): Promise<SuccessResponse<T>> => {
  const {
    method = 'GET',
    timeout = 5000,
    headers = {},
    body,
    ...fetchOptions
  } = options;

  const isFormData = body instanceof FormData;
  const defaultHeaders = isFormData
    ? headers // Let the browser handle Content-Type for FormData
    : { 'Content-Type': 'application/json', ...headers };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: defaultHeaders,
      body,
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // response.ok is status code 2xx
    if (!response.ok) {
      let errorResponse: ErrorResponse;

      // Avoid no error response
      try {
        errorResponse = await response.json();
      } catch {
        errorResponse = {
          title: response.statusText,
          status: response.status,
          detail: 'Failed to parse error response',
        };
      }

      throw new Error(
        `${response.status}-${errorResponse.title}: ${errorResponse.detail || ''}`
      );
    }

    const successResponse: SuccessResponse<T> = await response.json();
    return successResponse;
  } catch (error_: unknown) {
    clearTimeout(timeoutId);

    if (error_ instanceof Error && error_.name === 'AbortError') {
      throw new Error('Request timeout');
    }

    throw error_;
  }
};

export default fetchAPI;
