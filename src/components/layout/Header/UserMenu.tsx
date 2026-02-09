import { Link, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { LogIn, LogOut, User } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { getCurrentUserFn, logoutFn } from '@/functions/auth'
import HeaderMenuButton from './HeaderMenuButton'

interface UserMenuProps {
  isMobile: boolean
  onClickHandler?: () => void
}

const UserMenu = ({
  isMobile,
  onClickHandler,
}: UserMenuProps) => {
  const logout = useServerFn(logoutFn)
  const getCurrentUser = useServerFn(getCurrentUserFn)
  const navigate = useNavigate()
  const [isSigningOut, startSignout] = useTransition()
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const user = await getCurrentUser()
        if (!cancelled) {
          setIsAuthed(Boolean(user))
        }
      }
      finally {
        if (!cancelled) {
          setIsLoadingUser(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [getCurrentUser])

  const handleSignout = () => {
    startSignout(async () => {
      try {
        const result = await logout()
        if (result !== true) {
          toast.error('Error signing out. Please try again.', { description: result.error })
          return
        }

        setIsAuthed(false)
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
              <AvatarFallback
                className="bg-gray-100 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 group-hover:cursor-pointer dark:bg-gray-800 dark:group-hover:bg-gray-700 transition-all-300 group-hover:scale-125"
              >
                M
              </AvatarFallback>
            </Avatar>
          </button>
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
