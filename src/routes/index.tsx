import { createFileRoute } from '@tanstack/react-router'
import { HomeFeature } from '@/features/home'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return <HomeFeature />
}
