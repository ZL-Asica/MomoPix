import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="mb-2 mt-10 w-full">
      <div className="mx-auto max-w-7xl px-4 py-4 text-center space-y-2 text-base">
        <p className="text-gray-dark">
          {`© ${new Date().getFullYear()} ZL Asica | All rights reserved.`}
        </p>
        <p className="text-gray-dark">
          {/* Please leave this credit intact. Really appreciate it! */}
          Powered by
          {' '}
          <Link
            href="https://github.com/ZL-Asica/MomoPix"
            target="_blank"
            rel="noopener noreferrer"
            className="text-hover-primary underline-interactive"
          >
            MomoPix
          </Link>
          {' '}
          · Crafted by
          {' '}
          <Link
            href="https://zla.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-hover-primary underline-interactive"
          >
            ZL Asica
          </Link>
        </p>
      </div>
    </footer>
  )
}

export default Footer
