import { asyncHandler } from '@/utils'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { Box, IconButton, TextField, Typography } from '@mui/material'
import { copyToClipboard } from '@zl-asica/react'
import { useState } from 'react'
import { toast } from 'sonner'

function CopyableLinks({ photo }: { photo: Photo }) {
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null)

  const links = [
    { label: '直达链接', value: photo.url },
    {
      label: 'HTML',
      value: `<img src="${photo.url}" alt="${photo.name}" />`,
    },
    { label: 'Markdown', value: `![${photo.name}](${photo.url})` },
    { label: 'BBCode', value: `[img]${photo.url}[/img]` },
  ]

  return (
    <Box
      sx={{
        maxWidth: '600px',
        mx: 'auto',
        width: '100%',
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          mb: 4,
        }}
      >
        图片链接
      </Typography>

      {links.map(link => (
        <Box
          key={link.label}
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <TextField
            label={link.label}
            value={link.value}
            fullWidth
            slotProps={{
              input: {
                readOnly: true,
                onFocus: (event_: React.FocusEvent<HTMLInputElement>) =>
                  event_.target.select(), // Select the text when focused
              },
            }}
            variant="outlined"
            size="small"
          />
          <IconButton
            onClick={
              asyncHandler(async () => {
                await copyToClipboard(link.value, () => {
                  toast.success('已复制')
                  setCopiedLabel(link.label)
                  setTimeout(() => setCopiedLabel(null), 3000)
                })
              })
            }
            aria-label={`Copy ${link.label}`}
          >
            <ContentCopyIcon
              color={copiedLabel === link.label ? 'success' : 'inherit'}
            />
          </IconButton>
        </Box>
      ))}
    </Box>
  )
}

export default CopyableLinks
