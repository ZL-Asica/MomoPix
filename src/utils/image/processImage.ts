import { toast } from 'sonner';

import compressImage from './compressImage';

/**
 * Check if the image has an alpha channel
 */
const hasAlphaChannel = (imgBitmap: ImageBitmap): boolean => {
  const canvas = new OffscreenCanvas(imgBitmap.width, imgBitmap.height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Failed to get canvas context');

  context.drawImage(imgBitmap, 0, 0);
  const imageData = context.getImageData(
    0,
    0,
    imgBitmap.width,
    imgBitmap.height
  );

  // Find the first non-opaque pixel
  for (let index = 3; index < imageData.data.length; index += 4) {
    if (imageData.data[index] < 255) {
      return true; // It has an alpha channel
    }
  }
  return false; // Fully opaque
};

/**
 * The main function to process the image will check the browser support, load the image, compress it to supported formats, and return the compressed image blob, or null if failed.
 * @param file - The image file to process
 * @returns Promise<Blob | null> - The compressed image blob or null if failed
 */
const processImage = async (file: File): Promise<Blob | null> => {
  try {
    // Load the image using createImageBitmap
    const imgBitmap = await createImageBitmap(file);

    // Check if the image has an alpha channel
    const removeAlpha = !hasAlphaChannel(imgBitmap);

    // Compress the image
    const compressedBlob = await compressImage(
      imgBitmap,
      file.size,
      removeAlpha
    );

    if (!compressedBlob || compressedBlob.size >= file.size) {
      toast.warning('压缩后大小无明显降低，将使用原始文件。');
      return file;
    }

    return compressedBlob;
  } catch (error) {
    console.error('图片处理失败：', error);
    toast.error(
      `图片处理失败：${error instanceof Error ? error.message : '未知错误'}`
    );
    return null;
  }
};

export default processImage;
