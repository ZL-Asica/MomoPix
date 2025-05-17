import Link from 'next/link'

interface HeaderMenuButtonProps {
  isMobile: boolean
  currentPath?: string
  href: string
  label: string
  icon: React.ReactNode
  onClickHandler?: () => void
}

const HeaderMenuButton = ({
  isMobile,
  currentPath,
  href,
  label,
  icon,
  onClickHandler,
}: HeaderMenuButtonProps) => {
  return (
    <>
      <li className="group relative flex w-full items-center justify-center rounded-lg hover:bg-gray-light">
        <Link
          href={href}
          title={label}
          className={`relative flex w-full items-center gap-4 px-4 py-3 text-lg font-medium no-underline transition-all-300 group-hover:text-primary
                ${href !== '/' && currentPath !== undefined && currentPath !== null && currentPath.startsWith(href) ? 'text-primary' : ''}
                `}
          onClick={onClickHandler}
          aria-label={label}
        >
          <span
            className="inline-block transition-transform duration-300 ease-in-out group-hover:scale-125"
            aria-hidden
          >
            {icon}
          </span>
          <p className="whitespace-nowrap">
            {label}
          </p>
        </Link>
      </li>

      {/* Mobile - Divider */}
      {isMobile && (
        <li className="w-full" aria-hidden>
          <div className="h-[1px] w-full bg-gradient-to-r from-gray-light via-primary-300 to-gray-light" />
        </li>
      )}
    </>
  )
}

export default HeaderMenuButton
