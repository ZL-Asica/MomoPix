import createSuccessResponse from '../helpers/createSuccessResponse';

export const onRequestPost: PagesFunction<Env> = async () => {
  const headers = new Headers();

  headers.set(
    'Set-Cookie',
    `momo_pix_auth_token=; HttpOnly; Secure; Path=/; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );

  return createSuccessResponse(
    200,
    undefined,
    headers,
    'User logged out successfully'
  );
};
