function getUidFromJwt(
  context: EventContext<Env, any, Record<string, unknown>>
): string {
  /**
   * Extracts the UID from a JWT payload.
   *
   * @param context - The event context containing the JWT payload.
   * @returns The UID.
   */
  const jwtPayload = context.data.user as JWTPayloadWithIatExp;
  return jwtPayload.uid;
}

async function getUserData(
  context: EventContext<Env, any, Record<string, unknown>>
): Promise<UserKVData | null> {
  /**
   * Retrieves user data from KV storage.
   *
   * @param context - The event context containing the JWT payload and KV storage.
   * @returns User data or null if the user does not exist.
   */
  const uid = getUidFromJwt(context);
  const userDataRaw = await context.env.KV.get(`users:${uid}`);
  if (!userDataRaw) {
    return null; // User not found
  }

  return JSON.parse(userDataRaw);
}

async function updateUserData(
  env: Env,
  currentUserData: UserKVData,
  updatedData: Partial<UserData>
): Promise<UserData | null> {
  /**
   * Updates user data in KV storage.
   *
   * @param env - The environment object containing KV storage.
   * @param currentUserData - The current user data.
   * @param updatedData - Partial user data for updating.
   * @returns Updated user data or null if the user does not exist.
   */
  const uid = currentUserData.uid;

  const newUserData: UserKVData = {
    ...currentUserData,
    ...updatedData,
    uid: currentUserData.uid, // Ensure UID is not overridden
    password: currentUserData.password, // Ensure password is not overridden
  };

  await env.KV.put(`users:${uid}`, JSON.stringify(newUserData));
  const { password, ...userDataWithoutPassword } = newUserData;
  return userDataWithoutPassword; // Omit password from response
}

async function updateAlbumAndUserData(
  env: Env,
  currentUserData: UserKVData,
  updatedAlbum: Album,
  albumName: string
): Promise<UserData> {
  const updatedAlbums = currentUserData.albums.map((album) =>
    album.name === albumName ? updatedAlbum : album
  );

  const updatedData = { ...currentUserData, albums: updatedAlbums };
  const newUserData = await updateUserData(env, currentUserData, updatedData);
  return newUserData as UserData;
}

export { getUserData, updateUserData, updateAlbumAndUserData };
