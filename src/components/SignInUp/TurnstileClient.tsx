import { Turnstile } from '@marsidev/react-turnstile'

interface TurnstileClientProperties {
  setTurnstileStatus: (status: TurnstileStatus) => void
  setError: (error_: string | null) => void
}

function TurnstileClient({
  setTurnstileStatus,
  setError,
}: TurnstileClientProperties) {
  const TurnstileKey = `${import.meta.env.VITE_TURNSTILE}`
  if (!TurnstileKey) {
    setTurnstileStatus('success')
    return
  }

  return (
    <Turnstile
      siteKey={TurnstileKey}
      onSuccess={() => {
        setTurnstileStatus('success')
        setError(null)
      }}
      onError={(error_) => {
        setTurnstileStatus('error')
        setError(error_)
      }}
      onExpire={() => {
        setTurnstileStatus('expired')
        setError('Turnstile 验证失败')
      }}
    />
  )
}

export default TurnstileClient
