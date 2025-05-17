import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

interface TransformControlsProps {
  targetFormat: SupportedFormat
  setTargetFormat: (format: SupportedFormat) => void
  quality: number
  setQuality: (quality: number) => void
  isProcessing: boolean
  onTransform: () => void
  hasImages: boolean
  useManualQuality: boolean
  setUseManualQuality: (value: boolean) => void
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
}: TransformControlsProps) => {
  return (
    <div className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="format-select">Output Format</Label>
        <Select
          value={targetFormat}
          onValueChange={(value: SupportedFormat) => setTargetFormat(value)}
        >
          <SelectTrigger id="format-select">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="webp">WebP</SelectItem>
            <SelectItem value="avif">AVIF</SelectItem>
            <SelectItem value="png">PNG</SelectItem>
            <SelectItem value="jpeg">JPEG</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="manual-quality" className="cursor-pointer">
            Manual Quality Control
          </Label>
          <Switch
            id="manual-quality"
            checked={useManualQuality}
            onCheckedChange={setUseManualQuality}
          />
        </div>

        {useManualQuality && (
          <div className="space-y-2">
            <Label htmlFor="quality-slider">
              Quality:
              {' '}
              {quality}
              %
            </Label>
            <Slider
              id="quality-slider"
              value={[quality]}
              onValueChange={([value]: number[]) => setQuality(value)}
              min={0}
              max={100}
              step={5}
              aria-label="Image quality"
            />
          </div>
        )}
      </div>

      <Button
        className="w-full"
        onClick={onTransform}
        disabled={isProcessing || !hasImages}
        aria-busy={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Transform Images'}
      </Button>
    </div>
  )
}

export default TransformControls
