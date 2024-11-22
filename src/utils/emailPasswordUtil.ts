import { toast } from 'sonner';

const emailPasswordUtil = (
  email: string,
  password: string,
  setEmailError: (value: boolean) => void,
  setPasswordError: (value: boolean) => void
): boolean => {
  let hasError = false;

  // Check if email or password is empty
  if (email) {
    setEmailError(false);
  } else {
    setEmailError(true);
    toast.error('邮箱不能为空');
    hasError = true;
  }

  if (password) {
    setPasswordError(false);
  } else {
    setPasswordError(true);
    toast.error('密码不能为空');
    hasError = true;
  }

  // Check email format
  if (!/\S+@\S+\.\S+/.test(email) || email.length < 5) {
    setEmailError(true);
    toast.error('邮箱格式不正确');
    hasError = true;
  }

  if (!email.includes('@zla.app')) {
    setEmailError(true);
    toast.error('本站禁止注册');
    hasError = true;
  }

  // Check password rules
  if (password.length < 8) {
    setPasswordError(true);
    toast.error('密码长度至少为 8 位');
    hasError = true;
  }

  if (password.length > 50) {
    setPasswordError(true);
    toast.error('密码长度不能超过 50 位');
    hasError = true;
  }

  if (!/\d/.test(password)) {
    setPasswordError(true);
    toast.error('密码必须包含数字');
    hasError = true;
  }

  if (!/[A-Z]/.test(password)) {
    setPasswordError(true);
    toast.error('密码必须包含大写字母');
    hasError = true;
  }

  if (!/[a-z]/.test(password)) {
    setPasswordError(true);
    toast.error('密码必须包含小写字母');
    hasError = true;
  }

  return hasError;
};

export default emailPasswordUtil;
