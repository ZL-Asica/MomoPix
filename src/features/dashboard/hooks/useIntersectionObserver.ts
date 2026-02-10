import { useEffect, useState } from 'react'

interface UseIntersectionObserverOptions {
  rootMargin?: string
  threshold?: number
  freezeOnceVisible?: boolean
}

/**
 * Tracks element visibility and supports near-viewport prefetch margins.
 *
 * @param options Observer options.
 * @param options.rootMargin Root margin passed to `IntersectionObserver`.
 * @param options.threshold Intersection threshold passed to `IntersectionObserver`.
 * @param options.freezeOnceVisible When true, observer stops after first intersection.
 * @returns Ref setter and latest intersection status.
 */
export function useIntersectionObserver<T extends Element>(options: UseIntersectionObserverOptions = {}) {
  const {
    rootMargin = '500px 0px',
    threshold = 0,
    freezeOnceVisible = true,
  } = options
  const [node, setNode] = useState<T | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    if (node === null) {
      return
    }
    if (freezeOnceVisible && isIntersecting) {
      return
    }
    if (typeof IntersectionObserver === 'undefined') {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setIsIntersecting(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry?.isIntersecting ?? false)
      },
      {
        rootMargin,
        threshold,
      },
    )

    observer.observe(node)
    return () => {
      observer.disconnect()
    }
  }, [freezeOnceVisible, isIntersecting, node, rootMargin, threshold])

  return {
    setNode,
    isIntersecting,
  }
}
