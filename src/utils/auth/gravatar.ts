import SparkMD5 from 'spark-md5'

/**
 * Generate Gravatar URL from an email
 * @param email - User's email address
 * @param size - Image size (default: 200)
 * @returns Gravatar URL
 */
async function getGravatarURL(email: string, size: number = 200): Promise<string> {
  const emailHash = SparkMD5.hash(email.trim().toLowerCase())
  return `https://www.gravatar.com/avatar/${emailHash}?s=${size}&d=identicon`
}

/**
 * Fetch Gravatar profile data
 * @param email - User's email address
 * @returns Promise containing Gravatar profile data or null if not found
 */
async function fetchGravatarProfile(email: string): Promise<{ displayName?: string, photoURL?: string } | null> {
  const emailHash = SparkMD5.hash(email.trim().toLowerCase())
  const profileUrl = `https://www.gravatar.com/${emailHash}.json`

  try {
    const response = await fetch(profileUrl)
    if (!response.ok)
      throw new Error('Profile not found')

    const data = await response.json() as { entry: { displayName?: string, thumbnailUrl?: string }[] }
    const profile = data.entry[0]
    return {
      displayName: profile.displayName,
      photoURL: profile.thumbnailUrl,
    }
  }
  catch (error_) {
    console.error('Failed to fetch Gravatar profile:', error_)
    return null
  }
}

export { fetchGravatarProfile, getGravatarURL }
