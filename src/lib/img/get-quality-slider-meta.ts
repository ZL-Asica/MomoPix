import { clamp } from '@zl-asica/react/utils'
import { getQualityState } from './get-quality-state'
import { qualityPresets } from './tranform-control'

interface GetQualitySliderMetaParams {
  quality: number
  targetFormat: SupportedFormat
}

export const QUALITY_SLIDER_MIN = 40
export const QUALITY_SLIDER_MAX = 100

export const getQualitySliderMeta = ({
  quality,
  targetFormat,
}: GetQualitySliderMetaParams) => {
  const sliderMin = QUALITY_SLIDER_MIN
  const sliderMax = QUALITY_SLIDER_MAX
  const sliderRange = sliderMax - sliderMin

  const qualityPreset = qualityPresets[targetFormat]

  const qualityState = getQualityState({
    quality,
    sliderMin,
    sliderMax,
    preset: qualityPreset,
  })

  const qualityPosPct = clamp(
    ((quality - sliderMin) / sliderRange) * 100,
    0,
    100,
  )

  const presetStartPct = qualityPreset
    ? clamp(
        ((qualityPreset.min - sliderMin) / sliderRange) * 100,
        0,
        100,
      )
    : 0

  const presetWidthPct = qualityPreset
    ? clamp(
        ((qualityPreset.max - qualityPreset.min) / sliderRange) * 100,
        0,
        100,
      )
    : 0

  return {
    sliderMin,
    sliderMax,
    qualityPreset,
    qualityState,
    qualityPosPct,
    presetStartPct,
    presetWidthPct,
  }
}
