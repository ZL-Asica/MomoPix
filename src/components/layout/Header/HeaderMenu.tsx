'use client'

import { useTheme } from '@zl-asica/react'
import { House, Images, Moon, Sun } from 'lucide-react'
import { usePathname } from 'next/navigation'
import HeaderMenuButton from './HeaderMenuButton'
import UserMenu from './UserMenu'

interface MenuItem {
  href: string
  label: string
  icon: React.ReactNode
}

interface HeaderMenuProps {
  isMobile: boolean
  ulClassName?: string
  onClickHandler?: () => void
}

const HeaderMenu = ({ isMobile, ulClassName, onClickHandler }: HeaderMenuProps) => {
  const currentPath = usePathname()
  const { isDarkTheme, toggleTheme } = useTheme('momo-pix-theme-color', 7)

  const menuItems: MenuItem[] = [
    { href: '/', label: 'Home', icon: <House /> },
    { href: '/images', label: 'Images', icon: <Images /> },
  ]

  return (
    <ul className={`gap-4 ${ulClassName}`}>
      {menuItems.map(item => (
        <HeaderMenuButton
          key={item.href}
          isMobile={isMobile}
          currentPath={currentPath}
          href={item.href}
          label={item.label}
          icon={item.icon}
        />
      ))}

      {/* User Menu */}
      <UserMenu isMobile={isMobile} onClickHandler={onClickHandler} />

      {/* Theme Switch */}
      <li className={`${isMobile ? 'mt-4 flex w-full justify-around' : 'flex justify-center gap-4'}`}>
        <button
          type="button"
          className="text-hover-primary transition-all-300 group flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:text-gray-300 hover:bg-gray-200 hover:cursor-pointer dark:bg-gray-800 dark:hover:bg-gray-700"
          aria-label="Toggle Theme"
          onClick={() => {
            toggleTheme()
            onClickHandler && onClickHandler()
          }}
        >
          <span className="flex h-6 w-6 items-center justify-center transition-all-300 group-hover:scale-125 ">
            {isDarkTheme ? <Sun className="h-full w-full" /> : <Moon className="h-full w-full" />}
          </span>
        </button>
      </li>
    </ul>
  )
}

export default HeaderMenu
