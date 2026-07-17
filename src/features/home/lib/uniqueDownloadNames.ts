function splitExtension(name: string): { base: string, extension: string } {
  const lastDot = name.lastIndexOf('.')
  if (lastDot <= 0) {
    return { base: name, extension: '' }
  }
  return {
    base: name.slice(0, lastDot),
    extension: name.slice(lastDot),
  }
}

/** Returns stable, case-insensitively unique names for ZIP entries. */
export function uniqueDownloadNames(names: readonly string[]): string[] {
  const used = new Set<string>()
  return names.map((name) => {
    const { base, extension } = splitExtension(name)
    let candidate = name
    let suffix = 2
    while (used.has(candidate.toLowerCase())) {
      candidate = `${base} (${suffix})${extension}`
      suffix += 1
    }
    used.add(candidate.toLowerCase())
    return candidate
  })
}
