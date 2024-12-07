import { getUserData } from './user-data';

async function validateUserAndEnv(
  context: EventContext<Env, any, Record<string, unknown>>
): Promise<{ currentUserData: UserKVData; r2Url: string }> {
  const currentUserData = await getUserData(context);
  if (!currentUserData) {
    throw new Error('User not found');
  }

  const r2Url = context.env.R2_URL;
  if (!r2Url) {
    throw new Error('R2 URL not set');
  }

  return { currentUserData, r2Url };
}

export { validateUserAndEnv };
