import { useEffect, useRef, useState } from 'react';
import { Box, Button, ColorPicker, HStack, Portal, Text, parseColor } from '@chakra-ui/react';
import { LuInfo, LuPipette } from 'react-icons/lu';
import { useAppTheme } from '../../../../theme/tokens';
import { luminance } from '../../../../theme/accent';
import { previewCustomAccent, updatePreferences, usePreferences } from '../../../../theme/preferences';

// Tez tanlash uchun takliflar (sariq va ko‘k tayyor variantlarda bor)
const SUGGESTIONS = ['#22C55E', '#14B8A6', '#06B6D4', '#8B5CF6', '#EC4899', '#F43F5E', '#F97316'];
const COMMIT_DELAY = 250;

const toHex = (color) => color.toString('hex').toUpperCase();

/**
 * Maxsus accent rang. Sudrash paytida rang faqat CSS orqali darhol ko‘rsatiladi,
 * to‘xtagach (yoki klaviatura bilan o‘zgartirilgach qisqa pauzadan so‘ng) saqlanadi.
 */
export default function CustomAccentPicker() {
    const { preferences, accent } = usePreferences();
    const { isDark, cardBg, cardBorder, inputBg, inputBorder, textColor, subtitleColor, accentColor, accentDarkText } = useAppTheme();
    const active = preferences.accent === 'custom';
    const saved = preferences.customColor;

    const [color, setColor] = useState(() => parseColor(saved || accent.solid));
    const timer = useRef(null);

    // Boshqa joydan o‘zgarsa — tanlagichni sinxronlash (saqlangan maxsus rang bo‘lmasa, joriy accent ko‘rsatiladi)
    useEffect(() => {
        setColor(parseColor(saved || accent.solid));
    }, [saved, accent.solid]);

    useEffect(() => () => clearTimeout(timer.current), []);

    const commit = (hex) => {
        clearTimeout(timer.current);
        updatePreferences({ accent: 'custom', customColor: hex });
    };

    const handleChange = ({ value }) => {
        setColor(value);
        const hex = toHex(value);
        previewCustomAccent(hex);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => commit(hex), COMMIT_DELAY);
    };

    const chosenHex = toHex(color);
    const adjustedNote = active && accent.adjusted
        ? (luminance(chosenHex) < luminance(accent.solid)
            ? 'Matn o‘qilishi uchun rang biroz ochroq qilib qo‘llandi.'
            : 'Oq fonda ko‘rinishi uchun rang biroz to‘qroq qilib qo‘llandi.')
        : null;

    return (
        <Box
            borderWidth="1.5px"
            borderColor={active ? accentColor : cardBorder}
            boxShadow={active ? `0 0 0 3px ${accentColor}33` : 'none'}
            borderRadius="xl"
            bg={cardBg}
            p={3}
        >
            <HStack justify="space-between" align="start" gap={3} flexWrap="wrap">
                <Box minW={0}>
                    <HStack gap={2}>
                        <Text fontSize="sm" fontWeight="semibold" color={textColor}>Maxsus rang</Text>
                        {active && (
                            <Text as="span" fontSize="xs" fontWeight="semibold" px={2} py={0.5} borderRadius="full" bg={accentColor} color={accentDarkText}>
                                Faol
                            </Text>
                        )}
                    </HStack>
                    <Text fontSize="xs" color={subtitleColor} mt={0.5}>
                        O‘zingizga yoqqan rangni tanlang — hover, faol va chegara ranglari avtomatik hisoblanadi.
                    </Text>
                </Box>
                {!active && saved && (
                    <Button
                        type="button"
                        size="sm"
                        h="2rem"
                        px={3}
                        variant="outline"
                        borderRadius="lg"
                        borderColor={cardBorder}
                        color={textColor}
                        onClick={() => commit(saved)}
                    >
                        Saqlangan rangni qo‘llash
                    </Button>
                )}
            </HStack>

            <ColorPicker.Root
                value={color}
                format="hsba"
                onValueChange={handleChange}
                onValueChangeEnd={({ value }) => commit(toHex(value))}
                mt={3}
                maxW="22rem"
            >
                <ColorPicker.HiddenInput />
                <ColorPicker.Label srOnly>Maxsus accent rang</ColorPicker.Label>
                <ColorPicker.Control>
                    <ColorPicker.Trigger
                        w="2.75rem"
                        h="2.75rem"
                        p={0}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={inputBorder}
                        aria-label="Rang tanlash oynasini ochish"
                        _focusVisible={{ outline: '2px solid', outlineColor: accentColor, outlineOffset: '2px' }}
                    >
                        <ColorPicker.ValueSwatch boxSize="2rem" borderRadius="md" />
                    </ColorPicker.Trigger>
                    <ColorPicker.Input
                        h="2.75rem"
                        px={3}
                        bg={inputBg}
                        borderColor={inputBorder}
                        color={textColor}
                        borderRadius="lg"
                        fontFamily="mono"
                        textTransform="uppercase"
                        aria-label="Rang kodi (HEX)"
                        _focusVisible={{ borderColor: accentColor, boxShadow: `0 0 0 3px ${accentColor}55`, outline: 'none' }}
                    />
                </ColorPicker.Control>
                <Portal>
                    <ColorPicker.Positioner>
                        <ColorPicker.Content bg={isDark ? 'gray.900' : 'white'} borderColor={cardBorder}>
                            <ColorPicker.Area />
                            <HStack gap={2}>
                                <ColorPicker.EyeDropper size="xs" variant="outline" aria-label="Ekrandan rang olish">
                                    <LuPipette />
                                </ColorPicker.EyeDropper>
                                {/* Faqat tus (hue): accent rang shaffof bo‘lmasligi kerak */}
                                <ColorPicker.ChannelSlider channel="hue" flex={1} aria-label="Rang tusi" />
                            </HStack>
                            <ColorPicker.SwatchGroup gap={1.5}>
                                {SUGGESTIONS.map((hex) => (
                                    <ColorPicker.SwatchTrigger key={hex} value={hex} aria-label={hex}>
                                        <ColorPicker.Swatch value={hex} boxSize="1.5rem" borderRadius="md" />
                                    </ColorPicker.SwatchTrigger>
                                ))}
                            </ColorPicker.SwatchGroup>
                        </ColorPicker.Content>
                    </ColorPicker.Positioner>
                </Portal>
            </ColorPicker.Root>

            {adjustedNote && (
                <HStack gap={1.5} mt={2} color={subtitleColor} fontSize="xs">
                    <LuInfo size={13} />
                    <Text>{adjustedNote}</Text>
                </HStack>
            )}
        </Box>
    );
}
