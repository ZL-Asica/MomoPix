import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'

interface CompressionRingProps {
  percent: number
  positive: boolean
}

const CompressionRing = ({ percent, positive }: CompressionRingProps) => {
  const clamped = Math.max(0, Math.min(100, percent))
  const radius = 14
  const circumference = 2 * Math.PI * radius

  const progress = useSpring(0, { stiffness: 170, damping: 24, mass: 0.3 })
  useEffect(() => {
    progress.set(clamped)
  }, [clamped, progress])

  const dashOffset = useTransform(
    progress,
    v => `${circumference * (1 - v / 100)}`,
  )

  const accent = positive ? '#22c55e' : '#ef4444'

  return (
    <motion.div
      aria-hidden="true"
      className="relative h-8 w-8 shrink-0"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.05 }}
    >
      <svg viewBox="0 0 32 32" className="h-8 w-8 -rotate-90">
        {/* Route */}
        <circle
          cx="16"
          cy="16"
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.25)"
          strokeWidth="4"
        />
        {/* Progress */}
        <motion.circle
          cx="16"
          cy="16"
          r={radius}
          fill="none"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>
      {/* Inner value */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-medium text-gray-700 dark:text-gray-200">
          {Math.round(clamped)}
          %
        </span>
      </div>
    </motion.div>
  )
}

export default CompressionRing
