import { Link, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { LogIn, LogOut, User } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { logoutFn } from '@/functions/auth'
import HeaderMenuButton from './HeaderMenuButton'

interface UserMenuProps {
  isMobile: boolean
  isLoadingUser: boolean
  isAuthed: boolean
  onClickHandler?: () => void
  onSignedOut: () => void
}

const UserMenu = ({
  isMobile,
  isLoadingUser,
  isAuthed,
  onClickHandler,
  onSignedOut,
}: UserMenuProps) => {
  const logout = useServerFn(logoutFn)
  const navigate = useNavigate()
  const [isSigningOut, startSignout] = useTransition()

  const handleSignout = () => {
    startSignout(async () => {
      try {
        const result = await logout()
        if (result !== true) {
          toast.error('Error signing out. Please try again.', { description: result.error })
          return
        }

        onSignedOut()
        toast.success('Signed out successfully.')
        await navigate({ to: '/login' })
      }
      catch (error) {
        toast.error('Error signing out. Please try again.')
        console.error('Error signing out:', error)
      }
    })
  }

  if (isLoadingUser) {
    return (
      <li className="flex w-full justify-center">
        <Spinner />
      </li>
    )
  }

  if (!isAuthed) {
    return (
      <HeaderMenuButton
        isMobile={isMobile}
        href="/login"
        label="Sign In"
        icon={<LogIn />}
        onClickHandler={onClickHandler}
      />
    )
  }

  if (isMobile) {
    return (
      <>
        <li className="flex w-full">
          <Link
            to="/dashboard"
            className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-lg font-medium no-underline hover:bg-gray-light"
            onClick={onClickHandler}
          >
            <User className="h-5 w-5" aria-hidden />
            Account
          </Link>
        </li>
        <li className="flex w-full">
          <Button
            type="button"
            variant="ghost"
            className="flex w-full justify-start gap-4 px-4 py-3 text-lg font-medium"
            onClick={() => {
              handleSignout()
              onClickHandler?.()
            }}
          >
            {isSigningOut ? <Spinner className="h-5 w-5" /> : <LogOut className="h-5 w-5" aria-hidden />}
            Sign out
          </Button>
        </li>
      </>
    )
  }

  return (
    <li className="flex justify-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-hover-primary transition-all-300 group h-12 w-12 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="User menu"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback
                className="bg-gray-100 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 group-hover:cursor-pointer dark:bg-gray-800 dark:group-hover:bg-gray-700 transition-all-300 group-hover:scale-125"
              >
                M
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link
              to="/dashboard"
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
              handleSignout()
              onClickHandler?.()
            }}
          >
            {isSigningOut
              ? <Spinner className="h-4 w-4" />
              : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </>
                )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}

export default UserMenu
