import { useEffect, useState } from 'react'

export type ColorMode = 'light' | 'dark'

const preferredMode = (): ColorMode =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export const useColorMode = (): ColorMode => {
  const [mode, setMode] = useState<ColorMode>(() => preferredMode())

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const updateMode = (event: MediaQueryListEvent): void =>
      setMode(event.matches ? 'dark' : 'light')
    media.addEventListener('change', updateMode)
    return () => media.removeEventListener('change', updateMode)
  }, [])

  return mode
}
