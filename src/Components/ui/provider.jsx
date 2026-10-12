'use client'

import { ChakraProvider, createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'
import { ColorModeProvider } from './color-mode'
import { ACCENT_SHADES } from '../../theme/accent'

// Chakra `yellow` palitrasi loyihaning accent rangi: qiymatlar CSS o‘zgaruvchilardan olinadi
// (theme/preferences.js tanlangan mavzuga qarab yangilaydi). Sariq mavzuda qiymatlar Chakra standartiga teng.
const accentConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        yellow: Object.fromEntries(
          ACCENT_SHADES.map((shade) => [shade, { value: `rgb(var(--accent-${shade}))` }]),
        ),
      },
    },
    semanticTokens: {
      colors: {
        yellow: {
          contrast: { value: 'var(--accent-contrast)' },
        },
      },
    },
  },
})

const system = createSystem(defaultConfig, accentConfig)

export function Provider(props) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider {...props} />
    </ChakraProvider>
  )
}
