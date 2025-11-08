export const formatLabels: Record<SupportedFormat, string> = {
  webp: 'WebP',
  avif: 'AVIF',
  png: 'PNG',
  jpeg: 'JPEG',
}

export const formatDescriptions: Record<SupportedFormat, string> = {
  webp: 'Balanced for web, widely supported.',
  avif: 'Smaller files, great for photos.',
  png: 'Lossless, best for UI / graphics.',
  jpeg: 'Classic format, highly compatible.',
}

// Recommend quality range, only valid for lossy formats
export const qualityPresets: Partial<Record<SupportedFormat, QualityPreset>> = {
  webp: { min: 70, max: 85, note: 'Good balance for most web images.' },
  avif: { min: 55, max: 75, note: 'High compression with good detail.' },
  jpeg: { min: 70, max: 90, note: 'Higher values keep more photo detail.' },
}

export const LOSSY_FORMATS: SupportedFormat[] = ['webp', 'avif', 'jpeg']
export const RECOMMENDED_DEFAULT: SupportedFormat = 'webp'
