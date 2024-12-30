function asyncHandler<T extends unknown[]>(
  fn: (...args: T) => Promise<void>,
): (...args: T) => void {
  return (...args: T) => {
    fn(...args).catch((error) => {
      console.error('Unexpected error:', error)
    })
  }
}

export default asyncHandler
