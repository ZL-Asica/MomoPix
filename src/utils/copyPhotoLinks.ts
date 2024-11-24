import { toast } from 'sonner';
import { copyToClipboard } from '@zl-asica/react';

/**
 * Utility function to copy links of photos to the clipboard.
 * Accepts an array of photos and a specific format to copy (direct link, HTML, Markdown, or BBCode).
 * @param photos - An array of Photo objects.
 * @param format - The format of the link to copy ('direct', 'html', 'markdown', 'bbcode').
 */
const copyPhotoLinks = async (
  photos: Photo[],
  format: 'direct' | 'html' | 'markdown' | 'bbcode'
): Promise<void> => {
  const formatMap: Record<typeof format, (photo: Photo) => string> = {
    direct: (photo) => photo.url,
    html: (photo) => `<img src="${photo.url}" alt="${photo.name}" />`,
    markdown: (photo) => `![${photo.name}](${photo.url})`,
    bbcode: (photo) => `[img]${photo.url}[/img]`,
  };

  // Generate links based on the selected format
  const formatFunction = formatMap[format];
  const links = photos.map((photo) => formatFunction(photo)).join('\n');

  try {
    await copyToClipboard(links, () => {
      toast.success(`已复制 ${photos.length} 张图片链接！`);
    });
  } catch (error) {
    toast.error('复制失败，请重试！');
    console.error(error);
  }
};

export default copyPhotoLinks;
