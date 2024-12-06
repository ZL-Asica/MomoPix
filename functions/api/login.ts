import { verifyPassword } from '@/utils/password';
import { generateJwtWithCookie } from '@/utils/jwt';
import createSuccessResponse from '../helpers/createSuccessResponse';
import createErrorResponse from '../helpers/createErrorResponse';

interface LoginBody {
  username: string;
  password: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { username, password } = await context.request.json<LoginBody>();
  const kv = context.env.KV;

  if (!username || !password) {
    return createErrorResponse(400, 'Username and password are required');
  }

  const uid = await kv.get(`usernames:${username}`);
  if (!uid) {
    return createErrorResponse(401, 'User not exist');
  }

  const userKVDataString = await kv.get(`users:${uid}`);
  if (!userKVDataString) {
    return createErrorResponse(401, 'User not exist');
  }
  const userKVData: UserKVData = JSON.parse(userKVDataString);

  const isValid = await verifyPassword(password, userKVData.password);
  if (!isValid) {
    return createErrorResponse(401, 'Invalid username or password');
  }

  const jwtCookieHeaders = await generateJwtWithCookie(
    { uid: userKVData.uid, type: userKVData.type },
    context.env.JWT_SECRET
  );

  return createSuccessResponse(
    200,
    { ...userKVData, password: undefined },
    jwtCookieHeaders
  );
};
