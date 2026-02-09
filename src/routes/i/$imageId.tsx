import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/i/$imageId')({
  component: () => null,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const [
          { isAuthed },
          { getKVBinding, getR2Binding },
          { getImageRecord },
          { getImageObject },
          { toImageResponse },
        ] = await Promise.all([
          import('@/lib/auth/guards'),
          import('@/lib/cloudflare/bindings'),
          import('@/lib/storage/imagesRepo'),
          import('@/lib/storage/r2Repo'),
          import('@/lib/cloudflare/r2'),
        ])

        const pathname = new URL(request.url).pathname
        const imageId = decodeURIComponent(pathname.split('/').at(-1) ?? '')
        if (imageId.length === 0) {
          return new Response('Invalid image id', { status: 400 })
        }

        const authed = await isAuthed()
        if (!authed) {
          return new Response('Unauthorized', { status: 401 })
        }

        const kv = getKVBinding()
        const r2 = getR2Binding()
        const image = await getImageRecord(kv, imageId)
        if (!image) {
          return new Response('Not found', { status: 404 })
        }

        const object = await getImageObject(r2, image.r2Key)
        if (!object || object.body === null) {
          return new Response('Not found', { status: 404 })
        }

        return toImageResponse(object, image.mime)
      },
    },
  },
})
