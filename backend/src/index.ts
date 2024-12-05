import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { bearerAuth } from 'hono/bearer-auth'
import { cors } from 'hono/cors'

import uploadHandler from './upload'
import deleteHandler from './delete'

type Bindings = {
  TOKEN: string // Your private authentication token
  R2_BUCKET: R2Bucket // R2 bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(logger())

app.use('*', async (c, next) => {
  const corsMiddlewareHandler = cors({
    origin: '*',
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['POST', 'DELETE', 'OPTIONS'],
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

// deleting photos
app.delete('/delete', deleteHandler)

app.onError((error, c) => {
  console.error('Unhandled error:', error)
  return c.json({ error: 'Internal Server Error' }, 500)
})

export default app
