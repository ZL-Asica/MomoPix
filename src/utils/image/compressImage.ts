import { MAX_WIDTH, MAX_HEIGHT } from '@/consts';

const formatFactor: Record<'image/avif' | 'image/webp' | 'image/jpeg', number> =
  {
    'image/avif': 1, // AVIF can handle low quality well
    'image/webp': 0.9, // WebP maintains good quality with lower values
    'image/jpeg': 0.8, // JPEG requires higher quality for good results
  };

const supportedFormats = Object.keys(formatFactor) as Array<
  keyof typeof formatFactor
>;

/**
 * Dynamically calculate compression quality based on resolution, file size, and image complexity.
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param fileSize - Original file size in bytes
 * @param format - Target format ('image/avif', 'image/webp', 'image/jpeg')
 * @param complexity - Estimated image complexity (0.0 - 1.0, where 1.0 is highly complex)
 * @returns A quality value between 0.1 and 1.0
 */
const calculateDynamicQuality = (
  width: number,
  height: number,
  fileSize: number,
  format: 'image/avif' | 'image/webp' | 'image/jpeg',
  complexity: number
): number => {
  const totalPixels = width * height;

  // Base quality based on resolution
  let baseQuality = 1;
  if (totalPixels > 8_000_000)
    baseQuality = 0.6; // High resolution
  else if (totalPixels > 2_000_000)
    baseQuality = 0.7; // Medium resolution
  else if (totalPixels > 500_000)
    baseQuality = 0.8; // Low resolution
  else baseQuality = 0.9; // Tiny images

  // Adjust for file size
  if (fileSize > 5_000_000)
    baseQuality *= 0.8; // Very large files
  else if (fileSize > 1_000_000) baseQuality *= 0.9; // Medium files

  // Adjust for image complexity (higher complexity -> higher quality)
  const complexityFactor = 1 - 0.2 * complexity; // Reduce quality slightly for high complexity
  baseQuality *= complexityFactor;

  // Apply format-specific adjustment
  baseQuality *= formatFactor[format];

  // Clamp to [0.1, 1.0]
  return Math.max(0.1, Math.min(1, baseQuality));
};

/**
 * Estimate image complexity based on color variance or edges.
 * @param context - OffscreenCanvasRenderingContext2D to analyze image
 * @param width - Image width
 * @param height - Image height
 * @returns A complexity score between 0.0 (simple) and 1.0 (highly complex)
 */
const estimateImageComplexity = (
  context: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number
): number => {
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;

  let variance = 0;
  let mean = 0;
  const length = data.length / 4; // Each pixel has 4 values (RGBA)

  // Calculate mean pixel brightness
  for (let index = 0; index < data.length; index += 4) {
    const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
    mean += brightness;
  }
  mean /= length;

  // Calculate variance
  for (let index = 0; index < data.length; index += 4) {
    const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
    variance += Math.pow(brightness - mean, 2);
  }
  variance /= length;

  // Normalize variance to a 0-1 range
  return Math.min(1, variance / 255);
};

/**
 * The function to compress the image
 * @param imgBitmap - The image bitmap to compress
 * @param originalSize - Original file size in bytes
 * @param removeAlpha - Whether to remove the alpha channel
 * @returns - The compressed image blob or null if failed
 */
const compressImage = async (
  imgBitmap: ImageBitmap,
  originalSize: number,
  removeAlpha: boolean
): Promise<Blob | null> => {
  let { width, height } = imgBitmap;

  // Scale down image if necessary
  const ratio = Math.min(1, MAX_WIDTH / width, MAX_HEIGHT / height);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const offscreenCanvas = new OffscreenCanvas(width, height);
  const context = offscreenCanvas.getContext('2d');
  if (!context) throw new Error('Failed to get canvas context');

  context.drawImage(imgBitmap, 0, 0, width, height);

  // Estimate image complexity for quality adjustment
  const complexity = estimateImageComplexity(context, width, height);

  // Remove alpha channel if needed
  const alphaOption = removeAlpha ? { alpha: false } : {};

  let lastBlob: Blob | null = null;

  for (const format of supportedFormats) {
    try {
      const quality = calculateDynamicQuality(
        width,
        height,
        originalSize,
        format,
        complexity
      );
      const blob = await offscreenCanvas.convertToBlob({
        type: format,
        quality,
        ...alphaOption,
      });

      if (blob && blob.size < originalSize) {
        return blob; // Return the first successful compression
      }
      lastBlob = blob; // Store as fallback
    } catch (error) {
      console.warn(`Failed to compress image to ${format}:`, error);
    }
  }

  // Return fallback blob (e.g., JPEG)
  return lastBlob;
};

export default compressImage;
