import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { formatDescriptions, formatLabels, LOSSY_FORMATS, RECOMMENDED_DEFAULT } from '@/lib/img/tranform-control'

interface OutputFormatProps {
  targetFormat: SupportedFormat
  isProcessing: boolean
  setTargetFormat: (format: SupportedFormat) => void
  useManualQuality: boolean
  setUseManualQuality: (value: boolean) => void
}

const OutputFormat = ({
  targetFormat,
  isProcessing,
  setTargetFormat,
  useManualQuality,
  setUseManualQuality,
}: OutputFormatProps) => {
  const handleFormatChange = (value: SupportedFormat) => {
    const fmt = value
    setTargetFormat(fmt)

    // Turn off manual quality control on lossless
    if (!LOSSY_FORMATS.includes(fmt) && useManualQuality) {
      setUseManualQuality(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">Output format</Label>
      {/* NOTE:
       * We intentionally use native radios here. Radix RadioGroup (v1.3.8) can enter a
       * ref/setState feedback loop on React 19 during frequent rerenders (for example,
       * when compression starts and list state updates). Native inputs keep the same UX
       * without the ref churn that caused "Maximum update depth exceeded".
       */}
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Output format">
        {(Object.keys(formatLabels) as SupportedFormat[]).map((format) => {
          const active = targetFormat === format
          const recommended = format === RECOMMENDED_DEFAULT
          return (
            <Label
              key={format}
              className={[
                'flex cursor-pointer flex-col rounded-md border px-3 py-2 text-xs transition-colors',
                isProcessing ? 'opacity-60' : '',
                active
                  ? 'border-primary/70 bg-primary/5'
                  : 'border-border hover:bg-muted/60',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="home-output-format"
                    value={format}
                    checked={active}
                    disabled={isProcessing}
                    onChange={() => handleFormatChange(format)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-xs font-medium">
                    {formatLabels[format]}
                  </span>
                </div>
                {recommended && (
                  <Badge
                    variant={active ? 'default' : 'outline'}
                    className={`px-1.5 py-0 text-[10px] ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'border-primary/40 text-primary'
                    }`}
                  >
                    Recommended
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDescriptions[format]}
              </p>
            </Label>
          )
        })}
      </div>
    </div>

  )
}

export default OutputFormat
