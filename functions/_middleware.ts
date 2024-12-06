import { verifyJwt, generateJwtWithCookie } from './utils/jwt';
import createSuccessResponse from './helpers/createSuccessResponse';
import createErrorResponse from './helpers/createErrorResponse';

const corsHandler: PagesFunction = async (context) => {
  const response = await context.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Headers', '*');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, DELETE, OPTIONS'
  );
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
};

const errorHandling: PagesFunction = async (context) => {
  try {
    return await context.next();
  } catch (err) {
    console.error('Error:', err);
    return createErrorResponse(500, 'Internal Server Error');
  }
};

const authentication: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  if (
    !url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/api/register') ||
    url.pathname.startsWith('/api/login')
  ) {
    return await context.next();
  }

  const cookieHeader = context.request.headers.get('Cookie');

  if (!cookieHeader) {
    return createErrorResponse(401, 'Unauthorized');
  }

  const token = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('momo_pix_auth_token='))
    ?.split('=')[1];

  if (!token) {
    return createErrorResponse(401, 'Unauthorized');
  }

  const { valid, payload } = await verifyJwt(token, context.env.JWT_SECRET);

  if (!valid || !payload) {
    return createErrorResponse(401, 'Invalid token');
  }

  // Refresh within 2 weeks of expiration
  if (payload.exp < Math.floor(Date.now() / 1000) + 3600 * 24 * 14) {
    const jwtCookieHeaders = await generateJwtWithCookie(
      payload,
      context.env.JWT_SECRET
    );

    const setCookieHeader = jwtCookieHeaders.get('Set-Cookie');
    if (setCookieHeader) {
      context.request.headers.set('Cookie', setCookieHeader);
    }
  }

  context.data.user = payload;

  return await context.next();
};

export const onRequestOptions: PagesFunction = async () => {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  });
  return createSuccessResponse(204, null, headers);
};

export const onRequest: PagesFunction<Env>[] = [
  corsHandler,
  errorHandling,
  authentication,
];
