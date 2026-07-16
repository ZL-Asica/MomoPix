import { Wand2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import OutputFormat from './OutputFormat'
import QualityControl from './QualityControl'

interface TransformControlsProps {
  targetFormat: SupportedFormat
  setTargetFormat: (format: SupportedFormat) => void
  quality: number
  setQuality: (quality: number) => void
  isProcessing: boolean
  onTransform: () => Promise<void> | void
  hasImages: boolean
  useManualQuality: boolean
  setUseManualQuality: (value: boolean) => void
  retainOriginal: boolean
  setRetainOriginal: (value: boolean) => void
  actionLabel?: string
}

const TransformControls = ({
  targetFormat,
  setTargetFormat,
  quality,
  setQuality,
  isProcessing,
  onTransform,
  hasImages,
  useManualQuality,
  setUseManualQuality,
  retainOriginal,
  setRetainOriginal,
  actionLabel = 'Transform images',
}: TransformControlsProps) => {
  const isDisabled = isProcessing || !hasImages
  const showNoImagesHint = !hasImages && !isProcessing

  return (
    <section
      aria-label="Transform settings"
      className="mt-6 space-y-5 rounded-lg border px-4 py-4 text-sm dark:border-gray-800"
    >
      {/* Top: title + current value + dynamic status Badge */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-foreground">
            Transform settings
          </h2>
          <p className="text-xs text-muted-foreground">
            Choose output format and, if needed, fine-tune quality.
          </p>
        </div>
        {isProcessing && (
          <span className="text-xs font-medium text-muted-foreground">
            Processing…
          </span>
        )}
      </div>

      {/* Output format: radio/segmented */}
      <OutputFormat
        targetFormat={targetFormat}
        isProcessing={isProcessing}
        setTargetFormat={setTargetFormat}
        useManualQuality={useManualQuality}
        setUseManualQuality={setUseManualQuality}
      />

      <Separator />

      <QualityControl
        quality={quality}
        setQuality={setQuality}
        targetFormat={targetFormat}
        isProcessing={isProcessing}
        useManualQuality={useManualQuality}
        setUseManualQuality={setUseManualQuality}
      />

      <Separator />

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="retain-original" className="text-xs font-medium">Keep original in hosting storage</Label>
          <p className="text-xs text-muted-foreground">
            Stores the source beside the hosted image and WebP thumbnail, and counts it toward quota.
          </p>
        </div>
        <Switch
          id="retain-original"
          checked={retainOriginal}
          disabled={isProcessing}
          onCheckedChange={setRetainOriginal}
          aria-label="Keep original image in hosting storage"
        />
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <LoadingButton
          className="w-full"
          loading={isProcessing}
          loadingText="Processing..."
          onClick={() => {
            void onTransform()
          }}
          disabled={isDisabled}
          aria-busy={isProcessing}
        >
          <Wand2 className="mr-2 h-4 w-4" aria-hidden="true" />
          {actionLabel}
        </LoadingButton>

        {showNoImagesHint && (
          <p className="text-center text-xs text-muted-foreground">
            Add some images above to enable transformation.
          </p>
        )}
      </div>
    </section>
  )
}

export default TransformControls
