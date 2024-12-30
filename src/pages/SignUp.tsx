import { SmallLoadingCircle } from '@/components'
import {
  SignInUpCard,
  SignInUpContainer,
  TurnstileClient,
} from '@/components/SignInUp'
import { useAuth } from '@/hooks'
import { asyncHandler } from '@/utils'
import { Box, Button, Link, TextField, Typography } from '@mui/material'

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { toast } from 'sonner'

function SignUpPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const { registerHandler, loading } = useAuth(setError)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [turnstileStatus, setTurnstileStatus]
    = useState<TurnstileStatus>('loading')

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    username: '',
    password: '',
    confirmPassword: '',
  })

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const success = await registerHandler(
      username,
      password,
      confirmPassword,
      setValidationErrors,
    )
    if (success) {
      toast.success('注册成功')
      await navigate('/')
    }
  }

  useEffect(() => {
    if (error !== null)
      toast.error(error)
  }, [error])

  return (
    <SignInUpContainer>
      <SignInUpCard>
        <Typography
          variant="h4"
          component="h1"
          align="center"
          sx={{ fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
        >
          注册
        </Typography>
        <Box
          component="form"
          onSubmit={asyncHandler(async (event_: React.FormEvent<HTMLFormElement>) => {
            await handleSignUp(event_)
          })}
          noValidate
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            alignItems: 'center',
          }}
        >
          <TextField
            label="用户名"
            fullWidth
            type="text"
            value={username}
            placeholder="perterAnteater"
            onChange={event => setUsername(event.target.value)}
            error={Boolean(validationErrors.username)}
            helperText={validationErrors.username ?? ''}
          />
          <TextField
            label="密码"
            fullWidth
            type="password"
            placeholder="••••••"
            value={password}
            onChange={event => setPassword(event.target.value)}
            error={Boolean(validationErrors.password)}
            helperText={validationErrors.password ?? ''}
          />
          <TextField
            label="确认密码"
            fullWidth
            type="password"
            placeholder="••••••"
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            error={Boolean(validationErrors.confirmPassword)}
            helperText={validationErrors.confirmPassword ?? ''}
          />
          <TurnstileClient
            setTurnstileStatus={setTurnstileStatus}
            setError={setError}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading || turnstileStatus !== 'success'}
          >
            {loading ? <SmallLoadingCircle text="注册中..." /> : '注册'}
          </Button>
        </Box>
        <Typography align="center">
          已经有账号了？
          {' '}
          <Link
            href="/signin"
            underline="hover"
            color="primary"
          >
            立刻登录
          </Link>
        </Typography>
      </SignInUpCard>
    </SignInUpContainer>
  )
}

export default SignUpPage
