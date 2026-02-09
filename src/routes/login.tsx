import { Turnstile } from '@marsidev/react-turnstile'
import { useForm } from '@tanstack/react-form'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { VITE_TURNSTILE_SITE_KEY } from '@/client-constants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { getAuthConfigFn, getCurrentUserFn, loginFn } from '@/functions/auth'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (user) {
      throw redirect({ to: '/' })
    }
    return null
  },
  component: LoginPage,
})

function LoginPage() {
  const login = useServerFn(loginFn)
  const fetchAuthConfig = useServerFn(getAuthConfigFn)
  const [authConfig, setAuthConfig] = useState<{ enabled: boolean, missing: string[] }>({
    enabled: false,
    missing: [],
  })
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const config = await fetchAuthConfig()
        if (!cancelled) {
          setAuthConfig(config)
        }
      }
      finally {
        if (!cancelled) {
          setIsLoadingConfig(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fetchAuthConfig])

  const form = useForm({
    defaultValues: {
      token: '',
      turnstileToken: '',
    },
    onSubmit: async ({ value }) => {
      if (!authConfig.enabled) {
        toast.error('Login disabled', {
          description: `Missing env vars: ${authConfig.missing.join(', ')}`,
        })
        return
      }

      try {
        const response = await login({
          data: {
            token: value.token,
            turnstileToken: value.turnstileToken || undefined,
          },
        })

        if (response !== true) {
          toast.error('Login failed', { description: response.error })
          return
        }

        toast.success('Logged in')
        window.location.href = '/'
      }
      catch (error) {
        toast.error('Login error', {
          description: error instanceof Error ? error.message : String(error),
        })
      }
    },
  })

  return (
    <div className="flex w-full max-w-md items-center justify-center mx-auto p-4 mt-20">
      <div className="w-full max-w-md mx-auto">
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 border-2 shadow-xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl">Login</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter your auth token to continue.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {!isLoadingConfig && !authConfig.enabled && (
              <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                Login is disabled because required env vars are missing:
                {' '}
                {authConfig.missing.join(', ')}
                . Set them in your environment and restart the server.
              </div>
            )}

            <form
              onSubmit={(event_) => {
                event_.preventDefault()
                event_.stopPropagation()
                void form.handleSubmit()
              }}
              className="space-y-4"
            >
              <form.Field
                name="token"
                validators={{
                  onChange: ({ value }) => (!value.trim() ? 'Token is required' : undefined),
                }}
              >
                {field => (
                  <div className="space-y-1">
                    <Input
                      placeholder="Auth token"
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={event_ => field.handleChange(event_.target.value)}
                      className="rounded-full border-2"
                      autoComplete="current-password"
                      disabled={isLoadingConfig || !authConfig.enabled}
                    />
                    {field.state.meta.isDirty && !field.state.meta.isValid && (
                      <p className="text-xs text-red-500">{field.state.meta.errors.join(', ')}</p>
                    )}
                  </div>
                )}
              </form.Field>

              {authConfig.enabled && (
                <div className="flex justify-center">
                  <Turnstile
                    siteKey={VITE_TURNSTILE_SITE_KEY}
                    onSuccess={token => form.setFieldValue('turnstileToken', token)}
                    onError={() => {
                      form.setFieldValue('turnstileToken', '')
                      toast.error('Turnstile failed, please try again.')
                    }}
                    onExpire={() => form.setFieldValue('turnstileToken', '')}
                    options={{ theme: 'auto' }}
                  />
                </div>
              )}

              <form.Subscribe
                selector={state => ({
                  canSubmit: state.canSubmit,
                  isSubmitting: state.isSubmitting,
                  hasTurnstile: !!state.values.turnstileToken,
                })}
              >
                {({ canSubmit, isSubmitting, hasTurnstile }) => (
                  <Button
                    type="submit"
                    disabled={isLoadingConfig || !authConfig.enabled || isSubmitting || !canSubmit || !hasTurnstile}
                    className="w-full rounded-full"
                    size="lg"
                  >
                    {isSubmitting
                      ? (
                          <>
                            <Spinner className="h-4 w-4 mr-2" />
                            Logging in...
                          </>
                        )
                      : (
                          'Login'
                        )}
                  </Button>
                )}
              </form.Subscribe>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
