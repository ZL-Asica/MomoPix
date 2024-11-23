import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { verifyFirebaseAuth, getFirebaseToken } from '@hono/firebase-auth'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const MAX_PHOTO_COUNT = 10

type Bindings = {
  CORS_ORIGIN: string // CORS origin
  FIREBASE_PROJECT_ID: string // Firebase Project ID
  FIREBASE_PUBLIC_KEYS: KVNamespace // For Firebase JWT verification
  ACCOUNT_ID: string // R2 Account ID
  ACCESS_KEY_ID: string // R2 Access Key ID
  SECRET_ACCESS_KEY: string // R2 Access Key Secret
  R2_BUCKET: string // R2 Bucket Name
}

const app = new Hono<{ Bindings: Bindings }>()

// R2 S3 Client Initialization
const createS3Client = (bindings: Bindings) =>
  new S3Client({
    region: 'auto',
    endpoint: `https://${bindings.ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: bindings.ACCESS_KEY_ID,
      secretAccessKey: bindings.SECRET_ACCESS_KEY,
    },
  })

app.use(logger())

app.use('*', async (c, next) => {
  const corsMiddlewareHandler = cors({
    origin: c.env.CORS_ORIGIN,
    allowMethods: ['POST'],
  })
  return corsMiddlewareHandler(c, next)
})

// Use Firebase Auth middleware to verify user identity
app.use('*', async (c, next) => {
  const firebaseAuthHandler = verifyFirebaseAuth({
    projectId: c.env.FIREBASE_PROJECT_ID,
  })
  return firebaseAuthHandler(c, next)
})

// Generate pre-signed URLs for uploading photos
app.post('/generate-links', async (c) => {
  try {
    // Verify Firebase token
    const token = getFirebaseToken(c)
    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Parse photo data from request body
    const { photoData }: { photoData: { id: string; url: string }[] } =
      await c.req.json()

    if (
      !Array.isArray(photoData) ||
      photoData.some((item) => !item.id || !item.url)
    ) {
      return c.json({ error: 'Invalid payload' }, 400)
    }

    if (photoData.length > MAX_PHOTO_COUNT) {
      return c.json(
        { error: `Too many photos. Maximum allowed is ${MAX_PHOTO_COUNT}.` },
        400
      )
    }

    // Initialize R2 S3 client
    const R2 = createS3Client(c.env)

    // Generate pre-signed URLs for each photo
    const preSignedUrls = await Promise.allSettled(
      photoData.map(async ({ id, url }) => {
        const signedUrl = await getSignedUrl(
          R2,
          new PutObjectCommand({
            Bucket: c.env.R2_BUCKET,
            Key: url,
            ContentType: 'image/avif', // Set content type to AVIF
          }),
          { expiresIn: 60 * 10 } // Set expiration time to 10 minutes
        )
        return { id, signedUrl } // Store photo ID and pre-signed URL
      })
    )

    // Filter out successful results
    const successfulUrls = preSignedUrls
      .filter((result) => result.status === 'fulfilled')
      .map(
        (result) =>
          (result as PromiseFulfilledResult<{ id: string; signedUrl: string }>)
            .value
      )

    // Log failed results
    for (const result of preSignedUrls.filter(
      (result) => result.status === 'rejected'
    )) {
      console.error('Failed to generate URL:', result)
    }

    if (successfulUrls.length === 0) {
      return c.json({ error: 'Failed to generate any pre-signed URLs' }, 500)
    }

    return c.json(successfulUrls) // Return only the successful URLs
  } catch (error) {
    console.error('Error generating pre-signed links:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

export default app
