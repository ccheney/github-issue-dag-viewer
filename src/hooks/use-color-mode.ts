import { useEffect, useState } from 'react'

export type ColorMode = 'light' | 'dark'
export type ColorModePreference = ColorMode | 'auto'

const preferredMode = (): ColorMode =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const nextPreference: Record<ColorModePreference, ColorModePreference> = {
  auto: 'light',
  light: 'dark',
  dark: 'auto',
}

export const useColorMode = (): [ColorModePreference, ColorMode, () => void] => {
  const [preference, setPreference] = useState<ColorModePreference>('auto')
  const [systemMode, setSystemMode] = useState<ColorMode>(() => preferredMode())

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemMode = (event: MediaQueryListEvent): void =>
      setSystemMode(event.matches ? 'dark' : 'light')
    media.addEventListener('change', updateSystemMode)
    return () => media.removeEventListener('change', updateSystemMode)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.colorMode = preference
  }, [preference])

  return [
    preference,
    preference === 'auto' ? systemMode : preference,
    () => setPreference((current) => nextPreference[current]),
  ]
}
