import createSuccessResponse from '../helpers/createSuccessResponse';
import createErrorResponse from '../helpers/createErrorResponse';

export const onRequest: PagesFunction<Env> = async (context) => {
  const jwtPayload = context.data.user as JWTPayloadWithIatExp;
  const uid = jwtPayload.uid;
  const userDataRaw = await context.env.KV.get(`users:${uid}`);

  if (!userDataRaw) {
    return createErrorResponse(404, 'User not found');
  }

  const userData = JSON.parse(userDataRaw);

  return createSuccessResponse(200, userData);
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const jwtPayload = context.data.user as JWTPayloadWithIatExp;
  const uid = jwtPayload.uid;

  const userDataRaw = await context.env.KV.get(`users:${uid}`);
  if (!userDataRaw) {
    return createErrorResponse(404, 'User not found');
  }

  let updatedData: Partial<UserData>;
  try {
    updatedData = await context.request.json();
    if (typeof updatedData !== 'object' || updatedData === null) {
      throw new Error('Invalid JSON data');
    }
  } catch {
    return createErrorResponse(400, 'Invalid JSON data');
  }

  const currentUserData = JSON.parse(userDataRaw);

  const newUserData = {
    ...currentUserData,
    ...updatedData,
    uid: currentUserData.uid,
  };

  await context.env.KV.put(`users:${uid}`, JSON.stringify(newUserData));

  return createSuccessResponse(
    200,
    newUserData,
    undefined,
    'User data updated successfully'
  );
};
