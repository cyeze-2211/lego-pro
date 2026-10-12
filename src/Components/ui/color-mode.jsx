'use client'

import { ClientOnly, IconButton, Skeleton, Span } from '@chakra-ui/react'
import { ThemeProvider } from 'next-themes'

import * as React from 'react'
import { LuMoon, LuSun } from 'react-icons/lu'
import { updatePreferences, usePreferences } from '../../theme/preferences'

// Rejim foydalanuvchi sozlamalaridan olinadi (theme/preferences.js); next-themes faqat
// <html> ga `light`/`dark` sinfini qo‘yadi, shuning uchun mavzu `forcedTheme` orqali beriladi.
export function ColorModeProvider(props) {
  const { preferences } = usePreferences()
  return (
    <ThemeProvider attribute='class' disableTransitionOnChange forcedTheme={preferences.mode} {...props} />
  )
}

export function useColorMode() {
  const { preferences } = usePreferences()
  const colorMode = preferences.mode
  const setColorMode = (mode) => updatePreferences({ mode })
  const toggleColorMode = () => {
    setColorMode(colorMode === 'dark' ? 'light' : 'dark')
  }
  return {
    colorMode,
    setColorMode,
    toggleColorMode,
  }
}

export function useColorModeValue(light, dark) {
  const { colorMode } = useColorMode()
  return colorMode === 'dark' ? dark : light
}

export function ColorModeIcon() {
  const { colorMode } = useColorMode()
  return colorMode === 'dark' ? <LuMoon /> : <LuSun />
}

export const ColorModeButton = React.forwardRef(
  function ColorModeButton(props, ref) {
    const { toggleColorMode } = useColorMode()
    return (
      <ClientOnly fallback={<Skeleton boxSize='9' />}>
        <IconButton
          onClick={toggleColorMode}
          variant='ghost'
          aria-label='Toggle color mode'
          size='sm'
          ref={ref}
          {...props}
          css={{
            _icon: {
              width: '5',
              height: '5',
            },
          }}
        >
          <ColorModeIcon />
        </IconButton>
      </ClientOnly>
    )
  },
)

export const LightMode = React.forwardRef(function LightMode(props, ref) {
  return (
    <Span
      color='fg'
      display='contents'
      className='chakra-theme light'
      colorPalette='gray'
      colorScheme='light'
      ref={ref}
      {...props}
    />
  )
})

export const DarkMode = React.forwardRef(function DarkMode(props, ref) {
  return (
    <Span
      color='fg'
      display='contents'
      className='chakra-theme dark'
      colorPalette='gray'
      colorScheme='dark'
      ref={ref}
      {...props}
    />
  )
})
