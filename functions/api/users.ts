import { createErrorResponse, createSuccessResponse } from '@/helpers/index';
import { getUserData, updateUserData } from '@/utils/user-data';

export const onRequest: PagesFunction<Env> = async (context) => {
  const userData = await getUserData(context);

  if (!userData) {
    return createErrorResponse(404, 'User not found');
  }

  return createSuccessResponse(200, userData);
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const currentUserData = await getUserData(context);

  if (!currentUserData) {
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

  const newUserData = await updateUserData(
    context.env,
    currentUserData,
    updatedData
  );

  return createSuccessResponse(
    200,
    newUserData,
    undefined,
    'User data updated successfully'
  );
};
