import { describe, expect, it } from 'vitest'
import { buildAttachmentDisposition } from './download'

describe('buildAttachmentDisposition', () => {
  it('removes header control characters and preserves a UTF-8 filename', () => {
    expect(buildAttachmentDisposition('猫\r\nphoto.raw')).toBe(
      'attachment; filename="_photo.raw"; filename*=UTF-8\'\'%E7%8C%ABphoto.raw',
    )
  })

  it('percent-encodes RFC 5987 delimiter characters', () => {
    expect(buildAttachmentDisposition('it\'s (final).raw'))
      .toContain('filename*=UTF-8\'\'it%27s%20%28final%29.raw')
  })
})
