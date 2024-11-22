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
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '@/hooks';
import { emailPasswordUtil } from '@/utils';

const SignUpContainer = styled(Stack)(({ theme }) => ({
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

const RegisterCard = styled(Card)(({ theme }) => ({
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

const SignUpPage = () => {
  const navigate = useNavigate();
  const { registerWithEmail, error, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const hasError = emailPasswordUtil(
      email,
      password,
      setEmailError,
      setPasswordError
    );

    if (password === confirmPassword) {
      setConfirmPasswordError(false);
    } else {
      setConfirmPasswordError(true);
      toast.error('两次输入的密码不一致');
      return;
    }

    if (hasError || confirmPasswordError) return;

    try {
      const user = await registerWithEmail(email, password);
      if (user) {
        toast.success('注册成功');
        navigate('/');
      }
    } catch (error_) {
      console.error(error_);
    }
  };

  return (
    <SignUpContainer>
      <RegisterCard>
        <Typography
          variant='h4'
          component='h1'
          align='center'
          sx={{ fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
        >
          注册
        </Typography>
        <Box
          component='form'
          onSubmit={handleSignUp}
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label='邮箱'
            fullWidth
            type='email'
            value={email}
            placeholder='your@email.com'
            onChange={(event) => setEmail(event.target.value)}
            error={emailError}
            helperText={emailError && '请填写邮箱'}
          />
          <TextField
            label='密码'
            fullWidth
            type='password'
            placeholder='••••••'
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={passwordError}
            helperText={passwordError && '密码必须符合要求'}
          />
          <TextField
            label='确认密码'
            fullWidth
            type='password'
            placeholder='••••••'
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={confirmPasswordError}
            helperText={confirmPasswordError && '两次输入的密码不一致'}
          />
          {error && (
            <Typography
              color='error'
              sx={{ mt: 1 }}
            >
              {error}
            </Typography>
          )}
          <Button
            type='submit'
            fullWidth
            variant='contained'
            color='primary'
            disabled={loading}
          >
            {loading ? '注册中...' : '注册'}
          </Button>
        </Box>
        <Typography align='center'>
          已经有账号了？{' '}
          <Link
            href='/signin'
            underline='hover'
            color='primary'
          >
            立刻登录
          </Link>
        </Typography>
      </RegisterCard>
    </SignUpContainer>
  );
};

export default SignUpPage;
