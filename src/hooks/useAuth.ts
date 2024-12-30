import { login, register } from '@/api'
import { passwordSchema, usernameSchema } from '@/schemas'

import { useAuthStore } from '@/stores'
import { useState } from 'react'
import { z } from 'zod'

function validateInput(email: string, password: string, confirmPassword?: string): ValidationErrors {
  const errors: ValidationErrors = {}

  try {
    usernameSchema.parse(email)
  }
  catch (error_) {
    errors.username
      = error_ instanceof z.ZodError
        ? error_.errors[0]?.message
        : '用户名格式错误'
  }

  try {
    passwordSchema.parse(password)
  }
  catch (error_) {
    errors.password
      = error_ instanceof z.ZodError ? error_.errors[0]?.message : '密码错误'
  }

  if (confirmPassword === undefined) {
    errors.confirmPassword = '请再次输入密码'
  }
  else if (confirmPassword !== password) {
    errors.confirmPassword = '两次输入的密码不一致'
  }

  return errors
}

function useAuth(setError: (error_: string | null) => void) {
  const [loading, setLoading] = useState(false)
  const setUserData = useAuthStore(state => state.setUserData)

  const loginHandler = async (
    username: string,
    password: string,
    onValidationErrors: (errors: ValidationErrors) => void,
  ): Promise<boolean> => {
    const errors = validateInput(username, password)
    if (Object.keys(errors).length > 0) {
      onValidationErrors(errors)
      return false
    }

    try {
      setLoading(true)
      const loginResponse = await login({ username, password })

      setError(null)
      setUserData(loginResponse)
      return true
    }
    catch (error_) {
      setError((error_ as Error).message || '登录失败，服务器错误')
      return false
    }
    finally {
      setLoading(false)
    }
  }

  const registerHandler = async (
    username: string,
    password: string,
    confirmPassword: string,
    onValidationErrors: (errors: ValidationErrors) => void,
  ): Promise<boolean> => {
    const errors = validateInput(username, password, confirmPassword)
    if (Object.keys(errors).length > 0) {
      onValidationErrors(errors)
      return false
    }

    try {
      setLoading(true)
      await register({ username, password })

      setError(null)
      return true
    }
    catch (error_) {
      setError((error_ as Error).message || '登录失败，服务器错误')
      return false
    }
    finally {
      setLoading(false)
    }
  }

  return { loginHandler, registerHandler, loading }
}

export default useAuth
