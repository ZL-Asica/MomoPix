'use client'

import { Turnstile } from '@marsidev/react-turnstile'
import { redirect } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface ActionFormProps {
  formAction: (prevState: any, formData: FormData) => Promise<ActionResponse>
  buttonText: string
  buttonLoadingText: string
  children: React.ReactNode
}

const ActionForm = ({
  formAction,
  buttonText,
  buttonLoadingText,
  children,
}: ActionFormProps) => {
  // eslint-disable-next-line node/prefer-global/process
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const isTurnstileEnabled = turnstileSiteKey !== null && turnstileSiteKey !== undefined && turnstileSiteKey !== ''
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [state, action, pending] = useActionState(formAction, undefined)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
      redirect('/')
    }
    else if (state?.success === false && state?.message) {
      toast.error(state.message)
    }
  }, [state])

  const handleSubmit = async (formData: FormData): Promise<void> => {
    if (turnstileToken === null || turnstileToken === '') {
      toast.error('Please complete the Turnstile verification')
      return
    }
    formData.append('turnstileToken', turnstileToken)
    return action(formData)
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-4"
    >
      <div className="flex flex-col items-center space-y-2">
        {children}
        {isTurnstileEnabled
          && (
            <Turnstile
              className="py-2"
              siteKey={turnstileSiteKey}
              onSuccess={token => setTurnstileToken(token)}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
            />
          )}
      </div>
      <Button
        className="w-full disabled:opacity-50"
        type="submit"
        disabled={pending || (isTurnstileEnabled && (turnstileToken === null || turnstileToken === ''))}
      >
        {pending ? buttonLoadingText : buttonText}
      </Button>
    </form>
  )
}

export default ActionForm
