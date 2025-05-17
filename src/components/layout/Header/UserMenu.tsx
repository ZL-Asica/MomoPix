'use client'

import { LogIn, LogOut, User } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import HeaderMenuButton from './HeaderMenuButton'

interface UserMenuProps {
  isMobile: boolean
  onClickHandler?: () => void
}

const UserMenu = ({ isMobile, onClickHandler }: UserMenuProps) => {
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    toast.success('Signed out successfully.')
    router.push('/')
    router.refresh()
  }

  if (status === 'loading') {
    return (
      <li className={`${isMobile ? 'mt-4 flex w-full justify-around' : 'flex justify-center gap-4'}`}>
        <Skeleton className="h-12 w-12 rounded-full" />
      </li>
    )
  }

  if (!session) {
    return (
      <HeaderMenuButton
        isMobile={isMobile}
        href="/login"
        label="Sign In"
        icon={<LogIn />}
      />
    )
  }

  return (
    <li className={`${isMobile ? 'mt-4 flex w-full justify-around' : 'flex justify-center gap-4'}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="text-hover-primary transition-all-300 group flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:text-gray-300 hover:bg-gray-200 hover:cursor-pointer dark:bg-gray-800 dark:hover:bg-gray-700"
            aria-label="User menu"
            onClick={onClickHandler}
          >
            <Avatar className="h-8 w-8">
              {session.user?.image !== null && session.user?.image !== undefined && session.user.image !== ''
                ? (
                    <AvatarImage
                      className="bg-gray-100 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 group-hover:cursor-pointer dark:bg-gray-800 dark:group-hover:bg-gray-700 transition-all-300 group-hover:scale-125"
                      src={session.user.image}
                      alt={session.user.name ?? 'User avatar'}
                    />
                  )
                : (
                    <AvatarFallback
                      className="bg-gray-100 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 group-hover:cursor-pointer dark:bg-gray-800 dark:group-hover:bg-gray-700 transition-all-300 group-hover:scale-125"
                    >
                      {session.user?.name?.charAt(0).toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  )}
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              href="/account"
              className="flex items-center gap-2"
              onClick={onClickHandler}
            >
              <User className="h-4 w-4" />
              Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              void handleSignOut()
              onClickHandler?.()
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

export default UserMenu
