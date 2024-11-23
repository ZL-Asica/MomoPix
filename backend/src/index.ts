import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { bearerAuth } from 'hono/bearer-auth'
import { cors } from 'hono/cors'

import uploadHandler from './upload'

type Bindings = {
  CORS_ORIGIN: string // CORS origin
  TOKEN: string // Your private authentication token
  R2_BUCKET: R2Bucket // R2 bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(logger())

app.use('*', async (c, next) => {
  const corsMiddlewareHandler = cors({
    origin: c.env.CORS_ORIGIN
      ? c.env.CORS_ORIGIN.split(',').map((s) => s.trim())
      : '*',
    allowHeaders: ['Authorization'],
    allowMethods: ['POST'],
  })
  return corsMiddlewareHandler(c, next)
})

app.use(
  '*',
  bearerAuth({
    verifyToken: async (token, c) => {
      // Verify the token
      return token === c.env.TOKEN
    },
    invalidTokenMessage: { error: 'Invalid token' },
    noAuthenticationHeaderMessage: {
      error: 'Authorization header is required',
    },
  })
)

// uploading photos
app.post('/upload', uploadHandler)

app.onError((error, c) => {
  console.error('Unhandled error:', error)
  return c.json({ error: 'Internal Server Error' }, 500)
})

export default app
