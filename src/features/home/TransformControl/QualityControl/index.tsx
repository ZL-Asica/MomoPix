import { Label } from '@/components/ui/label'
import { LOSSY_FORMATS } from '@/lib/img/tranform-control'
import QualityControlSlider from './QualityControlSlider'

interface QualityControlProps {
  quality: number
  setQuality: (quality: number) => void
  targetFormat: SupportedFormat
  isProcessing: boolean
  useManualQuality: boolean
  setUseManualQuality: (value: boolean) => void
}

const QualityControl = ({
  quality,
  setQuality,
  targetFormat,
  isProcessing,
  useManualQuality,
  setUseManualQuality,
}: QualityControlProps) => {
  const isLossy = LOSSY_FORMATS.includes(targetFormat)

  const handleQualityToggle = (checked: boolean) => {
    if (!isLossy) {
      return
    }
    setUseManualQuality(checked)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Label
            htmlFor="manual-quality"
            className="text-xs font-medium"
          >
            Manual quality control
          </Label>
          {isLossy
            ? (
                <p className="max-w-xs text-xs text-muted-foreground">
                  Leave this off for an automatic balance. Turn it on if you need
                  explicit control over file size vs. detail.
                </p>
              )
            : (
                <p className="max-w-xs text-xs text-muted-foreground">
                  PNG is lossless, so quality does not apply. Use WebP or AVIF if
                  you want smaller files.
                </p>
              )}
        </div>
        {/* NOTE:
         * Keep this as a native checkbox. Radix Switch can trigger a ref-driven
         * update loop on React 19 during compress rerenders in this view.
         */}
        <input
          id="manual-quality"
          type="checkbox"
          role="switch"
          aria-checked={isLossy && useManualQuality}
          checked={isLossy && useManualQuality}
          onChange={event_ => handleQualityToggle(event_.target.checked)}
          disabled={!isLossy || isProcessing}
          className="h-4 w-4 shrink-0 cursor-pointer rounded border border-input"
        />
      </div>

      {isLossy && useManualQuality && (
        <QualityControlSlider
          quality={quality}
          setQuality={setQuality}
          targetFormat={targetFormat}
          isProcessing={isProcessing}
        />
      )}
    </div>
  )
}

export default QualityControl
