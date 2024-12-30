import './Skeleton.css'

interface SkeletonProperties {
  variant?: 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
}

function Skeleton({
  variant = 'rectangular',
  width,
  height,
}: SkeletonProperties) {
  return (
    <div
      className={`skeleton ${variant}`}
      style={{
        width: width ?? '100%',
        height: height ?? 'auto',
      }}
    >
    </div>
  )
}

export default Skeleton
