import type { StorageMeta } from '@/lib/storage/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatBytes } from '@/lib/storage/format'

interface UsageSummaryProps {
  meta: StorageMeta | null
  totalSpaceBytes: number
}

export function UsageSummary({ meta, totalSpaceBytes }: UsageSummaryProps) {
  const usedPercent = Math.min(100, ((meta?.totalBytesUsed ?? 0) / totalSpaceBytes) * 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Space Used</CardTitle>
        <CardDescription>
          {formatBytes(meta?.totalBytesUsed ?? 0)}
          {' '}
          /
          {' '}
          {formatBytes(totalSpaceBytes)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={usedPercent} />
      </CardContent>
    </Card>
  )
}
