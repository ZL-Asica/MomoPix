import { Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useHideOnScrollDown } from '@zl-asica/react'
import { Menu, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getCurrentUserFn } from '@/functions/auth'
import HeaderMenu from './HeaderMenu'

const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const isHeaderVisible = useHideOnScrollDown(headerRef)
  const getCurrentUser = useServerFn(getCurrentUserFn)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const user = await getCurrentUser()
        if (!cancelled) {
          setIsAuthed(Boolean(user))
        }
      }
      catch (error) {
        console.error('Failed to load the current user:', error)
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

  useEffect(() => {
    const desktopBreakpoint = window.matchMedia('(min-width: 768px)')
    const closeForDesktop = (event_: MediaQueryListEvent) => {
      if (event_.matches) {
        setIsOpen(false)
      }
    }
    desktopBreakpoint.addEventListener('change', closeForDesktop)
    return () => {
      desktopBreakpoint.removeEventListener('change', closeForDesktop)
    }
  }, [])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
    menuButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const panel = menuRef.current
    const focusable = () => panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []
    const focusables = focusable()
    focusables[0]?.focus()

    const onKeyDown = (event_: KeyboardEvent) => {
      if (event_.key === 'Escape') {
        event_.preventDefault()
        closeMenu()
        return
      }
      if (event_.key === 'Tab' && focusables.length > 0) {
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (event_.shiftKey && document.activeElement === first) {
          event_.preventDefault()
          last.focus()
        }
        else if (!event_.shiftKey && document.activeElement === last) {
          event_.preventDefault()
          first.focus()
        }
      }
    }
    const onPointerDown = (event_: PointerEvent) => {
      const target = event_.target
      if (target instanceof Node && !panel?.contains(target) && !menuButtonRef.current?.contains(target)) {
        closeMenu()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [closeMenu, isOpen])

  // Avoid scrolling when the menu is open (mobile)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      menuRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    }
    else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 z-50 w-full bg-background shadow-md transition-transform-300
        ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
      `}
    >
      {/* Navigation Menu */}
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-4 bg-background">
        {/* Logo */}
        <Link
          to="/"
          aria-label="Navigate to Home Page"
          className="transition-all-300 text-hover-primary text-2xl font-bold text-foreground no-underline"
        >
          <p>MomoPix</p>
        </Link>

        {/* Mobile Menu Button */}
        <Button
          ref={menuButtonRef}
          type="button"
          variant="default"
          size="icon"
          className="transition-transform-300 z-60 h-12 w-12 rounded-full text-2xl shadow-md hover:scale-110 md:hidden"
          onClick={() => setIsOpen(open => !open)}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-controls="mobile-menu"
        >
          {isOpen ? <X strokeWidth={2.5} /> : <Menu strokeWidth={2.5} />}
        </Button>

        {/* Mobile Menu */}
        {isOpen && (
          <div
            id="mobile-menu"
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="transition-all-300 fixed right-0 top-0 z-50 h-screen w-1/2 bg-background shadow-lg md:hidden"
          >
            <HeaderMenu
              isMobile
              isLoadingUser={isLoadingUser}
              isAuthed={isAuthed}
              ulClassName="flex flex-col items-start gap-4 p-6"
              onClickHandler={closeMenu}
              onSignedOut={() => setIsAuthed(false)}
            />
          </div>
        )}

        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 h-screen w-screen bg-black/70 transition-opacity-300"
            onClick={(event_) => {
              event_.preventDefault()
              event_.stopPropagation()
              closeMenu()
            }}
            aria-hidden
          />
        )}

        {/* Desktop Menu */}
        <HeaderMenu
          isMobile={false}
          isLoadingUser={isLoadingUser}
          isAuthed={isAuthed}
          ulClassName="hidden md:flex md:gap-6"
          onSignedOut={() => setIsAuthed(false)}
        />
      </nav>
    </header>
  )
}

export default Header
