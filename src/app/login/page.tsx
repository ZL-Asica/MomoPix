import { redirect } from 'next/navigation'
import { auth } from '@/app/auth'
import { ActionForm } from '@/components/common'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { signInWithResend } from '@/lib/actions'

export default async function LoginPage() {
  const session = await auth()

  if (session) {
    redirect('/')
  }

  return (
    <div className="flex items-center justify-center pt-2 sm:pt-10 md:pt-24 lg:pt-32 xl:pt-40">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sign in
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your account.
            <br />
            If you don&apos;t have an account, this will create one for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm
            formAction={signInWithResend}
            buttonText="Sign in with Email"
            buttonLoadingText="Signing in..."
          >
            <Input
              type="email"
              name="email"
              placeholder="email@example.com"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              required
            />
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  )
}
