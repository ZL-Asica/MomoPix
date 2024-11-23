/**
 * Generate MD5 hash using SubtleCrypto
 * @param message - The input string to hash
 * @returns Promise containing the hex-encoded hash
 */
const md5Hash = async (message: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  return [...new Uint8Array(hashBuffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Generate Gravatar URL from an email
 * @param email - User's email address
 * @param size - Image size (default: 200)
 * @returns Gravatar URL
 */
const getGravatarURL = async (
  email: string,
  size: number = 200
): Promise<string> => {
  const emailHash = await md5Hash(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${emailHash}?s=${size}&d=identicon`;
};

/**
 * Fetch Gravatar profile data
 * @param email - User's email address
 * @returns Promise containing Gravatar profile data or null if not found
 */
const fetchGravatarProfile = async (
  email: string
): Promise<{ displayName?: string; photoURL?: string } | null> => {
  const emailHash = await md5Hash(email.trim().toLowerCase());
  const profileUrl = `https://www.gravatar.com/${emailHash}.json`;

  try {
    const response = await fetch(profileUrl);
    if (!response.ok) throw new Error('Profile not found');

    const data = await response.json();
    const profile = data.entry[0];
    return {
      displayName: profile.displayName || null,
      photoURL: profile.thumbnailUrl || null,
    };
  } catch (error) {
    console.error('Failed to fetch Gravatar profile:', error);
    return null;
  }
};

export { getGravatarURL, fetchGravatarProfile };
