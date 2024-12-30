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

function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const { loginHandler, loading } = useAuth(setError)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    username: '',
    password: '',
  })
  const [turnstileStatus, setTurnstileStatus]
    = useState<TurnstileStatus>('loading')

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const success = await loginHandler(username, password, setValidationErrors)
    if (success) {
      toast.success('登录成功')
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
          登录
        </Typography>
        <Box
          component="form"
          onSubmit={asyncHandler(async (event_: React.FormEvent<HTMLFormElement>) => {
            await handleLogin(event_)
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
            placeholder="peterAnteater"
            onChange={event => setUsername(event.target.value)}
            error={Boolean(validationErrors.username)}
            helperText={validationErrors.username ?? ' '}
          />
          <TextField
            label="密码"
            fullWidth
            type="password"
            placeholder="••••••"
            value={password}
            onChange={event => setPassword(event.target.value)}
            error={Boolean(validationErrors.password)}
            helperText={validationErrors.password ?? ' '}
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
            sx={{ mt: 2 }}
          >
            {loading ? <SmallLoadingCircle text="登录中..." /> : '登录'}
          </Button>
        </Box>
        <Typography
          sx={{ mt: 2 }}
          align="center"
        >
          没有账号？
          {' '}
          <Link
            href="/signup"
            underline="hover"
          >
            立刻注册
          </Link>
        </Typography>
      </SignInUpCard>
    </SignInUpContainer>
  )
}

export default LoginPage
