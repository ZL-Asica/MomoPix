import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  styled,
  Card,
  Stack,
} from '@mui/material';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks';
import { emailPasswordUtil } from '@/utils';

const SignInContainer = styled(Stack)(({ theme }) => ({
  padding: theme.spacing(4),
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    inset: 0,
    zIndex: -1,
  },
}));

const LoginCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 450,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  boxShadow: `
    hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, 
    hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px
  `,
  borderRadius: theme.spacing(2),
  ...theme.applyStyles('dark', {
    boxShadow: `
      hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, 
      hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px
    `,
  }),
}));

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithEmail, error, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hasError = emailPasswordUtil(
      email,
      password,
      setEmailError,
      setPasswordError
    );

    if (hasError) return;

    try {
      const user = await loginWithEmail(email, password);
      if (user) {
        toast.success('登录成功');
        navigate('/');
      }
    } catch (error_) {
      console.error(error_);
    }
  };

  return (
    <SignInContainer>
      <LoginCard>
        <Typography
          variant='h4'
          component='h1'
          align='center'
          sx={{ fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
        >
          Sign In
        </Typography>
        <Box
          component='form'
          onSubmit={handleLogin}
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label='Email'
            fullWidth
            type='email'
            value={email}
            placeholder='your@email.com'
            onChange={(event) => setEmail(event.target.value)}
            error={emailError}
            helperText={emailError && 'Email is required'}
          />
          <TextField
            label='Password'
            fullWidth
            type='password'
            placeholder='••••••'
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={passwordError}
            helperText={passwordError && 'Password is required'}
          />
          {error && <Typography color='error'>{error}</Typography>}
          <Button
            type='submit'
            fullWidth
            variant='contained'
            color='primary'
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </Box>

        <Typography sx={{ mt: 2 }} align='center'>
          Don&apos;t have an account?{' '}
          <Link href='/signup' underline='hover'>
            Sign up
          </Link>
        </Typography>
      </LoginCard>
    </SignInContainer>
  );
};

export default LoginPage;
