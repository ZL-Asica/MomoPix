export function toErr(e: unknown): { error: string } {
  if (typeof e === 'string') {
    return { error: e }
  }
  if (e instanceof Error) {
    return { error: e.message }
  }
  try {
    return { error: JSON.stringify(e) }
  }
  catch {
    return { error: 'Unknown error' }
  }
}
