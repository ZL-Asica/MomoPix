import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getQualitySliderMeta,
  QUALITY_SLIDER_MAX,
  QUALITY_SLIDER_MIN,
} from './get-quality-slider-meta'
import { getQualityState } from './get-quality-state'

// 1) Mock clamp (avoid external dependency and ensure consistent behavior in tests)
vi.mock('@zl-asica/react/utils', () => {
  return {
    clamp: (value: number, min: number, max: number) =>
      Math.min(max, Math.max(min, value)),
  }
})

// 2) Mock getQualityState
vi.mock('./get-quality-state', () => {
  return {
    getQualityState: vi.fn(() => 'mock-quality-state'),
  }
})

// 3) Mock qualityPresets
vi.mock('./tranform-control', () => {
  return {
    qualityPresets: {
      webp: { min: 70, max: 90 },
    },
  }
})

describe('getQualitySliderMeta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns sliderMin/sliderMax and calls getQualityState with correct params (with preset)', () => {
    const meta = getQualitySliderMeta({
      quality: 80,
      targetFormat: 'webp',
    })

    expect(meta.sliderMin).toBe(QUALITY_SLIDER_MIN)
    expect(meta.sliderMax).toBe(QUALITY_SLIDER_MAX)

    // preset should be returned
    expect(meta.qualityPreset).toEqual({ min: 70, max: 90 })

    // getQualityState called with computed slider bounds + preset
    expect(getQualityState).toHaveBeenCalledTimes(1)
    expect(getQualityState).toHaveBeenCalledWith({
      quality: 80,
      sliderMin: QUALITY_SLIDER_MIN,
      sliderMax: QUALITY_SLIDER_MAX,
      preset: { min: 70, max: 90 },
    })

    // qualityState is passthrough from mocked getQualityState
    expect(meta.qualityState).toBe('mock-quality-state')
  })

  it('computes percents correctly when preset exists', () => {
    // sliderMin=40 sliderMax=100 range=60
    // quality=80 => (80-40)/60*100 = 66.666...
    // preset min=70 => (70-40)/60*100 = 50
    // preset width=(90-70)/60*100 = 33.333...
    const meta = getQualitySliderMeta({
      quality: 80,
      targetFormat: 'webp',
    })

    expect(meta.qualityPosPct).toBeCloseTo(66.6667, 3)
    expect(meta.presetStartPct).toBeCloseTo(50, 6)
    expect(meta.presetWidthPct).toBeCloseTo(33.3333, 3)
  })

  it('clamps qualityPosPct to 0 when quality is below slider min', () => {
    const meta = getQualitySliderMeta({
      quality: 0,
      targetFormat: 'webp',
    })

    expect(meta.qualityPosPct).toBe(0)
  })

  it('clamps qualityPosPct to 100 when quality is above slider max', () => {
    const meta = getQualitySliderMeta({
      quality: 200,
      targetFormat: 'webp',
    })

    expect(meta.qualityPosPct).toBe(100)
  })

  it('handles missing preset: preset fields become 0 and preset is undefined', () => {
    const meta = getQualitySliderMeta({
      quality: 80,
      targetFormat: 'avif', // not in mocked qualityPresets
    })

    expect(meta.qualityPreset).toBeUndefined()
    expect(meta.presetStartPct).toBe(0)
    expect(meta.presetWidthPct).toBe(0)

    expect(getQualityState).toHaveBeenCalledTimes(1)
    expect(getQualityState).toHaveBeenCalledWith({
      quality: 80,
      sliderMin: QUALITY_SLIDER_MIN,
      sliderMax: QUALITY_SLIDER_MAX,
      preset: undefined,
    })
  })
})
