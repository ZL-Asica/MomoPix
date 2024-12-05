import { useState } from 'react';
import { Box, Button, TextField, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '@/hooks';
import { SmallLoadingCircle } from '@/components';

import { SignInUpContainer, SignInUpCard } from '@/components/SignInUp/Styles';

const SignUpPage = () => {
  const navigate = useNavigate();
  const { registerWithEmail, error, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const user = await registerWithEmail(
      email,
      password,
      confirmPassword,
      setValidationErrors
    );
    if (user) {
      toast.success('注册成功');
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
            error={Boolean(validationErrors.email)}
            helperText={validationErrors.email || ''}
          />
          <TextField
            label='密码'
            fullWidth
            type='password'
            placeholder='••••••'
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={Boolean(validationErrors.password)}
            helperText={validationErrors.password || ''}
          />
          <TextField
            label='确认密码'
            fullWidth
            type='password'
            placeholder='••••••'
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={Boolean(validationErrors.confirmPassword)}
            helperText={validationErrors.confirmPassword || ''}
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
            {loading ? <SmallLoadingCircle text='注册中...' /> : '注册'}
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
      </SignInUpCard>
    </SignInUpContainer>
  );
};

export default SignUpPage;
