import { styled, Stack, Card } from '@mui/material';

const SignInUpContainer = styled(Stack)(({ theme }) => ({
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

const SignInUpCard = styled(Card)(({ theme }) => ({
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

export { SignInUpContainer, SignInUpCard };
