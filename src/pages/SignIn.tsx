import { useState } from 'react';
import { Box, Button, TextField, Typography, Link } from '@mui/material';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks';
import { SmallLoadingCircle } from '@/components';

import { SignInUpContainer, SignInUpCard } from '@/components/SignInUp/Styles';

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginHandler, error, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    username: '',
    password: '',
  });

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const success = await loginHandler(username, password, setValidationErrors);
    if (success) {
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
            label='用户名'
            fullWidth
            type='text'
            value={username}
            placeholder='peterAnteater'
            onChange={(event) => setUsername(event.target.value)}
            error={Boolean(validationErrors.username)}
            helperText={validationErrors.username || ' '}
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
            {loading ? <SmallLoadingCircle text='登录中...' /> : '登录'}
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
