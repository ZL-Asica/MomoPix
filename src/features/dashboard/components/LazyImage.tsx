import { AlertCircle, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useIntersectionObserver } from '@/features/dashboard/hooks/useIntersectionObserver'
import { cn } from '@/lib/utils'

const THUMBNAIL_SIZE = 48

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  rootMargin?: string
}

/**
 * Renders a lazy thumbnail with near-viewport eager loading, skeleton, and retry fallback.
 */
export function LazyImage({
  src,
  alt,
  className,
  rootMargin = '0px',
}: LazyImageProps) {
  const [retryToken, setRetryToken] = useState(0)
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const { setNode, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
    rootMargin,
    // Thumbnails must be removed after leaving the viewport. Keeping every
    // decoded source image mounted grows memory with each row the user sees.
    freezeOnceVisible: false,
  })

  const resolvedSrc = useMemo(() => {
    const joiner = src.includes('?') ? '&' : '?'
    return retryToken === 0 ? src : `${src}${joiner}retry=${retryToken}`
  }, [retryToken, src])

  const isLoaded = loadedSrc === resolvedSrc
  const isFailed = failedSrc === resolvedSrc

  if (isFailed) {
    return (
      <div
        ref={setNode}
        className={cn(
          'relative flex items-center justify-center overflow-hidden border bg-muted text-muted-foreground',
          className,
        )}
      >
        <AlertCircle className="h-4 w-4" aria-hidden />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute right-0.5 bottom-0.5 h-5 w-5"
          onClick={() => {
            setRetryToken(previous => previous + 1)
          }}
          aria-label={`Retry loading ${alt}`}
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div ref={setNode} className={cn('relative overflow-hidden', className)}>
      {isIntersecting && (
        <img
          src={resolvedSrc}
          alt={alt}
          width={THUMBNAIL_SIZE}
          height={THUMBNAIL_SIZE}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-150',
            isLoaded ? 'opacity-100' : 'opacity-0',
          )}
          decoding="async"
          onLoad={() => {
            setLoadedSrc(resolvedSrc)
          }}
          onError={() => {
            setFailedSrc(resolvedSrc)
          }}
        />
      )}
      {!isLoaded && (
        <Skeleton className="pointer-events-none absolute inset-0 h-full w-full rounded-none" />
      )}
    </div>
  )
}
