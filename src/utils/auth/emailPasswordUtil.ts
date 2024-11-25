import { toast } from 'sonner';

interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

const validateField = (
  value: string,
  rules: ValidationRule[],
  setError: (value: boolean) => void
): boolean => {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      setError(true);
      toast.error(rule.message);
      return true;
    }
  }
  setError(false);
  return false;
};

const emailPasswordUtil = (
  email: string,
  password: string,
  setEmailError: (value: boolean) => void,
  setPasswordError: (value: boolean) => void
): boolean => {
  let hasError = false;

  const emailRules: ValidationRule[] = [
    { validate: (email) => email.trim() !== '', message: '邮箱不能为空' },
    {
      validate: (email) => /\S+@\S+\.\S+/.test(email),
      message: '邮箱格式不正确',
    },
    {
      validate: (email) => email.includes('@zla.app'),
      message: '本站禁止注册',
    },
  ];

  const passwordRules: ValidationRule[] = [
    { validate: (password) => password.trim() !== '', message: '密码不能为空' },
    {
      validate: (password) => password.length >= 8,
      message: '密码长度至少为 8 位',
    },
    {
      validate: (password) => password.length <= 50,
      message: '密码长度不能超过 50 位',
    },
    {
      validate: (password) => /\d/.test(password),
      message: '密码必须包含数字',
    },
    {
      validate: (password) => /[A-Z]/.test(password),
      message: '密码必须包含大写字母',
    },
    {
      validate: (password) => /[a-z]/.test(password),
      message: '密码必须包含小写字母',
    },
  ];

  hasError ||= validateField(email, emailRules, setEmailError);
  hasError ||= validateField(password, passwordRules, setPasswordError);

  return hasError;
};

export default emailPasswordUtil;
