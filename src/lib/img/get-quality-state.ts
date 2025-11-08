export const getQualityState = (params: {
  quality: number
  sliderMin: number
  sliderMax: number
  preset?: { min: number, max: number, note: string }
}): QualityState => {
  const { quality, sliderMin, sliderMax, preset } = params

  // More talent when have preset: lower, within, higher
  if (preset) {
    const { min, max, note } = preset

    if (quality < min) {
      return {
        label: 'Aggressive compression',
        description:
          'Prioritizes file size. May introduce visible artifacts in detailed areas.',
        intentClass: 'border-amber-500/60 text-amber-600 dark:text-amber-400',
      }
    }

    if (quality > max) {
      return {
        label: 'High quality',
        description:
          'Keeps more detail and reduces artifacts, but file sizes will be larger.',
        intentClass: 'border-sky-500/60 text-sky-600 dark:text-sky-400',
      }
    }

    return {
      label: 'Balanced',
      description: `${note}`,
      intentClass: 'border-emerald-500/60 text-emerald-600 dark:text-emerald-400',
    }
  }

  // If no preset, use the slide's position to roughly split 3 levels
  const ratio
    = sliderMax > sliderMin
      ? (quality - sliderMin) / (sliderMax - sliderMin)
      : 0.5

  if (ratio < 0.33) {
    return {
      label: 'More compression',
      description:
        'Smaller files with more aggressive compression. Fine details may be lost.',
      intentClass: 'border-amber-500/60 text-amber-600 dark:text-amber-400',
    }
  }

  if (ratio > 0.66) {
    return {
      label: 'More detail',
      description:
        'Keeps more detail and smoother gradients at the cost of larger files.',
      intentClass: 'border-sky-500/60 text-sky-600 dark:text-sky-400',
    }
  }

  return {
    label: 'Balanced',
    description: 'Reasonable tradeoff between size and visual quality.',
    intentClass: 'border-emerald-500/60 text-emerald-600 dark:text-emerald-400',
  }
}
