import { useLocation } from '@tanstack/react-router'
import { useTheme } from '@zl-asica/react'
import { House, LayoutDashboard, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import HeaderMenuButton from './HeaderMenuButton'
import UserMenu from './UserMenu'

interface MenuItem {
  href: string
  label: string
  icon: React.ReactNode
}

interface HeaderMenuProps {
  isMobile: boolean
  isLoadingUser: boolean
  isAuthed: boolean
  ulClassName?: string
  onClickHandler?: () => void
  onSignedOut: () => void
}

const HeaderMenu = ({
  isMobile,
  isLoadingUser,
  isAuthed,
  ulClassName,
  onClickHandler,
  onSignedOut,
}: HeaderMenuProps) => {
  const currentPath = useLocation().pathname
  const { isDarkTheme, toggleTheme } = useTheme('momo-pix-theme-color', 7)

  const menuItems: MenuItem[] = [
    { href: '/', label: 'Home', icon: <House /> },
    ...(isAuthed ? [{ href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard /> }] : []),
  ]

  return (
    <ul className={`gap-4 ${ulClassName}`}>
      {menuItems.map(item => (
        <HeaderMenuButton
          key={`header-menu-item-${item.href}-${item.label}`}
          isMobile={isMobile}
          currentPath={currentPath}
          href={item.href}
          label={item.label}
          icon={item.icon}
          onClickHandler={onClickHandler}
        />
      ))}

      {/* User Menu */}
      <UserMenu
        isMobile={isMobile}
        isLoadingUser={isLoadingUser}
        isAuthed={isAuthed}
        onClickHandler={onClickHandler}
        onSignedOut={onSignedOut}
      />

      {/* Theme Switch */}
      <li className={`${isMobile ? 'mt-4 flex w-full justify-around' : 'flex justify-center gap-4'}`}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-hover-primary transition-all-300 group h-12 w-12 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Toggle Theme"
          onClick={() => {
            toggleTheme()
            onClickHandler && onClickHandler()
          }}
        >
          <span className="flex h-6 w-6 items-center justify-center transition-all-300 group-hover:scale-125 ">
            {isDarkTheme ? <Sun className="h-full w-full" /> : <Moon className="h-full w-full" />}
          </span>
        </Button>
      </li>
    </ul>
  )
}

export default HeaderMenu
