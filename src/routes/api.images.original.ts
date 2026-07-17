import { createFileRoute } from '@tanstack/react-router'
import { isAuthed } from '@/lib/auth/guards'
import { getD1Binding, getR2Binding } from '@/lib/cloudflare/bindings'
import { buildAttachmentDisposition } from '@/lib/images/download'
import { getImageRecord } from '@/lib/storage/imagesRepo'
import { getImageObject } from '@/lib/storage/r2Repo'

export const Route = createFileRoute('/api/images/original')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAuthed())) {
          return new Response('Unauthorized', { status: 401 })
        }

        const objectKey = new URL(request.url).searchParams.get('objectKey')?.trim() ?? ''
        if (objectKey.length === 0) {
          return new Response('Missing image key', { status: 400 })
        }

        const image = await getImageRecord(getD1Binding(), objectKey)
        if (image?.original === null || image?.original === undefined) {
          return new Response('Original image not found', { status: 404 })
        }

        const object = await getImageObject(getR2Binding(), image.original.objectKey)
        if (object === null) {
          return new Response('Original image object not found', { status: 404 })
        }

        const headers = new Headers({
          'Cache-Control': 'private, no-store',
          'Content-Disposition': buildAttachmentDisposition(image.originalName),
          'Content-Length': String(object.size),
          'Content-Type': image.original.mime,
          'X-Content-Type-Options': 'nosniff',
        })
        return new Response(object.body, { headers })
      },
    },
  },
})
