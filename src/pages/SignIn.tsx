import { useState } from 'react';
import { Box, Button, TextField, Typography, Link } from '@mui/material';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks';

import { SignInUpContainer, SignInUpCard } from '@/components/SignInUp/Styles';

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithEmail, error, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    email: '',
    password: '',
  });

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const user = await loginWithEmail(email, password, setValidationErrors);
    if (user) {
      toast.success('登录成功');
      navigate('/');
    }
  };

  return (
    <SignInUpContainer>
      <SignInUpCard>
        <Typography
          variant='h4'
          component='h1'
          align='center'
          sx={{ fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
        >
          登录
        </Typography>
        <Box
          component='form'
          onSubmit={handleLogin}
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
            error={Boolean(validationErrors.email)}
            helperText={validationErrors.email || ' '}
          />
          <TextField
            label='密码'
            fullWidth
            type='password'
            placeholder='••••••'
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={Boolean(validationErrors.password)}
            helperText={validationErrors.password || ' '}
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
            {loading ? '登录中...' : '登录'}
          </Button>
        </Box>

        <Typography
          sx={{ mt: 2 }}
          align='center'
        >
          没有账号？{' '}
          <Link
            href='/signup'
            underline='hover'
          >
            立刻注册
          </Link>
        </Typography>
      </SignInUpCard>
    </SignInUpContainer>
  );
};

export default LoginPage;
