import { Box, TextField, IconButton } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { copyToClipboard } from '@zl-asica/react';
import { useState } from 'react';
import { toast } from 'sonner';

const CopyableLinks = ({ photo }: { photo: Photo }) => {
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const links = [
    { label: '直达链接', value: photo.url },
    {
      label: 'HTML',
      value: `<img src="${photo.url}" alt="${photo.name}" />`,
    },
    { label: 'Markdown', value: `![${photo.name}](${photo.url})` },
    { label: 'BBCode', value: `[img]${photo.url}[/img]` },
  ];

  return (
    <Box>
      {links.map((link) => (
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
              },
            }}
            variant='outlined'
            size='small'
          />
          <IconButton
            onClick={async () => {
              await copyToClipboard(link.value, () => {
                toast.success('已复制');
                setCopiedLabel(link.label);
                setTimeout(() => setCopiedLabel(null), 3000);
              });
            }}
            aria-label={`Copy ${link.label}`}
          >
            <ContentCopyIcon
              color={copiedLabel === link.label ? 'success' : 'inherit'}
            />
          </IconButton>
        </Box>
      ))}
    </Box>
  );
};

export default CopyableLinks;
