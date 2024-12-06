import { hashPassword } from '@/utils/password';
import { generateUid } from '@/utils/uid';
import createSuccessResponse from '../helpers/createSuccessResponse';
import createErrorResponse from '../helpers/createErrorResponse';

interface RegisterBody {
  username: string;
  password: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { username, password } = await context.request.json<RegisterBody>();
  const kv = context.env.KV;

  if (!username || !password) {
    return createErrorResponse(400, 'Username and password are required');
  }
  const rootExists = await kv.get('root_exists');

  const openRegistration = context.env.PUBLIC === 'true';
  if (rootExists && !openRegistration) {
    return createErrorResponse(403, 'Registration is disabled');
  }

  const existingUid = await kv.get(`usernames:${username}`);
  if (existingUid) {
    return createErrorResponse(409, 'Username already exists');
  }

  const userType = rootExists ? 'user' : 'root';
  const hashedPassword = await hashPassword(password);
  const uid = await generateUid([username, userType]);

  if (!rootExists) {
    await kv.put('root_exists', 'true');
  }

  const defaultAlbum: Album = {
    name: 'Default',
    thumbnail: '',
    createdAt: new Date().toISOString(),
    photos: [],
  };

  const userData: UserData = {
    uid,
    type: userType,
    email: null,
    displayName: username,
    photoURL: null,
    createdAt: new Date().toISOString(),
    albums: [defaultAlbum],
  };

  await kv.put(
    `users:${uid}`,
    JSON.stringify({ ...userData, password: hashedPassword } as UserKVData)
  );

  // Save the username to uid mapping
  await kv.put(`usernames:${username}`, uid);

  return createSuccessResponse(201, userData);
};
