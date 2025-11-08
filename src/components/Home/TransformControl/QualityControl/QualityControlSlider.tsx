import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { getQualitySliderMeta } from '@/lib/img/get-quality-slider-meta'
import { formatLabels } from '@/lib/img/tranform-control'

interface QualityControlSliderProps {
  quality: number
  setQuality: (quality: number) => void
  targetFormat: SupportedFormat
  isProcessing: boolean
}

const QualityControlSlider = ({
  quality,
  setQuality,
  targetFormat,
  isProcessing,
}: QualityControlSliderProps) => {
  const {
    sliderMin,
    sliderMax,
    qualityPreset,
    qualityState,
    qualityPosPct,
    presetStartPct,
    presetWidthPct,
  } = getQualitySliderMeta({ quality, targetFormat })

  return (
    <div className="space-y-3">
      {/* Top: label + current value + dynamic status Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Label
            htmlFor="quality-slider"
            className="text-xs font-medium text-foreground"
          >
            Quality
          </Label>
          <Badge
            variant="outline"
            className={[
              'border px-1.5 py-0 text-[10px]',
              qualityState.intentClass,
            ].join(' ')}
          >
            {qualityState.label}
          </Badge>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {quality}
          %
        </span>
      </div>

      {/* Slider */}
      <Slider
        id="quality-slider"
        value={[quality]}
        onValueChange={([value]) => setQuality(value)}
        min={sliderMin}
        max={sliderMax}
        step={5}
        aria-label="Image quality"
        disabled={isProcessing}
      />

      <div className="space-y-1">
        <div className="relative mt-0.5 h-1.5 w-full rounded-full bg-muted/70">
          {qualityPreset && (
            <div
              className="absolute h-full rounded-full bg-emerald-500/25"
              style={{
                left: `${presetStartPct}%`,
                width: `${presetWidthPct}%`,
              }}
            />
          )}
          <div
            className="absolute -top-0.5 h-2.5 w-0.5 rounded-full bg-primary"
            style={{
              left: `${qualityPosPct}%`,
              transform: 'translateX(-50%)',
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Smaller files</span>
          <span>Sharper details</span>
        </div>
      </div>

      {/* Recommendation hint changes with slider */}
      <p className="text-xs text-muted-foreground">
        {qualityPreset && (
          <>
            Recommended for
            {' '}
            {formatLabels[targetFormat]}
            :
            {' '}
            {qualityPreset.min}
            –
            {qualityPreset.max}
            %
            {' · '}
          </>
        )}
        {qualityState.description}
      </p>
    </div>
  )
}

export default QualityControlSlider
