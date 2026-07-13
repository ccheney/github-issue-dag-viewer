import { useEffect, useState } from 'react'

export type ColorMode = 'day' | 'night'

const preferredMode = (): ColorMode =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day'

export const useColorMode = (): [ColorMode, () => void] => {
  const [mode, setMode] = useState<ColorMode>(() => preferredMode())

  useEffect(() => {
    document.documentElement.dataset.colorMode = mode === 'night' ? 'dark' : 'light'
  }, [mode])

  return [mode, () => setMode((current) => (current === 'day' ? 'night' : 'day'))]
}
