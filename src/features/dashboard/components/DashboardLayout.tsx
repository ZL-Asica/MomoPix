import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'

interface DashboardLayoutProps {
  title: string
  description: string
  sidebar: React.ReactNode
  children: React.ReactNode
  mobileSidebarOpen: boolean
  onMobileSidebarOpenChange: (open: boolean) => void
}

export function DashboardLayout({
  title,
  description,
  sidebar,
  children,
  mobileSidebarOpen,
  onMobileSidebarOpenChange,
}: DashboardLayoutProps) {
  return (
    <div className="container mx-auto space-y-4 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <Drawer direction="left" open={mobileSidebarOpen} onOpenChange={onMobileSidebarOpenChange}>
          <DrawerTrigger asChild>
            <Button variant="outline" className="lg:hidden">Albums</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Albums</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-6">{sidebar}</div>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="hidden lg:block">{sidebar}</aside>
        <section className="space-y-4">{children}</section>
      </div>
    </div>
  )
}
