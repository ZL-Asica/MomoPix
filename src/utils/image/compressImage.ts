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
 * Calculates the compression quality dynamically based on image properties.
 *
 * ### Key Factors:
 * 1. **Resolution**: Larger images reduce quality to balance file size and visual fidelity.
 * 2. **File Size**: Bigger original files lower the quality to ensure significant compression.
 * 3. **Complexity**: Detailed or complex images retain more quality to preserve essential details.
 * 4. **Format Adjustment**: Each format adjusts quality based on its efficiency and behavior:
 *    - AVIF: Performs well at lower qualities.
 *    - WebP: Balances compression and quality effectively.
 *    - JPEG: Requires higher quality to minimize artifacts.
 *
 * ### How It Works:
 * - Combines resolution, file size, and complexity into a formula to determine quality.
 * - Adjusts the result for the target format.
 * - Ensures the final quality is between 0.1 (minimum) and 1.0 (maximum).
 *
 * @param width - Image width in pixels.
 * @param height - Image height in pixels.
 * @param fileSize - Original file size in bytes.
 * @param format - Target format ('image/avif', 'image/webp', 'image/jpeg').
 * @param complexity - Estimated image complexity (0.0 = simple, 1.0 = highly complex).
 * @returns A quality value between 0.1 and 1.0.
 */
const qualityCalculator = (
  width: number,
  height: number,
  fileSize: number,
  format: 'image/avif' | 'image/webp' | 'image/jpeg',
  complexity: number
): number => {
  const totalPixels = width * height;
  const resolutionFactor = Math.log10(totalPixels) / 7; // Normalize to [0, 1]
  const sizeFactor = Math.log10(fileSize) / 6; // Normalize to [0, 1]

  // Calculate dynamic quality
  let quality =
    1 - 0.3 * resolutionFactor - 0.2 * sizeFactor - 0.2 * complexity;

  // Apply format-specific adjustments
  quality *= formatFactor[format];

  return Math.max(0.1, Math.min(1, quality)); // Clamp to [0.1, 1.0]
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
      const quality = qualityCalculator(
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
