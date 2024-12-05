interface Env {
  TOKEN: string;
}

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
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

const authentication: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  if (!url.pathname.startsWith('/api')) {
    return await context.next();
  }

  const authHeader = context.request.headers.get('Authorization');

  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Authorization header is required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const token = authHeader.split(' ')[1]; // 提取 Bearer Token

  if (!token || token !== context.env.TOKEN) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return await context.next();
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  });
};

export const onRequest: PagesFunction[] = [
  corsHandler,
  errorHandling,
  authentication,
];
