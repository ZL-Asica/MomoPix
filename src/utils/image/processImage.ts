import { toast } from 'sonner';

const MAX_HEIGHT = 1440;
const MAX_WIDTH = 2560;

/**
 * Remove EXIF data from the original file
 * @param file - The original image file
 * @returns Blob with EXIF removed
 */
const removeExif = async (file: File): Promise<Blob> => {
  const imgBitmap = await createImageBitmap(file);
  const offscreenCanvas = new OffscreenCanvas(
    imgBitmap.width,
    imgBitmap.height
  );
  const context = offscreenCanvas.getContext('2d');
  if (!context) throw new Error('Failed to get canvas context');
  context.drawImage(imgBitmap, 0, 0);

  // Re-encode without EXIF
  return offscreenCanvas.convertToBlob({ type: file.type });
};

/**
 * Check if the browser supports AVIF format
 */
const isAvifSupported = async (timeout = 3000): Promise<boolean> => {
  return new Promise((resolve) => {
    const avifImage = new Image();
    const timer = setTimeout(() => resolve(false), timeout);

    avifImage.src =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    avifImage.addEventListener('load', () => {
      clearTimeout(timer);
      resolve(true);
    });
    avifImage.addEventListener('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
};

/**
 * Use createImageBitmap to load the image higher performance
 */
const loadImageBitmap = async (file: File): Promise<ImageBitmap> => {
  return createImageBitmap(file);
};

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

// const createOffscreenCanvas = (
//   width: number,
//   height: number
// ): OffscreenCanvas | HTMLCanvasElement => {
//   if (typeof OffscreenCanvas === 'undefined') {
//     const canvas = document.createElement('canvas');
//     canvas.width = width;
//     canvas.height = height;
//     return canvas;
//   } else {
//     return new OffscreenCanvas(width, height);
//   }
// };

/**
 * The function to compress the image
 * @param imgBitmap - The image bitmap to compress
 * @param type - The image type to compress
 * @param quality - The image quality to compress
 * @param removeAlpha - Whether to remove the alpha channel
 * @returns - The compressed image blob or null if failed
 */
const compressImage = async (
  imgBitmap: ImageBitmap,
  type: string,
  quality: number,
  removeAlpha: boolean
): Promise<Blob | null> => {
  let { width, height } = imgBitmap;

  // Calculate the new width and height if the image is too large
  const ratio = Math.min(1, MAX_WIDTH / width, MAX_HEIGHT / height);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const offscreenCanvas = new OffscreenCanvas(width, height);
  const context = offscreenCanvas.getContext('2d');
  if (!context) throw new Error('Failed to get canvas context');

  context.drawImage(imgBitmap, 0, 0, width, height);

  // Check and remove the alpha channel if needed
  const alphaOption = removeAlpha ? { alpha: false } : {};

  return offscreenCanvas.convertToBlob({
    type,
    quality,
    ...alphaOption,
  });
};

/**
 * The main function to process the image will check the browser support, load the image, compress it to AVIF format, and return the compressed image blob, or null if failed.
 * @param file - The image file to process
 * @returns Promise<Blob | null> - The compressed image blob or null if failed
 */
const processImage = async (file: File): Promise<Blob | null> => {
  try {
    // 检查 AVIF 支持性
    if (!(await isAvifSupported())) {
      toast.error('当前浏览器不支持 AVIF 格式！');
      return null;
    }

    // Load the image using createImageBitmap
    const imgBitmap = await loadImageBitmap(file);

    // Check if the image has an alpha channel
    const removeAlpha = !hasAlphaChannel(imgBitmap);

    // Compress the image to AVIF format
    const avifBlob = await compressImage(
      imgBitmap,
      'image/avif',
      0.8,
      removeAlpha
    );

    if (
      avifBlob &&
      avifBlob.size < file.size &&
      avifBlob.type.startsWith('image/avif')
    ) {
      return avifBlob;
    }

    // Retry with webp format if AVIF failed
    toast.warning(`压缩失败：尝试使用 WebP 格式 (${avifBlob?.type})`);
    const webpBlob = await compressImage(
      imgBitmap,
      'image/webp',
      0.8,
      removeAlpha
    );

    if (
      webpBlob &&
      webpBlob.size < file.size &&
      webpBlob.type.startsWith('image/webp')
    ) {
      return webpBlob;
    }

    toast.warning('原文件小：移除 EXIF 信息');

    const exifRemovedBlob = await removeExif(file);

    return exifRemovedBlob;
  } catch (error) {
    console.error('图片处理失败：', error);
    toast.error(
      `图片处理失败：${error instanceof Error ? error.message : '未知错误'}`
    );
    return null;
  }
};

export default processImage;
