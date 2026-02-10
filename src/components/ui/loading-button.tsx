"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type LoadingButtonProps = React.ComponentProps<typeof Button> & {
  loading: boolean
  loadingText?: string
}

/**
 * Button variant that displays a spinner and disables interaction while pending.
 *
 * @param loading When true, shows spinner state and disables the button.
 * @param loadingText Optional text override while pending.
 * @returns Rendered button that mirrors shadcn button props.
 */
const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, loadingText, disabled, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || props["aria-busy"] === true}
        {...props}
      >
        {loading
          ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {loadingText ?? children}
              </>
            )
          : children}
      </Button>
    )
  }
)

LoadingButton.displayName = "LoadingButton"

export { LoadingButton }
